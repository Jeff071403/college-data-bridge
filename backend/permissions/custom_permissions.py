from rest_framework import permissions
from roles.models import RolePermission
from users.models import UserPermission
from permissions.models import Permission

def get_user_permissions(user):
    """
    Returns a set of permission codenames active for the user.
    Calculated as: (Role Permissions UNION Explicit Grants) MINUS Explicit Revokes.
    """
    if not user or user.is_anonymous:
        return set()

    # Super Admin gets all permissions in the system
    if user.role and user.role.name == "Super Admin":
        return set(Permission.objects.values_list('codename', flat=True))

    role_perms = set()
    if user.role:
        role_perms = set(
            RolePermission.objects.filter(role=user.role)
            .values_list('permission__codename', flat=True)
        )

    user_overrides = UserPermission.objects.filter(user=user)
    granted_overrides = set(
        user_overrides.filter(is_granted=True)
        .values_list('permission__codename', flat=True)
    )
    revoked_overrides = set(
        user_overrides.filter(is_granted=False)
        .values_list('permission__codename', flat=True)
    )

    return (role_perms | granted_overrides) - revoked_overrides

class HasDynamicPermission(permissions.BasePermission):
    """
    DRF permission class that dynamically checks if a user has the required permission
    assigned to the view/action.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user status is active
        if request.user.status == 'Disabled':
            return False

        # Super Admin has access to all API views
        if request.user.role and request.user.role.name == "Super Admin":
            return True

        # Retrieve the required permission from the view definition
        required_perm = getattr(view, 'required_permission', None)
        
        # If view specifies action-level permissions
        if not required_perm:
            action = getattr(view, 'action', None)
            action_permissions = getattr(view, 'action_permissions', {})
            required_perm = action_permissions.get(action)

        # If no permission is required by the view, default to allow authenticated users
        if not required_perm:
            return True

        active_perms = get_user_permissions(request.user)
        return required_perm in active_perms
