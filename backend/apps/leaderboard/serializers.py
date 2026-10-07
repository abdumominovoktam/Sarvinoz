from rest_framework import serializers
from .models import Leaderboard


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    group_name = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = Leaderboard
        fields = [
            'id',
            'rank',
            'group_rank',
            'user_id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'group',
            'group_name',
            'total_score',
            'completed_games',
            'total_time_spent',
            'average_time',
            'accuracy',
            'finished_at',
            'is_current_user',
        ]

    def get_group_name(self, obj):
        if obj.group:
            return obj.group.name
        if obj.user and obj.user.group:
            return obj.user.group.name
        return "—"

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False
