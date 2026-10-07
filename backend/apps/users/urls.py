from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    AcceptRulesView,
    PublicGroupsListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('accept-rules/', AcceptRulesView.as_view(), name='auth-accept-rules'),
    path('groups/', PublicGroupsListView.as_view(), name='public-groups'),
]
