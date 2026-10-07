from django.urls import path
from .views import (
    DashboardOverviewView,
    StartGameSessionView,
    SubmitSingleAnswerView,
    FinishGameSessionView,
    ReportViolationView,
)

urlpatterns = [
    path('dashboard/', DashboardOverviewView.as_view(), name='games-dashboard'),
    path('<int:game_order>/start/', StartGameSessionView.as_view(), name='game-start'),
    path('<int:game_order>/answer/', SubmitSingleAnswerView.as_view(), name='game-answer'),
    path('<int:game_order>/submit/', FinishGameSessionView.as_view(), name='game-submit'),
    path('violation/', ReportViolationView.as_view(), name='game-violation'),
]
