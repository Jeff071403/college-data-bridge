from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Folder, FolderPermission

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'designation', 'department']

class FolderPermissionSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )

    class Meta:
        model = FolderPermission
        fields = [
            'id', 'user', 'user_id', 'is_granted',
            'can_read', 'can_download', 'can_upload', 'can_delete_own_uploads'
        ]

class FolderSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        source='parent',
        required=False,
        allow_null=True
    )
    
    # Optional count of subfolders and files
    subfolder_count = serializers.SerializerMethodField()
    file_count = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = [
            'id', 'name', 'parent_id', 'created_by', 
            'created_at', 'updated_at', 'subfolder_count', 
            'file_count', 'path', 'google_folder_id', 'status'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_subfolder_count(self, obj):
        # We only count subfolders that the user has access to, but in serializing we can just do raw count.
        # Filtered counts can be done on demand or simple count is fine.
        return obj.children.count()

    def get_file_count(self, obj):
        return obj.files.count()

    def get_path(self, obj):
        """
        Returns a list of ancestral folders from the root down to the folder.
        """
        ancestors = obj.get_ancestors()
        path = [{"id": f.id, "name": f.name} for f in ancestors]
        path.append({"id": obj.id, "name": obj.name})
        return path
