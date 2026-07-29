from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from roles.models import Role
from permissions.models import Permission
from permissions.custom_permissions import HasDynamicPermission
from activity_logs.utils import log_activity
from notifications.utils import create_notification, notify_admins
from .models import UserPermission, UserInvitation
from .serializers import (
    CustomUserSerializer, 
    CustomUserCreateSerializer, 
    UserPermissionSerializer,
    UserInvitationSerializer,
    UserRegistrationSerializer
)
from .invitation_services import InvitationService, TokenService
from services.email_service import send_invitation_email
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

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

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().order_by('-created_at')
        if user.is_authenticated and user.role and user.role.name == 'Admin':
            queryset = queryset.exclude(role__name='Super Admin')
        return queryset
    
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
        'invite': 'create_users',
        'invitations': 'manage_users',
        'resend_invite': 'manage_users',
        'cancel_invite': 'manage_users',
        'delete_invitation': 'manage_users',
    }

    def get_permissions(self):
        if self.action in ['get_invitation', 'register']:
            return [permissions.AllowAny()]
        return super().get_permissions()

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

    @action(detail=False, methods=['post'], url_path='invite')
    def invite(self, request):
        email = request.data.get('email')
        stream = request.data.get('stream', '')
        department = request.data.get('department', '')
        role_id = request.data.get('system_role_id')
        
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Default fallback role
        if not role_id:
            role = Role.objects.filter(name="User").first()
            if not role:
                role = Role.objects.first()
        else:
            role = get_object_or_404(Role, id=role_id)
            
        if not role:
            return Response({"detail": "No default system role found in the database. Please create a role first."}, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user.role and request.user.role.name == 'Admin' and role.name == 'Super Admin':
            return Response({"detail": "Admins cannot invite users with the Super Admin role."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            invitation = InvitationService.create_invitation(
                email=email,
                stream=stream,
                department=department,
                system_role=role,
                created_by=request.user
            )
            log_activity(request.user, f"Created invitation for {email}", "users", request)
            return Response(UserInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Failed to create invitation")
            return Response({"detail": f"Invitation sending failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='invitations')
    def invitations(self, request):
        queryset = UserInvitation.objects.all().order_by('-created_at')
        if request.user.role and request.user.role.name == 'Admin':
            queryset = queryset.exclude(system_role__name='Super Admin')
        
        # Search & filters
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(email__icontains=search)
            
        stream = request.query_params.get('stream')
        if stream:
            queryset = queryset.filter(stream=stream)
            
        department = request.query_params.get('department')
        if department:
            queryset = queryset.filter(department=department)
            
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(system_role_id=role)
            
        status_param = request.query_params.get('status')
        if status_param:
            now = timezone.now()
            if status_param == 'Accepted':
                queryset = queryset.filter(is_used=True)
            elif status_param == 'Cancelled':
                queryset = queryset.filter(is_cancelled=True)
            elif status_param == 'Expired':
                queryset = queryset.filter(expires_at__lt=now, is_used=False, is_cancelled=False)
            elif status_param == 'Pending':
                queryset = queryset.filter(expires_at__gt=now, is_used=False, is_cancelled=False)
                
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = UserInvitationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = UserInvitationSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='resend-invite')
    def resend_invite(self, request):
        from datetime import timedelta
        invite_id = request.data.get('id')
        if not invite_id:
            return Response({"detail": "Invitation ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        invitation = get_object_or_404(UserInvitation, id=invite_id)
        
        now = timezone.now()
        expires_at = now + timedelta(hours=24)
        token = TokenService.generate_token(
            invitation.email, 
            invitation.stream, 
            invitation.department, 
            invitation.system_role.id, 
            expires_at
        )
        
        invitation.token = token
        invitation.expires_at = expires_at
        invitation.is_cancelled = False
        invitation.is_used = False
        invitation.save()
        
        # Send Email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        invite_url = f"{frontend_url}/register?token={token}"
        
        try:
            send_invitation_email(invitation.email, invite_url, expires_at)
            log_activity(request.user, f"Resent invitation for {invitation.email}", "users", request)
            return Response(UserInvitationSerializer(invitation).data)
        except Exception as e:
            logger.exception("Failed to resend invitation email")
            return Response({"detail": f"Email resend failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='cancel-invite')
    def cancel_invite(self, request):
        invite_id = request.data.get('id')
        if not invite_id:
            return Response({"detail": "Invitation ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        invitation = get_object_or_404(UserInvitation, id=invite_id)
        invitation.is_cancelled = True
        invitation.save()
        
        log_activity(request.user, f"Cancelled invitation for {invitation.email}", "users", request)
        return Response(UserInvitationSerializer(invitation).data)

    def delete_invitation(self, request, pk=None):
        invitation = get_object_or_404(UserInvitation, id=pk)
        email = invitation.email
        invitation.delete()
        log_activity(request.user, f"Deleted invitation record for {email}", "users", request)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_invitation(self, request, token=None):
        invitation = get_object_or_404(UserInvitation, token=token)
        now = timezone.now()
        
        # Return state details if token is expired, cancelled, or used
        status_val = 'Pending'
        detail_msg = ''
        
        if invitation.is_used:
            status_val = 'Accepted'
            detail_msg = 'Invitation Already Used'
        elif invitation.is_cancelled:
            status_val = 'Cancelled'
            detail_msg = 'Invitation Invalid'
        elif invitation.expires_at < now:
            status_val = 'Expired'
            detail_msg = 'Invitation Expired'
            
        data = UserInvitationSerializer(invitation).data
        if status_val != 'Pending':
            return Response({
                "status": status_val,
                "detail": detail_msg,
                "invitation": data
            }, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(data)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        name = serializer.validated_data['name']
        password = serializer.validated_data['password']
        phone = serializer.validated_data.get('phone', '')
        designation = serializer.validated_data.get('designation', '')
        stream_val = serializer.validated_data.get('stream', '')
        department_val = serializer.validated_data.get('department', '')
        company_name = serializer.validated_data.get('company_name', '')
        
        invitation = get_object_or_404(UserInvitation, token=token)
        now = timezone.now()
        
        if invitation.is_used or invitation.is_cancelled or invitation.expires_at < now:
            return Response({"detail": "This invitation link is invalid, expired, used, or cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Extract IP and User Agent
        ip_addr = request.META.get('REMOTE_ADDR')
        user_agt = request.META.get('HTTP_USER_AGENT')
        
        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    email=invitation.email,
                    password=password,
                    name=name,
                    phone=phone,
                    designation=designation,
                    department=invitation.department or department_val,
                    stream=invitation.stream or stream_val,
                    company_name=company_name,
                    role=invitation.system_role,
                    status='Active'
                )
                
                # Mark invitation as used
                invitation.is_used = True
                invitation.accepted_at = now
                invitation.ip_address = ip_addr
                invitation.user_agent = user_agt
                invitation.save()
                
                # Log activity
                log_activity(user, "Completed registration via invitation", "authentication", request)
                create_notification(
                    user, 
                    "Welcome to MCC LEGAL DOCUMENT", 
                    f"Hi {name}, your registration has been successfully completed. You can now explore the registry."
                )
                notify_admins("Invitation Registration Completed", f"User {name} ({invitation.email}) completed registration.")
                
            return Response({"detail": "Registration completed successfully. You can now sign in."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to complete user registration from invitation")
            return Response({"detail": f"Registration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
