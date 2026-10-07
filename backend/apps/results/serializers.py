from rest_framework import serializers
from .models import GameResult, FinalResult, ViolationLog


class GameResultSerializer(serializers.ModelSerializer):
    game_order = serializers.IntegerField(source='game.order', read_only=True)
    game_title = serializers.CharField(source='game.title', read_only=True)
    game_slug = serializers.CharField(source='game.slug', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_group = serializers.CharField(source='user.group_name', read_only=True)

    class Meta:
        model = GameResult
        fields = [
            'id',
            'user',
            'user_name',
            'user_group',
            'game',
            'game_order',
            'game_title',
            'game_slug',
            'score',
            'max_score',
            'correct_answers',
            'wrong_answers',
            'accuracy',
            'time_spent',
            'status',
            'started_at',
            'completed_at',
        ]


class FinalResultSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_group = serializers.CharField(source='user.group_name', read_only=True)

    class Meta:
        model = FinalResult
        fields = [
            'id',
            'user',
            'user_name',
            'user_group',
            'total_score',
            'max_possible_score',
            'completed_games_count',
            'total_correct',
            'total_wrong',
            'overall_accuracy',
            'total_time_spent',
            'average_time_per_game',
            'completed_at',
        ]


class ViolationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_group = serializers.CharField(source='user.group_name', read_only=True)
    game_title = serializers.CharField(source='game.title', read_only=True, default='Umumiy')

    class Meta:
        model = ViolationLog
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'user_group',
            'game',
            'game_title',
            'violation_type',
            'timestamp',
            'description',
        ]
