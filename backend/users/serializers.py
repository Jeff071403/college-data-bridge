from rest_framework import serializers
from django.contrib.auth import get_user_model
from roles.models import Role
from permissions.models import Permission
from .models import UserPermission

User = get_user_model()

class RoleSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class PermissionSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'description']

class UserPermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSimpleSerializer(read_only=True)
    permission_id = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        source='permission',
        write_only=True
    )
    
    class Meta:
        model = UserPermission
        fields = ['id', 'permission', 'permission_id', 'is_granted']

class CustomUserSerializer(serializers.ModelSerializer):
    role = RoleSimpleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True,
        required=False,
        allow_null=True
    )
    permissions_override = UserPermissionSerializer(source='user_permissions_override', many=True, read_only=True)
    active_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'designation', 
            'department', 'role', 'role_id', 'status', 
            'last_login', 'created_at', 'updated_at',
            'permissions_override', 'active_permissions'
        ]
        read_only_fields = ['last_login', 'created_at', 'updated_at']

    def get_active_permissions(self, obj):
        from permissions.custom_permissions import get_user_permissions
        return list(get_user_permissions(obj))

class CustomUserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=True
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'name', 'phone', 'designation', 
            'department', 'role_id', 'status', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            name=validated_data['name'],
            phone=validated_data.get('phone', ''),
            designation=validated_data.get('designation', ''),
            department=validated_data.get('department', ''),
            role=role,
            status=validated_data.get('status', 'Active')
        )
        return user
