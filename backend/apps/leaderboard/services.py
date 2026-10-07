from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings

from apps.games.models import Game
from apps.results.models import GameResult, FinalResult
from apps.leaderboard.models import Leaderboard
from apps.users.models import StudentProfile


def calculate_fair_game_score(
    correct_count: int,
    total_questions: int,
    time_spent_seconds: int,
    duration_seconds: int,
    max_score: int,
) -> int:
    """
    Calculates a fair, accuracy-first game score with a modest, bounded speed bonus.
    - If correct_count == 0 -> score is 0.
    - Base accuracy accounts for 90% of max_score: (correct / total) * (max_score * 0.90)
    - Speed bonus accounts for up to 10% of max_score, scaled by accuracy so a fast wrong answer gets nothing:
      speed_ratio = max(0.0, min(1.0, (duration - time_spent) / max(1, duration * 0.75)))
      Wait: if a student gets 100% accuracy within reasonable time (<= 65% of time limit), they earn full max_score!
    """
    if total_questions <= 0 or correct_count <= 0:
        return 0

    accuracy_ratio = min(1.0, correct_count / total_questions)
    base_score = accuracy_ratio * (max_score * 0.90)

    # Fair speed factor: completing within 50% of time limit gives 1.0 of the 10% bonus;
    # completing right at the time limit still gives 0.35 of the 10% bonus for accuracy effort.
    if duration_seconds > 0:
        time_ratio = max(0.0, min(1.0, time_spent_seconds / duration_seconds))
        if time_ratio <= 0.55:
            speed_factor = 1.0
        else:
            # Linearly interpolate from 1.0 at 55% time to 0.35 at 100% time
            speed_factor = max(0.35, 1.0 - ((time_ratio - 0.55) / 0.45) * 0.65)
    else:
        speed_factor = 1.0

    speed_bonus = accuracy_ratio * (max_score * 0.10) * speed_factor
    raw_score = round(base_score + speed_bonus)
    return max(0, min(max_score, int(raw_score)))


@transaction.atomic
def update_user_aggregates(user, recalculate_ranks: bool = True):
    """
    Updates FinalResult, StudentProfile completion state, and Leaderboard entry for a user.
    """
    results = list(GameResult.objects.filter(user=user).select_related('game'))
    total_games_available = Game.objects.filter(is_active=True).count() or getattr(settings, 'TOTAL_GAMES_COUNT', 8)
    max_possible = Game.objects.filter(is_active=True).aggregate(s=Sum('max_score'))['s'] or getattr(settings, 'TOTAL_MAX_SCORE', 867)

    total_score = sum(r.score for r in results)
    completed_count = len(results)
    total_correct = sum(r.correct_answers for r in results)
    total_wrong = sum(r.wrong_answers for r in results)
    total_time = sum(r.time_spent for r in results)

    total_attempts = total_correct + total_wrong
    if total_attempts > 0:
        overall_accuracy = round((total_correct / total_attempts) * 100.0, 1)
    elif completed_count > 0:
        overall_accuracy = round(sum(r.accuracy for r in results) / completed_count, 1)
    else:
        overall_accuracy = 0.0

    avg_time = round(total_time / completed_count, 1) if completed_count > 0 else 0.0
    latest_completed_at = max((r.completed_at for r in results), default=timezone.now())

    final_res, _ = FinalResult.objects.update_or_create(
        user=user,
        defaults={
            'total_score': total_score,
            'max_possible_score': max_possible,
            'completed_games_count': completed_count,
            'total_correct': total_correct,
            'total_wrong': total_wrong,
            'overall_accuracy': overall_accuracy,
            'total_time_spent': total_time,
            'average_time_per_game': avg_time,
            'completed_at': latest_completed_at,
        }
    )

    profile, _ = StudentProfile.objects.get_or_create(user=user)
    if completed_count >= total_games_available and not profile.is_completed:
        profile.is_completed = True
        profile.completed_at = latest_completed_at
        profile.save(update_fields=['is_completed', 'completed_at'])

    lb_entry, _ = Leaderboard.objects.update_or_create(
        user=user,
        defaults={
            'group': user.group,
            'total_score': total_score,
            'completed_games': completed_count,
            'total_time_spent': total_time,
            'average_time': avg_time,
            'accuracy': overall_accuracy,
            'finished_at': latest_completed_at,
        }
    )

    if recalculate_ranks:
        recalculate_all_rankings()
        lb_entry.refresh_from_db()

    return final_res, lb_entry


@transaction.atomic
def recalculate_all_rankings():
    """
    Recalculates global `rank` and `group_rank` across all Leaderboard entries according to Section 12:
    1. Highest total_score (-total_score)
    2. Lowest total_time_spent (total_time_spent)
    3. Highest accuracy (-accuracy)
    4. Earliest finished_at (finished_at, id)
    """
    entries = list(
        Leaderboard.objects.select_related('user', 'group').order_by(
            '-total_score',
            'total_time_spent',
            '-accuracy',
            'finished_at',
            'id',
        )
    )

    group_counters = {}
    to_update = []

    for idx, entry in enumerate(entries, start=1):
        new_rank = idx
        grp_id = entry.group_id or 0
        group_counters[grp_id] = group_counters.get(grp_id, 0) + 1
        new_group_rank = group_counters[grp_id]

        if entry.rank != new_rank or entry.group_rank != new_group_rank or entry.group_id != entry.user.group_id:
            entry.rank = new_rank
            entry.group_rank = new_group_rank
            entry.group_id = entry.user.group_id
            to_update.append(entry)

    if to_update:
        Leaderboard.objects.bulk_update(to_update, ['rank', 'group_rank', 'group'])
