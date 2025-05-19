from rest_framework.permissions import BasePermission

class IsFirstUser(BasePermission):
    """
    Custom permission to only allow the first user (owner) to perform certain actions.
    This is useful during the initial setup of the application.
    """
    
    def has_permission(self, request, view):
        from api.models.user import User
        # Only allow if this is the first and only user in the system
        return User.objects.count() == 0 or (request.user and request.user.is_authenticated and request.user.role and request.user.role.name == 'owner')

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
