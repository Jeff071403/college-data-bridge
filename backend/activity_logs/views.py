from rest_framework import viewsets, permissions
from permissions.custom_permissions import HasDynamicPermission
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [HasDynamicPermission]
    required_permission = 'manage_users'
