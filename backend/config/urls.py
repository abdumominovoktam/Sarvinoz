from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/games/', include('apps.games.urls')),
    path('api/results/', include('apps.results.urls')),
    path('api/leaderboard/', include('apps.leaderboard.urls')),
    path('api/admin-panel/', include('apps.admin.urls')),
]
