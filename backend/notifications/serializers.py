from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'description', 'metadata', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'description', 'metadata', 'created_at']
