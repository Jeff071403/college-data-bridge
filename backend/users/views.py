from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from roles.models import Role
from permissions.models import Permission
from permissions.custom_permissions import HasDynamicPermission
from activity_logs.utils import log_activity
from notifications.utils import create_notification, notify_admins
from .models import UserPermission
from .serializers import (
    CustomUserSerializer, 
    CustomUserCreateSerializer, 
    UserPermissionSerializer
)

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check user status
        if self.user.status == 'Disabled':
            raise serializers.ValidationError({"detail": "This user account has been disabled."})
            
        # Serialize user info
        user_serializer = CustomUserSerializer(self.user)
        data['user'] = user_serializer.data
        
        # Log successful login
        log_activity(self.user, "User logged in successfully", "authentication")
        
        # Update last login
        self.user.save(update_fields=['last_login'])
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [HasDynamicPermission]
    
    # Define permission requirements for custom permissions check
    action_permissions = {
        'list': 'manage_users',
        'retrieve': 'manage_users',
        'create': 'create_users',
        'update': 'edit_users',
        'partial_update': 'edit_users',
        'destroy': 'delete_users',
        'reset_password': 'edit_users',
        'assign_permissions': 'edit_users',
    }

    def get_serializer_class(self):
        if self.action == 'create':
            return CustomUserCreateSerializer
        return CustomUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_class()(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log & Notify
        log_activity(request.user, f"Created user {user.email}", "users", request)
        create_notification(
            user, 
            "Welcome to College MOU Dashboard", 
            f"Hi {user.name}, your account has been created by the administrator."
        )
        notify_admins("New User Created", f"User {user.name} ({user.email}) was created.")
        
        headers = self.get_success_headers(serializer.data)
        return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        # Override to check status transition
        instance = self.get_object()
        old_status = instance.status
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # If user disabled, log and notify
        new_status = user.status
        if old_status == 'Active' and new_status == 'Disabled':
            log_activity(request.user, f"Disabled user {user.email}", "users", request)
            create_notification(user, "Account Disabled", "Your account has been disabled by the administrator.")
        else:
            log_activity(request.user, f"Updated user profile for {user.email}", "users", request)
            
        return Response(CustomUserSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        email = instance.email
        self.perform_destroy(instance)
        log_activity(request.user, f"Deleted user {email}", "users", request)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Returns the logged in user's profile information.
        """
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='change-password', permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """
        Allows users to update their own password.
        """
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({"detail": "Both current and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(current_password):
            return Response({"current_password": ["Invalid current password."]}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        log_activity(user, "User updated their own password", "users", request)
        return Response({"detail": "Password changed successfully."})

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """
        Allows an Admin to reset a user's password directly.
        """
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({"password": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        log_activity(request.user, f"Reset password for user {user.email}", "users", request)
        create_notification(user, "Password Reset", "Your password has been reset by the administrator.")
        
        return Response({"detail": "Password reset successfully."})

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions(self, request, pk=None):
        """
        Assigns or revokes explicit permission overrides for a user.
        Expects a list of objects with permission_id and is_granted.
        """
        user = self.get_object()
        overrides = request.data.get('permissions', [])
        
        # Clear existing overrides
        UserPermission.objects.filter(user=user).delete()
        
        created_permissions = []
        for item in overrides:
            permission_id = item.get('permission_id')
            is_granted = item.get('is_granted', True)
            
            if not permission_id:
                continue
                
            permission = get_object_or_404(Permission, id=permission_id)
            user_permission = UserPermission.objects.create(
                user=user,
                permission=permission,
                is_granted=is_granted
            )
            created_permissions.append(user_permission)
            
            # Log individual permission action
            action_type = "granted" if is_granted else "revoked"
            log_activity(
                request.user, 
                f"Explicitly {action_type} permission '{permission.codename}' to user {user.email}", 
                "users", 
                request
            )
            create_notification(
                user, 
                f"Permission Update", 
                f"The permission '{permission.name}' has been {action_type} to you."
            )
            
        return Response({
            "detail": "Permissions updated successfully.",
            "permissions": UserPermissionSerializer(created_permissions, many=True).data
        })
