from django.db import models
from django.utils import timezone


class Game(models.Model):
    GAME_TYPE_CHOICES = (
        ('quiz', 'Tezkor viktorina'),
        ('crossword', 'Krossvord'),
        ('word_search', 'So‘z qidiruv'),
        ('scramble', 'Harflar bo‘shliqtirmasi'),
        ('process_chain', 'Jarayon zanjiri'),
        ('matching', 'Tushuncha — ta’rif bog‘lash'),
        ('bingo', 'Bingo'),
        ('diagram', 'Chizmadan qidiruv'),
    )

    order = models.PositiveSmallIntegerField(unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True)
    title = models.CharField(max_length=150)
    description = models.TextField()
    game_type = models.CharField(max_length=30, choices=GAME_TYPE_CHOICES)
    duration_seconds = models.PositiveIntegerField(default=300)
    max_score = models.PositiveIntegerField(default=100)
    icon_name = models.CharField(max_length=50, default='Gamepad2')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    @property
    def duration_minutes(self) -> int:
        return max(1, round(self.duration_seconds / 60))

    def __str__(self):
        return f"#{self.order} {self.title}"


class Question(models.Model):
    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    )

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=50, default='multiple_choice')
    options = models.JSONField(default=dict, blank=True)
    correct_answer = models.JSONField()
    points = models.PositiveIntegerField(default=10)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Medium', db_index=True)
    explanation = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['game__order', 'id']

    def __str__(self):
        return f"[{self.game.title}] {self.question_text[:60]}"


class GameSession(models.Model):
    STATUS_CHOICES = (
        ('not_started', 'Boshlanmagan'),
        ('in_progress', 'Jarayonda'),
        ('completed', 'Tugallangan'),
        ('time_expired', 'Vaqt tugagan'),
        ('violation', 'Qoidabuzildi'),
    )

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='game_sessions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='sessions')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='in_progress', db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    violation_count = models.PositiveSmallIntegerField(default=0)
    session_data = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'game'], name='unique_user_game_session')
        ]
        ordering = ['game__order']

    def get_remaining_seconds(self) -> int:
        if self.status != 'in_progress':
            return 0
        now = timezone.now()
        game_rem = max(0, int((self.expires_at - now).total_seconds()))
        if hasattr(self.user, 'profile') and self.user.profile.global_timer_started_at:
            global_rem = self.user.profile.get_remaining_global_seconds()
            return min(game_rem, global_rem)
        return game_rem

    def get_elapsed_seconds(self) -> int:
        end_ref = self.completed_at if self.completed_at else timezone.now()
        elapsed = int((end_ref - self.started_at).total_seconds())
        return max(1, min(self.game.duration_seconds, elapsed))

    def __str__(self):
        return f"{self.user.email} - {self.game.title} ({self.status})"


class Answer(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='student_answers')
    submitted_answer = models.JSONField()
    is_correct = models.BooleanField(default=False)
    points_earned = models.FloatField(default=0.0)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['session', 'question'], name='unique_session_question_answer')
        ]

    def __str__(self):
        return f"Answer by {self.user.email} on Q#{self.question_id}: {'Correct' if self.is_correct else 'Wrong'}"
