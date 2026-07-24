from rest_framework import viewsets
from .models import Permission
from .serializers import PermissionSerializer
from permissions.custom_permissions import HasDynamicPermission

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by('name')
    serializer_class = PermissionSerializer
    permission_classes = [HasDynamicPermission]
    required_permission = 'manage_users'
