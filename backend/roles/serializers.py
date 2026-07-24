from rest_framework import serializers
from .models import Role, RolePermission

class RolePermissionSerializer(serializers.ModelSerializer):
    permission_codename = serializers.CharField(source='permission.codename', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'permission_codename', 'permission_name']

class RoleSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(source='role_permissions', many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']
