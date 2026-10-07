from django.db.models import Q, Avg, Max, Count
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.users.models import Group
from apps.users.permissions import IsActiveUnblockedUser
from .models import Leaderboard
from .serializers import LeaderboardEntrySerializer
from .services import recalculate_all_rankings


class LeaderboardListView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        recalculate_all_rankings()

        qs = Leaderboard.objects.select_related('user', 'group').filter(user__role='student')

        # Podium Top 3 (always global top 3 before search/filter, or within group if group filter applied)
        group_filter = request.query_params.get('group', '').strip()
        podium_qs = qs
        if group_filter and group_filter != 'all':
            podium_qs = podium_qs.filter(Q(group__name__iexact=group_filter) | Q(user__group__name__iexact=group_filter))
        top_three = LeaderboardEntrySerializer(
            podium_qs.order_by('rank')[:3],
            many=True,
            context={'request': request},
        ).data

        # Search filter
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(group__name__icontains=search)
            )

        # Group filter
        if group_filter and group_filter != 'all':
            qs = qs.filter(Q(group__name__iexact=group_filter) | Q(user__group__name__iexact=group_filter))

        # Min score filter
        min_score = request.query_params.get('min_score', '').strip()
        if min_score.isdigit():
            qs = qs.filter(total_score__gte=int(min_score))

        # Completed games filter
        completed_games = request.query_params.get('completed_games', '').strip()
        if completed_games.isdigit():
            qs = qs.filter(completed_games__gte=int(completed_games))

        # Max rank filter
        max_rank = request.query_params.get('max_rank', '').strip()
        if max_rank.isdigit():
            qs = qs.filter(rank__lte=int(max_rank))

        # Sorting
        sort_by = request.query_params.get('sort_by', 'rank').strip()
        sort_map = {
            'rank': ('rank',),
            'score_desc': ('-total_score', 'total_time_spent', '-accuracy'),
            'score_asc': ('total_score', 'total_time_spent'),
            'time_asc': ('total_time_spent', '-total_score'),
            'time_desc': ('-total_time_spent', '-total_score'),
            'accuracy_desc': ('-accuracy', '-total_score', 'total_time_spent'),
        }
        ordering = sort_map.get(sort_by, ('rank',))
        qs = qs.order_by(*ordering)

        # Pagination
        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            page = 1
        try:
            page_size = max(5, min(100, int(request.query_params.get('page_size', 15))))
        except ValueError:
            page_size = 15

        total_count = qs.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_items = qs[start_idx:end_idx]
        serialized_items = LeaderboardEntrySerializer(
            page_items,
            many=True,
            context={'request': request},
        ).data

        my_entry_obj = Leaderboard.objects.select_related('user', 'group').filter(user=request.user).first()
        my_entry = (
            LeaderboardEntrySerializer(my_entry_obj, context={'request': request}).data
            if my_entry_obj else None
        )

        groups_list = list(Group.objects.values_list('name', flat=True).order_by('name'))

        return Response({
            'podium': top_three,
            'results': serialized_items,
            'my_entry': my_entry,
            'groups': groups_list,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
            },
        })


class GroupLeaderboardView(APIView):
    permission_classes = [IsActiveUnblockedUser]

    def get(self, request):
        max_possible_score = getattr(settings, 'TOTAL_MAX_SCORE', 867)
        groups = Group.objects.all()

        group_rankings = []
        for grp in groups:
            entries = Leaderboard.objects.filter(group=grp, user__role='student').select_related('user')
            count = entries.count()
            if count == 0:
                continue

            agg = entries.aggregate(
                avg_score=Avg('total_score'),
                max_score=Max('total_score'),
                avg_accuracy=Avg('accuracy'),
                avg_time=Avg('total_time_spent'),
                avg_games=Avg('completed_games'),
            )
            avg_score = round(agg['avg_score'] or 0.0, 1)
            performance_percent = round((avg_score / max_possible_score) * 100.0, 1) if max_possible_score > 0 else 0.0
            top_entry = entries.order_by('rank').first()

            group_rankings.append({
                'group_id': grp.id,
                'group_name': grp.name,
                'faculty': grp.faculty,
                'course': grp.course,
                'student_count': count,
                'average_score': avg_score,
                'max_possible_score': max_possible_score,
                'performance_percentage': performance_percent,
                'average_accuracy': round(agg['avg_accuracy'] or 0.0, 1),
                'average_time_spent': round(agg['avg_time'] or 0.0, 1),
                'average_completed_games': round(agg['avg_games'] or 0.0, 1),
                'top_score': agg['max_score'] or 0,
                'top_student_name': top_entry.user.full_name if top_entry else '—',
                'is_my_group': bool(request.user.group_id == grp.id),
            })

        group_rankings.sort(
            key=lambda x: (-x['performance_percentage'], -x['average_score'], x['average_time_spent'])
        )
        for idx, item in enumerate(group_rankings, start=1):
            item['rank'] = idx

        return Response({
            'groups': group_rankings,
            'max_possible_score': max_possible_score,
        })
