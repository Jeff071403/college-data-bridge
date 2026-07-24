from rest_framework import serializers
from .models import ActivityLog
from folders.serializers import UserMinimalSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'module', 'created_at', 'ip_address']
