from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User, Group, StudentProfile
from apps.games.models import Game, Question, GameSession
from apps.results.models import GameResult, ViolationLog
from apps.leaderboard.models import Leaderboard
from apps.leaderboard.services import calculate_fair_game_score, update_user_aggregates, recalculate_all_rankings


class PlatformBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.group = Group.objects.create(name='162-23')
        self.game1 = Game.objects.create(
            order=1,
            slug='quiz',
            title='Tezkor viktorina',
            description='Test quiz',
            game_type='quiz',
            duration_seconds=600,
            max_score=180,
        )
        self.q1 = Question.objects.create(
            game=self.game1,
            question_text='1 byte necha bit?',
            question_type='multiple_choice',
            options={'A': '4', 'B': '8', 'C': '16', 'D': '32'},
            correct_answer='B',
            points=15,
            difficulty='Easy',
        )
        self.q2 = Question.objects.create(
            game=self.game1,
            question_text='10 ning binary ko‘rinishi?',
            question_type='multiple_choice',
            options={'A': '1010', 'B': '1100', 'C': '1001', 'D': '1110'},
            correct_answer='A',
            points=15,
            difficulty='Medium',
        )

    def test_1_authentication_and_validation(self):
        # Short password should fail
        res_bad = self.client.post('/api/auth/register/', {
            'first_name': 'Ali',
            'last_name': 'Valiyev',
            'group': '162-23',
            'email': 'ali@test.uz',
            'password': '123',
        }, format='json')
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid registration
        res_ok = self.client.post('/api/auth/register/', {
            'first_name': 'Ali',
            'last_name': 'Valiyev',
            'group': '162-23',
            'email': 'ali@test.uz',
            'password': 'password123',
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res_ok.data)

        # Duplicate email should fail
        res_dup = self.client.post('/api/auth/register/', {
            'first_name': 'Ali2',
            'last_name': 'Valiyev2',
            'group': '162-23',
            'email': 'ali@test.uz',
            'password': 'password123',
        }, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_2_rules_and_game_session_flow(self):
        user = User.objects.create_user(
            email='student@test.uz',
            password='password123',
            first_name='Oktam',
            last_name='Abdumominov',
            group=self.group,
        )
        StudentProfile.objects.create(user=user, rules_accepted=False)
        self.client.force_authenticate(user=user)

        # Cannot start game before accepting rules
        start_blocked = self.client.post('/api/games/1/start/')
        self.assertEqual(start_blocked.status_code, status.HTTP_403_FORBIDDEN)

        # Accept rules
        rules_res = self.client.post('/api/auth/accept-rules/', {'accepted': True}, format='json')
        self.assertEqual(rules_res.status_code, status.HTTP_200_OK)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.rules_accepted)
        self.assertIsNone(user.profile.global_timer_started_at)

        # Start Game 1 -> triggers global timer!
        start_ok = self.client.post('/api/games/1/start/')
        self.assertEqual(start_ok.status_code, status.HTTP_200_OK)
        user.profile.refresh_from_db()
        self.assertIsNotNone(user.profile.global_timer_started_at)

        # Submit game
        sub_res = self.client.post('/api/games/1/submit/', {
            'answers': {str(self.q1.id): 'B', str(self.q2.id): 'A'}
        }, format='json')
        self.assertEqual(sub_res.status_code, status.HTTP_200_OK)
        self.assertEqual(sub_res.data['result']['score'], 180)

        # Cannot restart completed game
        restart_res = self.client.post('/api/games/1/start/')
        self.assertEqual(restart_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_3_score_calculation_fairness(self):
        # 0 correct -> 0 points even if super fast
        self.assertEqual(calculate_fair_game_score(0, 10, 5, 600, 180), 0)
        # 10/10 correct in fast time -> full 180 points
        self.assertEqual(calculate_fair_game_score(10, 10, 200, 600, 180), 180)
        # 5/10 correct -> bounded around 50% (between 84 and 90)
        half_score = calculate_fair_game_score(5, 10, 300, 600, 180)
        self.assertTrue(80 <= half_score <= 90)

    def test_4_leaderboard_tie_breaking(self):
        u1 = User.objects.create_user(email='u1@test.uz', password='pw', first_name='A', last_name='A', group=self.group)
        u2 = User.objects.create_user(email='u2@test.uz', password='pw', first_name='B', last_name='B', group=self.group)
        now = timezone.now()

        # Both have 150 points, but u2 finished in 120s vs u1 in 200s -> u2 should rank #1
        GameResult.objects.create(user=u1, game=self.game1, score=150, max_score=180, correct_answers=8, wrong_answers=2, accuracy=80.0, time_spent=200, completed_at=now)
        GameResult.objects.create(user=u2, game=self.game1, score=150, max_score=180, correct_answers=8, wrong_answers=2, accuracy=80.0, time_spent=120, completed_at=now)
        update_user_aggregates(u1, recalculate_ranks=False)
        update_user_aggregates(u2, recalculate_ranks=True)

        lb1 = Leaderboard.objects.get(user=u1)
        lb2 = Leaderboard.objects.get(user=u2)
        self.assertEqual(lb2.rank, 1)
        self.assertEqual(lb1.rank, 2)

    def test_5_anti_cheat_violation_progression(self):
        user = User.objects.create_user(email='cheat@test.uz', password='pw', first_name='C', last_name='C', group=self.group)
        StudentProfile.objects.create(user=user, rules_accepted=True, global_timer_started_at=timezone.now())
        session = GameSession.objects.create(
            user=user,
            game=self.game1,
            status='in_progress',
            expires_at=timezone.now() + timedelta(minutes=10),
            session_data={'question_ids': [self.q1.id, self.q2.id]},
        )
        self.client.force_authenticate(user=user)

        res = self.client.post('/api/games/violation/', {
            'game_order': 1,
            'violation_type': 'tab_switch',
            'description': 'Test violation #1',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['terminated'])
        self.assertEqual(res.data['status'], 'violation')
        self.assertEqual(res.data['result']['score'], 0)

        session.refresh_from_db()
        self.assertEqual(session.status, 'violation')

    def test_6_permissions_rbac(self):
        student = User.objects.create_user(email='st@test.uz', password='pw', first_name='S', last_name='T', role='student')
        admin = User.objects.create_superuser(email='ad@test.uz', password='pw', first_name='A', last_name='D')

        self.client.force_authenticate(user=student)
        res_forbidden = self.client.get('/api/admin-panel/statistics/')
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=admin)
        res_allowed = self.client.get('/api/admin-panel/statistics/')
        self.assertEqual(res_allowed.status_code, status.HTTP_200_OK)
