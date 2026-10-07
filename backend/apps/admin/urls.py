from django.urls import path
from .views import (
    AdminDashboardStatsView,
    AdminStudentListView,
    AdminToggleBlockStudentView,
    AdminGroupListCreateView,
    AdminGroupDetailView,
    AdminGameListView,
    AdminGameUpdateView,
    AdminQuestionListCreateView,
    AdminQuestionDetailView,
    AdminResultsAndViolationsView,
    AdminExportResultsView,
)

urlpatterns = [
    path('statistics/', AdminDashboardStatsView.as_view(), name='admin-statistics'),
    path('students/', AdminStudentListView.as_view(), name='admin-students'),
    path('students/<int:user_id>/toggle-block/', AdminToggleBlockStudentView.as_view(), name='admin-toggle-block'),
    path('groups/', AdminGroupListCreateView.as_view(), name='admin-groups'),
    path('groups/<int:pk>/', AdminGroupDetailView.as_view(), name='admin-group-detail'),
    path('games/', AdminGameListView.as_view(), name='admin-games'),
    path('games/<int:game_id>/', AdminGameUpdateView.as_view(), name='admin-game-update'),
    path('questions/', AdminQuestionListCreateView.as_view(), name='admin-questions'),
    path('questions/<int:pk>/', AdminQuestionDetailView.as_view(), name='admin-question-detail'),
    path('results/', AdminResultsAndViolationsView.as_view(), name='admin-results'),
    path('export/', AdminExportResultsView.as_view(), name='admin-export'),
]
