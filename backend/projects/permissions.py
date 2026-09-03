from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    """
    Allows access only to users with the MANAGER role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "MANAGER"
        )