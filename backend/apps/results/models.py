from django.db import models
from django.utils import timezone


class GameResult(models.Model):
    STATUS_CHOICES = (
        ('completed', 'Tugallangan'),
        ('time_expired', 'Vaqt tugagan'),
        ('violation', 'Qoidabuzildi'),
    )

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='game_results')
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='results')
    session = models.OneToOneField(
        'games.GameSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='result'
    )
    score = models.PositiveIntegerField(default=0, db_index=True)
    max_score = models.PositiveIntegerField(default=100)
    correct_answers = models.PositiveSmallIntegerField(default=0)
    wrong_answers = models.PositiveSmallIntegerField(default=0)
    accuracy = models.FloatField(default=0.0)
    time_spent = models.PositiveIntegerField(default=0, help_text="Sarflangan vaqt (soniyalarda)")
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='completed', db_index=True)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'game'], name='unique_user_game_result')
        ]
        ordering = ['game__order']

    def __str__(self):
        return f"{self.user.email} - {self.game.title}: {self.score}/{self.max_score}"


class FinalResult(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='final_result')
    total_score = models.PositiveIntegerField(default=0, db_index=True)
    max_possible_score = models.PositiveIntegerField(default=867)
    completed_games_count = models.PositiveSmallIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)
    total_wrong = models.PositiveIntegerField(default=0)
    overall_accuracy = models.FloatField(default=0.0)
    total_time_spent = models.PositiveIntegerField(default=0)
    average_time_per_game = models.FloatField(default=0.0)
    completed_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_score', 'total_time_spent', '-overall_accuracy']

    def __str__(self):
        return f"FinalResult: {self.user.email} ({self.total_score}/{self.max_possible_score})"


class ViolationLog(models.Model):
    VIOLATION_TYPES = (
        ('tab_switch', 'Boshqa tabga o‘tish'),
        ('window_blur', 'Oynani tark etish / minimize'),
        ('fullscreen_exit', 'Fullscreen rejimidan chiqish'),
        ('page_reload', 'Sahifani qayta yuklash'),
        ('back_button', 'Orqaga qaytish tugmasi'),
        ('visibility_change', 'Brauzer ko‘rinishi o‘zgarishi'),
    )

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='violations')
    game = models.ForeignKey(
        'games.Game',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='violations'
    )
    violation_type = models.CharField(max_length=50, choices=VIOLATION_TYPES, default='tab_switch')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Violation [{self.violation_type}] by {self.user.email} at {self.timestamp}"
