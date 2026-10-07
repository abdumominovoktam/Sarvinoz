from rest_framework import serializers
from .models import Game, Question, GameSession, Answer
from apps.results.models import GameResult


class GameListSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(read_only=True)
    user_status = serializers.SerializerMethodField()
    user_result = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Game
        fields = [
            'id',
            'order',
            'slug',
            'title',
            'description',
            'game_type',
            'duration_seconds',
            'duration_minutes',
            'max_score',
            'icon_name',
            'is_active',
            'questions_count',
            'user_status',
            'user_result',
            'remaining_seconds',
        ]

    def get_user_status(self, obj):
        sessions_map = self.context.get('sessions_map', {})
        results_map = self.context.get('results_map', {})
        if obj.id in results_map:
            return results_map[obj.id].status
        if obj.id in sessions_map:
            return sessions_map[obj.id].status
        return 'not_started'

    def get_user_result(self, obj):
        results_map = self.context.get('results_map', {})
        res = results_map.get(obj.id)
        if not res:
            return None
        return {
            'score': res.score,
            'max_score': res.max_score,
            'correct_answers': res.correct_answers,
            'wrong_answers': res.wrong_answers,
            'accuracy': res.accuracy,
            'time_spent': res.time_spent,
            'status': res.status,
            'completed_at': res.completed_at,
        }

    def get_remaining_seconds(self, obj):
        sessions_map = self.context.get('sessions_map', {})
        session = sessions_map.get(obj.id)
        if session and session.status == 'in_progress':
            return session.get_remaining_seconds()
        return obj.duration_seconds


class StudentQuestionSerializer(serializers.ModelSerializer):
    """Sanitized Question serializer that hides correct_answer during active gameplay."""

    class Meta:
        model = Question
        fields = [
            'id',
            'game',
            'question_text',
            'question_type',
            'options',
            'points',
            'difficulty',
        ]


class AdminQuestionSerializer(serializers.ModelSerializer):
    game_title = serializers.CharField(source='game.title', read_only=True)
    game_order = serializers.IntegerField(source='game.order', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'game',
            'game_title',
            'game_order',
            'question_text',
            'question_type',
            'options',
            'correct_answer',
            'points',
            'difficulty',
            'explanation',
            'created_at',
        ]


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            'id',
            'question',
            'submitted_answer',
            'is_correct',
            'points_earned',
            'answered_at',
        ]


class GameSessionSerializer(serializers.ModelSerializer):
    remaining_seconds = serializers.SerializerMethodField()
    elapsed_seconds = serializers.SerializerMethodField()

    class Meta:
        model = GameSession
        fields = [
            'id',
            'game',
            'status',
            'started_at',
            'expires_at',
            'completed_at',
            'violation_count',
            'remaining_seconds',
            'elapsed_seconds',
            'session_data',
        ]

    def get_remaining_seconds(self, obj):
        return obj.get_remaining_seconds()

    def get_elapsed_seconds(self, obj):
        return obj.get_elapsed_seconds()
