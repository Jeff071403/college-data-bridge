from rest_framework import viewsets, permissions
from .models import Role
from .serializers import RoleSerializer
from permissions.custom_permissions import HasDynamicPermission

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [HasDynamicPermission]
    required_permission = 'manage_users'
