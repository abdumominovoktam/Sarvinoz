from django.db import models
from django.utils import timezone


class Leaderboard(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='leaderboard_entry')
    group = models.ForeignKey(
        'users.Group',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leaderboard_entries'
    )
    total_score = models.PositiveIntegerField(default=0, db_index=True)
    completed_games = models.PositiveSmallIntegerField(default=0, db_index=True)
    total_time_spent = models.PositiveIntegerField(default=0, db_index=True)
    average_time = models.FloatField(default=0.0)
    accuracy = models.FloatField(default=0.0, db_index=True)
    rank = models.PositiveIntegerField(default=1, db_index=True)
    group_rank = models.PositiveIntegerField(default=1)
    finished_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_score', 'total_time_spent', '-accuracy', 'finished_at', 'id']
        indexes = [
            models.Index(fields=['-total_score', 'total_time_spent', '-accuracy', 'finished_at']),
        ]

    def __str__(self):
        return f"#{self.rank} {self.user.full_name} - {self.total_score} ball"
