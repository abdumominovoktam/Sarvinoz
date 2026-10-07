from django.db.models import Avg, Max, Count
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.users.permissions import IsActiveUnblockedUser
from apps.users.serializers import UserSerializer
from apps.games.models import Game, GameSession
from apps.games.views import check_and_expire_overdue_sessions
from apps.leaderboard.models import Leaderboard
from apps.leaderboard.services import update_user_aggregates
from .models import GameResult, ViolationLog


class MyResultsAndProfileView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        check_and_expire_overdue_sessions(request.user)
        final_res, lb_entry = update_user_aggregates(request.user, recalculate_ranks=True)

        games = list(Game.objects.filter(is_active=True).order_by('order'))
        user_results = {r.game_id: r for r in GameResult.objects.filter(user=request.user)}
        user_sessions = {s.game_id: s for s in GameSession.objects.filter(user=request.user)}

        total_participants = Leaderboard.objects.count() or 1
        group_participants = (
            Leaderboard.objects.filter(group=request.user.group).count()
            if request.user.group else 1
        ) or 1

        games_breakdown = []
        for g in games:
            res = user_results.get(g.id)
            sess = user_sessions.get(g.id)
            games_breakdown.append({
                'game_id': g.id,
                'game_order': g.order,
                'game_title': g.title,
                'game_slug': g.slug,
                'icon_name': g.icon_name,
                'max_score': g.max_score,
                'duration_seconds': g.duration_seconds,
                'score': res.score if res else 0,
                'correct_answers': res.correct_answers if res else 0,
                'wrong_answers': res.wrong_answers if res else 0,
                'accuracy': res.accuracy if res else 0.0,
                'time_spent': res.time_spent if res else 0,
                'status': res.status if res else (sess.status if sess else 'not_started'),
                'completed_at': res.completed_at if res else None,
            })

        violation_count = ViolationLog.objects.filter(user=request.user).count()

        return Response({
            'user': UserSerializer(request.user).data,
            'summary': {
                'total_score': final_res.total_score,
                'max_possible_score': final_res.max_possible_score,
                'completed_games_count': final_res.completed_games_count,
                'total_games': len(games) or 8,
                'total_correct': final_res.total_correct,
                'total_wrong': final_res.total_wrong,
                'overall_accuracy': final_res.overall_accuracy,
                'total_time_spent': final_res.total_time_spent,
                'average_time_per_game': final_res.average_time_per_game,
                'rank': lb_entry.rank,
                'group_rank': lb_entry.group_rank,
                'total_participants': total_participants,
                'group_participants': group_participants,
                'violation_count': violation_count,
                'completed_at': final_res.completed_at,
            },
            'games_breakdown': games_breakdown,
        })


class ResultComparisonView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        check_and_expire_overdue_sessions(request.user)
        final_res, lb_entry = update_user_aggregates(request.user, recalculate_ranks=True)

        # Platform-wide aggregates
        platform_agg = Leaderboard.objects.aggregate(
            avg_score=Avg('total_score'),
            max_score=Max('total_score'),
            avg_accuracy=Avg('accuracy'),
            avg_time=Avg('total_time_spent'),
            total_students=Count('id'),
        )

        # Group-specific aggregates
        if request.user.group:
            group_qs = Leaderboard.objects.filter(group=request.user.group)
        else:
            group_qs = Leaderboard.objects.all()

        group_agg = group_qs.aggregate(
            avg_score=Avg('total_score'),
            max_score=Max('total_score'),
            avg_accuracy=Avg('accuracy'),
            avg_time=Avg('total_time_spent'),
            group_students=Count('id'),
        )

        games = list(Game.objects.filter(is_active=True).order_by('order'))
        my_results = {r.game_id: r for r in GameResult.objects.filter(user=request.user)}

        per_game_comparison = []
        for g in games:
            my_r = my_results.get(g.id)
            plat_g = GameResult.objects.filter(game=g).aggregate(
                avg_score=Avg('score'),
                avg_time=Avg('time_spent'),
                avg_acc=Avg('accuracy'),
            )
            if request.user.group:
                grp_g = GameResult.objects.filter(game=g, user__group=request.user.group).aggregate(
                    avg_score=Avg('score'),
                    avg_time=Avg('time_spent'),
                    avg_acc=Avg('accuracy'),
                )
            else:
                grp_g = plat_g

            per_game_comparison.append({
                'game_order': g.order,
                'game_title': g.title,
                'max_score': g.max_score,
                'my_score': my_r.score if my_r else 0,
                'group_avg_score': round(grp_g['avg_score'] or 0.0, 1),
                'platform_avg_score': round(plat_g['avg_score'] or 0.0, 1),
                'my_time': my_r.time_spent if my_r else 0,
                'group_avg_time': round(grp_g['avg_time'] or 0.0, 1),
                'platform_avg_time': round(plat_g['avg_time'] or 0.0, 1),
                'my_accuracy': my_r.accuracy if my_r else 0.0,
                'group_avg_accuracy': round(grp_g['avg_acc'] or 0.0, 1),
            })

        # Nearby competitors on the leaderboard for direct comparison
        top_peers = list(
            Leaderboard.objects.select_related('user', 'group')
            .order_by('rank')[:10]
        )
        peers_data = [
            {
                'rank': p.rank,
                'user_id': p.user_id,
                'full_name': p.user.full_name,
                'group_name': p.group.name if p.group else '—',
                'total_score': p.total_score,
                'total_time_spent': p.total_time_spent,
                'accuracy': p.accuracy,
                'completed_games': p.completed_games,
                'is_me': p.user_id == request.user.id,
            }
            for p in top_peers
        ]

        return Response({
            'my_stats': {
                'full_name': request.user.full_name,
                'group_name': request.user.group_name,
                'total_score': final_res.total_score,
                'max_possible_score': final_res.max_possible_score,
                'overall_accuracy': final_res.overall_accuracy,
                'total_time_spent': final_res.total_time_spent,
                'average_time_per_game': final_res.average_time_per_game,
                'completed_games': final_res.completed_games_count,
                'rank': lb_entry.rank,
                'group_rank': lb_entry.group_rank,
            },
            'group_comparison': {
                'group_name': request.user.group_name,
                'average_score': round(group_agg['avg_score'] or 0.0, 1),
                'top_score': group_agg['max_score'] or 0,
                'average_accuracy': round(group_agg['avg_accuracy'] or 0.0, 1),
                'average_time_spent': round(group_agg['avg_time'] or 0.0, 1),
                'student_count': group_agg['group_students'] or 1,
            },
            'platform_comparison': {
                'average_score': round(platform_agg['avg_score'] or 0.0, 1),
                'top_score': platform_agg['max_score'] or 0,
                'average_accuracy': round(platform_agg['avg_accuracy'] or 0.0, 1),
                'average_time_spent': round(platform_agg['avg_time'] or 0.0, 1),
                'student_count': platform_agg['total_students'] or 1,
            },
            'per_game_comparison': per_game_comparison,
            'top_peers': peers_data,
        })
