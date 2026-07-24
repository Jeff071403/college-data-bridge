from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import File, FileVersion
from folders.serializers import UserMinimalSerializer

class FileVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserMinimalSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = FileVersion
        fields = [
            'id', 'version_number', 'name', 'size', 
            'file_type', 'file_url', 'uploaded_by', 'created_at'
        ]
        read_only_fields = ['version_number', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file_field:
            return request.build_absolute_uri(obj.file_field.url)
        return obj.file_field.url if obj.file_field else None

class FileSerializer(serializers.ModelSerializer):
    uploaded_by = UserMinimalSerializer(read_only=True)
    folder_id = serializers.IntegerField(source='folder.id', read_only=True)
    file_url = serializers.SerializerMethodField()
    versions = FileVersionSerializer(many=True, read_only=True)
    size_formatted = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            'id', 'name', 'size', 'size_formatted', 'file_type', 
            'folder_id', 'uploaded_by', 'file_url', 
            'version_number', 'versions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['size', 'file_type', 'version_number', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file_field:
            return request.build_absolute_uri(obj.file_field.url)
        return obj.file_field.url if obj.file_field else None

    def get_size_formatted(self, obj):
        size = obj.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
