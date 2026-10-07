from django.urls import path
from .views import LeaderboardListView, GroupLeaderboardView

urlpatterns = [
    path('', LeaderboardListView.as_view(), name='leaderboard-list'),
    path('groups/', GroupLeaderboardView.as_view(), name='leaderboard-groups'),
]
