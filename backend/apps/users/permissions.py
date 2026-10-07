from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allows access only to users with role == 'admin' or is_superuser."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and not getattr(request.user, 'is_blocked', False)
            and (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsActiveUnblockedUser(permissions.BasePermission):
    """Ensures the authenticated user is not blocked."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and not getattr(request.user, 'is_blocked', False)
        )
