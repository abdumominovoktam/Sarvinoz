import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db import transaction, IntegrityError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.users.models import StudentProfile
from apps.users.permissions import IsActiveUnblockedUser
from apps.results.models import GameResult, ViolationLog
from apps.leaderboard.services import calculate_fair_game_score, update_user_aggregates
from .models import Game, Question, GameSession, Answer
from .serializers import (
    GameListSerializer,
    StudentQuestionSerializer,
    GameSessionSerializer,
)


def evaluate_answer(question: Question, submitted_answer) -> bool:
    """Evaluates a student's submitted answer against the canonical correct_answer."""
    if submitted_answer is None:
        return False

    correct = question.correct_answer

    # Process chain (ordered list comparison)
    if question.question_type == 'process_chain' or isinstance(correct, list):
        if not isinstance(submitted_answer, list) or not isinstance(correct, list):
            return False
        if len(submitted_answer) != len(correct):
            return False
        return [str(x).strip() for x in submitted_answer] == [str(x).strip() for x in correct]

    # Standard string/choice/word/value comparison
    sub_str = str(submitted_answer).strip().upper()
    cor_str = str(correct).strip().upper()
    return bool(sub_str and sub_str == cor_str)


def finalize_game_session(
    session: GameSession,
    final_status: str = 'completed',
    submitted_answers_map: dict | None = None,
) -> GameResult:
    """
    Server-authoritative finalization of a GameSession.
    If final_status == 'violation', score is strictly 0 (no points awarded).
    """
    now = timezone.now()
    question_ids = session.session_data.get('question_ids', [])
    questions = list(Question.objects.filter(id__in=question_ids))
    q_map = {q.id: q for q in questions}

    # Merge any final payload answers into Answer table (only if not a rule violation)
    if final_status != 'violation' and submitted_answers_map and isinstance(submitted_answers_map, dict):
        for q_id_raw, ans_val in submitted_answers_map.items():
            try:
                q_id = int(q_id_raw)
            except (ValueError, TypeError):
                continue
            question = q_map.get(q_id)
            if not question:
                continue
            is_corr = evaluate_answer(question, ans_val)
            Answer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    'user': session.user,
                    'submitted_answer': ans_val,
                    'is_correct': is_corr,
                    'points_earned': question.points if is_corr else 0.0,
                }
            )

    existing_answers = {a.question_id: a for a in Answer.objects.filter(session=session)}
    total_questions = len(question_ids) if question_ids else len(questions)
    correct_count = sum(1 for q_id in question_ids if existing_answers.get(q_id) and existing_answers[q_id].is_correct)
    wrong_count = max(0, total_questions - correct_count)

    session.completed_at = now
    session.status = final_status
    session.save(update_fields=['completed_at', 'status'])

    elapsed_seconds = max(1, min(session.game.duration_seconds, int((now - session.started_at).total_seconds())))
    if final_status == 'time_expired':
        elapsed_seconds = session.game.duration_seconds

    if final_status == 'violation':
        # 1 marta qoida buzilganda topshiriq tugatiladi va ball berilmaydi (0 ball)
        score = 0
        accuracy = 0.0
    else:
        accuracy = round((correct_count / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
        score = calculate_fair_game_score(
            correct_count=correct_count,
            total_questions=total_questions,
            time_spent_seconds=elapsed_seconds,
            duration_seconds=session.game.duration_seconds,
            max_score=session.game.max_score,
        )

    game_result, _ = GameResult.objects.update_or_create(
        user=session.user,
        game=session.game,
        defaults={
            'session': session,
            'score': score,
            'max_score': session.game.max_score,
            'correct_answers': 0 if final_status == 'violation' else correct_count,
            'wrong_answers': total_questions if final_status == 'violation' else wrong_count,
            'accuracy': accuracy,
            'time_spent': elapsed_seconds,
            'status': final_status,
            'started_at': session.started_at,
            'completed_at': now,
        }
    )

    update_user_aggregates(session.user, recalculate_ranks=True)
    return game_result


def check_and_expire_overdue_sessions(user):
    """Checks if global timer or any active game session has expired and auto-finalizes them."""
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    now = timezone.now()
    global_expired = profile.is_global_time_expired()

    active_sessions = GameSession.objects.filter(user=user, status='in_progress').select_related('game')
    for sess in active_sessions:
        if global_expired or now >= sess.expires_at:
            finalize_game_session(sess, final_status='time_expired')

    if global_expired and not profile.is_completed:
        profile.is_completed = True
        profile.completed_at = now
        profile.save(update_fields=['is_completed', 'completed_at'])
        update_user_aggregates(user, recalculate_ranks=True)


def build_word_search_grid(words: list[str], size: int = 14) -> dict:
    """Generates a 14x14 letter grid containing all target words horizontally, vertically, and diagonally."""
    grid = [['' for _ in range(size)] for _ in range(size)]
    placements = []
    directions = [(0, 1), (1, 0), (1, 1), (-1, 1)]

    sorted_words = sorted([w.upper().strip() for w in words if len(w.strip()) <= size], key=len, reverse=True)
    for word in sorted_words:
        placed = False
        attempts = 250
        while attempts > 0 and not placed:
            attempts -= 1
            dr, dc = random.choice(directions)
            r_start = random.randint(0, size - 1)
            c_start = random.randint(0, size - 1)
            r_end = r_start + dr * (len(word) - 1)
            c_end = c_start + dc * (len(word) - 1)
            if not (0 <= r_end < size and 0 <= c_end < size):
                continue
            can_place = True
            for i, ch in enumerate(word):
                rr = r_start + dr * i
                cc = c_start + dc * i
                if grid[rr][cc] not in ('', ch):
                    can_place = False
                    break
            if can_place:
                coords = []
                for i, ch in enumerate(word):
                    rr = r_start + dr * i
                    cc = c_start + dc * i
                    grid[rr][cc] = ch
                    coords.append([rr, cc])
                placements.append({'word': word, 'coords': coords})
                placed = True

        # Deterministic fallback row placement if random didn't hit
        if not placed:
            for r in range(size):
                if len(word) <= size and all(grid[r][i] in ('', word[i]) for i in range(len(word))):
                    coords = []
                    for i, ch in enumerate(word):
                        grid[r][i] = ch
                        coords.append([r, i])
                    placements.append({'word': word, 'coords': coords})
                    placed = True
                    break

    alphabet = "ABCDEFGHIKLMNOPRSTUVXYZ"
    for r in range(size):
        for c in range(size):
            if not grid[r][c]:
                grid[r][c] = random.choice(alphabet)

    return {'grid': grid, 'size': size, 'placements': placements}


class DashboardOverviewView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        check_and_expire_overdue_sessions(request.user)
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        games = Game.objects.filter(is_active=True).order_by('order')
        sessions = GameSession.objects.filter(user=request.user)
        results = GameResult.objects.filter(user=request.user)

        sessions_map = {s.game_id: s for s in sessions}
        results_map = {r.game_id: r for r in results}

        total_score = sum(r.score for r in results)
        completed_count = len(results)
        total_games = games.count() or 8
        max_possible_score = sum(g.max_score for g in games) or 867

        serializer = GameListSerializer(
            games,
            many=True,
            context={'sessions_map': sessions_map, 'results_map': results_map},
        )

        return Response({
            'global_timer': {
                'started_at': profile.global_timer_started_at,
                'budget_seconds': profile.global_time_budget_seconds,
                'remaining_seconds': profile.get_remaining_global_seconds(),
                'elapsed_seconds': profile.get_elapsed_global_seconds(),
                'is_expired': profile.is_global_time_expired(),
                'is_completed': profile.is_completed,
            },
            'stats': {
                'completed_games': completed_count,
                'total_games': total_games,
                'total_score': total_score,
                'max_possible_score': max_possible_score,
                'rules_accepted': profile.rules_accepted,
            },
            'games': serializer.data,
        })


class StartGameSessionView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def post(self, request, game_order: int):
        check_and_expire_overdue_sessions(request.user)
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)

        if not profile.rules_accepted:
            return Response(
                {'detail': "O‘yinni boshlashdan oldin qoidalarni qabul qilishingiz shart."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if profile.is_global_time_expired():
            return Response(
                {'detail': "Umumiy 50 daqiqalik vaqt budjeti tugagan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        game = get_object_or_404(Game, order=game_order, is_active=True)

        existing_result = GameResult.objects.filter(user=request.user, game=game).first()
        if existing_result:
            return Response(
                {
                    'detail': "Ushbu o‘yinni faqat bir marta bajarish mumkin. Qayta urinib bo‘lmaydi.",
                    'status': existing_result.status,
                    'result': {
                        'score': existing_result.score,
                        'max_score': existing_result.max_score,
                        'correct_answers': existing_result.correct_answers,
                        'wrong_answers': existing_result.wrong_answers,
                        'accuracy': existing_result.accuracy,
                        'time_spent': existing_result.time_spent,
                        'status': existing_result.status,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        if not profile.global_timer_started_at:
            profile.global_timer_started_at = now
            profile.save(update_fields=['global_timer_started_at'])

        session = GameSession.objects.filter(user=request.user, game=game).first()
        if session and session.status != 'in_progress':
            return Response(
                {'detail': "Ushbu o‘yin yakunlangan. Qayta boshlash mumkin emas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def _generate_session_data():
            all_questions = list(Question.objects.filter(game=game).order_by('id'))
            if game.game_type != 'crossword':
                random.shuffle(all_questions)

            limits = {
                'quiz': 12,
                'crossword': 12,
                'word_search': 13,
                'scramble': 7,
                'process_chain': 3,
                'matching': 8,
                'bingo': 10,
                'diagram': 6,
            }
            limit = limits.get(game.game_type, 10)
            selected_questions = all_questions[:limit]
            question_ids = [q.id for q in selected_questions]

            extra_data = {'question_ids': question_ids}

            if game.game_type == 'word_search':
                words = [str(q.correct_answer).strip().upper() for q in selected_questions]
                ws_data = build_word_search_grid(words, size=14)
                extra_data['word_search_grid'] = ws_data['grid']
                extra_data['grid_size'] = ws_data['size']
                extra_data['placements'] = ws_data['placements']

            elif game.game_type == 'matching':
                definitions = [str(q.correct_answer).strip() for q in selected_questions]
                random.shuffle(definitions)
                extra_data['shuffled_definitions'] = definitions

            elif game.game_type == 'bingo':
                correct_vals = [str(q.correct_answer).strip() for q in selected_questions]
                distractors = [
                    "0", "1", "10", "11", "100", "101", "110", "111",
                    "1000", "1010", "1100", "1111", "A", "B", "C", "D", "E", "F",
                    "8", "12", "15", "16", "32", "64", "128", "255"
                ]
                board_cells = []
                for v in correct_vals:
                    if v not in board_cells:
                        board_cells.append(v)
                for d in distractors:
                    if len(board_cells) >= 16:
                        break
                    if d not in board_cells:
                        board_cells.append(d)
                while len(board_cells) < 16:
                    board_cells.append(str(random.randint(17, 250)))
                board_cells = board_cells[:16]
                random.shuffle(board_cells)
                extra_data['bingo_board'] = board_cells

            return extra_data

        if not session:
            extra_data = _generate_session_data()
            remaining_global = profile.get_remaining_global_seconds()
            effective_duration = min(game.duration_seconds, remaining_global)
            expires_at = now + timedelta(seconds=effective_duration)

            try:
                with transaction.atomic():
                    session, _ = GameSession.objects.get_or_create(
                        user=request.user,
                        game=game,
                        defaults={
                            'status': 'in_progress',
                            'expires_at': expires_at,
                            'session_data': extra_data,
                        },
                    )
            except IntegrityError:
                session = GameSession.objects.get(user=request.user, game=game)

        question_ids = session.session_data.get('question_ids', [])
        questions_qs = Question.objects.filter(id__in=question_ids)
        q_dict = {q.id: q for q in questions_qs}
        ordered_questions = [q_dict[qid] for qid in question_ids if qid in q_dict]

        if not ordered_questions:
            session.session_data = _generate_session_data()
            session.save(update_fields=['session_data'])
            question_ids = session.session_data.get('question_ids', [])
            questions_qs = Question.objects.filter(id__in=question_ids)
            q_dict = {q.id: q for q in questions_qs}
            ordered_questions = [q_dict[qid] for qid in question_ids if qid in q_dict]

        saved_answers = Answer.objects.filter(session=session)
        saved_answers_map = {
            a.question_id: {
                'submitted_answer': a.submitted_answer,
                'is_correct': a.is_correct,
            }
            for a in saved_answers
        }

        return Response({
            'game': {
                'id': game.id,
                'order': game.order,
                'slug': game.slug,
                'title': game.title,
                'description': game.description,
                'game_type': game.game_type,
                'duration_seconds': game.duration_seconds,
                'max_score': game.max_score,
                'icon_name': game.icon_name,
            },
            'session': GameSessionSerializer(session).data,
            'global_remaining_seconds': profile.get_remaining_global_seconds(),
            'questions': StudentQuestionSerializer(ordered_questions, many=True).data,
            'saved_answers': saved_answers_map,
        })


class SubmitSingleAnswerView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    @transaction.atomic
    def post(self, request, game_order: int):
        check_and_expire_overdue_sessions(request.user)
        game = get_object_or_404(Game, order=game_order, is_active=True)
        session = get_object_or_404(GameSession, user=request.user, game=game)

        if session.status != 'in_progress':
            return Response(
                {
                    'detail': "O‘yin seansi yakunlangan.",
                    'status': session.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = request.data.get('question_id')
        submitted_answer = request.data.get('answer')

        question = get_object_or_404(Question, id=question_id, game=game)
        is_correct = evaluate_answer(question, submitted_answer)

        Answer.objects.update_or_create(
            session=session,
            question=question,
            defaults={
                'user': request.user,
                'submitted_answer': submitted_answer,
                'is_correct': is_correct,
                'points_earned': question.points if is_correct else 0.0,
            }
        )

        return Response({
            'question_id': question.id,
            'is_correct': is_correct,
            'correct_answer': question.correct_answer,
            'explanation': question.explanation,
            'remaining_seconds': session.get_remaining_seconds(),
        })


class FinishGameSessionView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    @transaction.atomic
    def post(self, request, game_order: int):
        game = get_object_or_404(Game, order=game_order, is_active=True)
        session = get_object_or_404(GameSession, user=request.user, game=game)

        existing_result = GameResult.objects.filter(user=request.user, game=game).first()
        if existing_result and session.status != 'in_progress':
            return Response({
                'message': "O‘yin natijasi saqlangan.",
                'result': {
                    'game_order': game.order,
                    'game_title': game.title,
                    'score': existing_result.score,
                    'max_score': existing_result.max_score,
                    'correct_answers': existing_result.correct_answers,
                    'wrong_answers': existing_result.wrong_answers,
                    'accuracy': existing_result.accuracy,
                    'time_spent': existing_result.time_spent,
                    'status': existing_result.status,
                    'completed_at': existing_result.completed_at,
                },
            })

        now = timezone.now()
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        is_overdue = (now > session.expires_at + timedelta(seconds=2)) or profile.is_global_time_expired()
        final_status = 'time_expired' if is_overdue else 'completed'

        answers_payload = request.data.get('answers', {})
        result = finalize_game_session(
            session=session,
            final_status=final_status,
            submitted_answers_map=answers_payload if isinstance(answers_payload, dict) else None,
        )

        all_completed = GameResult.objects.filter(user=request.user).count() >= Game.objects.filter(is_active=True).count()

        return Response({
            'message': "O‘yin muvaffaqiyatli yakunlandi!",
            'all_games_completed': all_completed,
            'result': {
                'game_order': game.order,
                'game_title': game.title,
                'score': result.score,
                'max_score': result.max_score,
                'correct_answers': result.correct_answers,
                'wrong_answers': result.wrong_answers,
                'accuracy': result.accuracy,
                'time_spent': result.time_spent,
                'status': result.status,
                'completed_at': result.completed_at,
            },
        })


class ReportViolationView(APIView):
    """
    Logs anti-cheat event and immediately terminates the active game session
    on the 1st violation with 0 points ('Qoidabuzildi').
    """
    permission_classes = [IsActiveUnblockedUser]

    @transaction.atomic
    def post(self, request):
        violation_type = request.data.get('violation_type', 'tab_switch')
        description = request.data.get('description', 'Test oynasidan chiqish holati aniqlandi.')
        game_order = request.data.get('game_order')

        game = None
        session = None
        if game_order:
            game = Game.objects.filter(order=game_order).first()
            if game:
                session = GameSession.objects.filter(user=request.user, game=game, status='in_progress').first()

        ViolationLog.objects.create(
            user=request.user,
            game=game,
            violation_type=violation_type,
            description=description,
        )

        if session:
            session.violation_count += 1
            session.save(update_fields=['violation_count'])

            msg = "Qoidabuzarlik aniqlandi! Siz o‘yin oynasidan chiqdingiz. Topshiriq tugatildi va 0 ball berildi."
            result = finalize_game_session(session, final_status='violation')
            return Response({
                'violation_count': session.violation_count,
                'max_violations': 1,
                'warning_level': 3,
                'status': 'violation',
                'terminated': True,
                'message': msg,
                'result': {
                    'game_order': game.order,
                    'game_title': game.title,
                    'score': 0,
                    'max_score': result.max_score,
                    'correct_answers': 0,
                    'wrong_answers': result.wrong_answers,
                    'accuracy': 0.0,
                    'time_spent': result.time_spent,
                    'status': 'violation',
                },
            })

        return Response({
            'violation_count': 1,
            'max_violations': 1,
            'warning_level': 3,
            'status': 'violation',
            'terminated': True,
            'message': "Qoidabuzarlik qayd etildi.",
        })
