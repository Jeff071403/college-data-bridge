from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from permissions.custom_permissions import HasDynamicPermission
from activity_logs.utils import log_activity
from notifications.utils import create_notification, notify_admins
from .models import Folder, FolderPermission
from .serializers import FolderSerializer, FolderPermissionSerializer
from files.serializers import FileSerializer # For listing files in folder

User = get_user_model()

class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [HasDynamicPermission]

    # Map actions to dynamic permissions
    action_permissions = {
        'list': 'view_folder',
        'retrieve': 'view_folder',
        'create': 'create_folder',
        'update': 'rename_folder',
        'partial_update': 'rename_folder',
        'destroy': 'delete_folder',
        'contents': 'view_folder',
        'assign_access': 'manage_users', # Only admins manage access rules
        'permissions': 'manage_users',
    }

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Folder.objects.none()
        
        # Super Admin bypasses access filters
        if user.role and user.role.name == "Super Admin":
            return Folder.objects.all().order_by('name')

        # Filter by folder accessibility (recursive lookup)
        all_folders = Folder.objects.all()
        accessible_ids = [f.id for f in all_folders if f.has_access(user)]
        return Folder.objects.filter(id__in=accessible_ids).order_by('name')

    def create(self, request, *args, **kwargs):
        # Validate parent access & nested folder permission
        parent_id = request.data.get('parent_id')
        user = request.data.get('user')
        
        # Determine permission required: create_folder or create_nested_folder
        required_perm = 'create_folder'
        parent_folder = None
        
        if parent_id:
            parent_folder = get_object_or_404(Folder, id=parent_id)
            required_perm = 'create_nested_folder'
            
            # Check if user has access to parent
            if not parent_folder.has_access(request.user):
                return Response(
                    {"detail": "You do not have access to this parent folder."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Check permission manually since view-level check handles base permissions
        from permissions.custom_permissions import get_user_permissions
        active_perms = get_user_permissions(request.user)
        
        # Super Admin doesn't need checks
        is_super_admin = request.user.role and request.user.role.name == "Super Admin"
        if not is_super_admin and required_perm not in active_perms:
            return Response(
                {"detail": f"You do not have permission to perform action: {required_perm}"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        folder = serializer.save(created_by=request.user)

        # Audit & Notify
        log_activity(request.user, f"Created folder '{folder.name}'", "folders", request)
        
        # Notify other admins
        notify_admins("Folder Created", f"Folder '{folder.name}' was created by {request.user.name}.", metadata={'action': 'folder_created', 'folder_id': folder.id, 'folder_name': folder.name})
        
        # If there's a parent, notify any user who has explicit permissions on the parent folder
        # or ancestors, so they are kept in sync
        
        headers = self.get_success_headers(serializer.data)
        return Response(FolderSerializer(folder).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        folder = self.get_object()
        old_name = folder.name
        
        # Standard edit check
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to this folder."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(folder, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_folder = serializer.save()
        
        # Log & Notify
        log_activity(request.user, f"Renamed folder from '{old_name}' to '{updated_folder.name}'", "folders", request)
        notify_admins("Folder Renamed", f"Folder '{old_name}' was renamed to '{updated_folder.name}' by {request.user.name}.", metadata={'action': 'folder_renamed', 'folder_id': updated_folder.id, 'folder_name': updated_folder.name})
        
        return Response(FolderSerializer(updated_folder).data)

    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        
        # Access check
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to this folder."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        folder_name = folder.name
        self.perform_destroy(folder)
        
        # Log & Notify
        log_activity(request.user, f"Deleted folder '{folder_name}'", "folders", request)
        notify_admins("Folder Deleted", f"Folder '{folder_name}' was deleted by {request.user.name}.", metadata={'action': 'folder_deleted', 'folder_name': folder_name})
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        """
        Returns subfolders and files inside the specified folder.
        """
        folder = self.get_object()
        
        # Access check
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to this folder."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Subfolders access filter
        subfolders = folder.children.all().order_by('name')
        if not (request.user.role and request.user.role.name == "Super Admin"):
            subfolders = [f for f in subfolders if f.has_access(request.user)]
            
        # Files in folder
        files = folder.files.all().order_by('name')
        
        subfolders_data = FolderSerializer(subfolders, many=True).data
        files_data = FileSerializer(files, many=True, context={'request': request}).data

        return Response({
            "subfolders": subfolders_data,
            "files": files_data
        })

    @action(detail=False, methods=['get'], url_path='root')
    def root_contents(self, request):
        """
        Lists folders and files at the root level (no parent).
        """
        # Get folders at root level
        root_folders = Folder.objects.filter(parent=None).order_by('name')
        
        # Filter root folders the user has access to
        if not (request.user.role and request.user.role.name == "Super Admin"):
            root_folders = [f for f in root_folders if f.has_access(request.user)]
            
        subfolders_data = FolderSerializer(root_folders, many=True).data
        
        # Files at root are not supported in standard hierarchy but if we support files at root we query parent=None.
        # However, requirements imply files are in folders. If we want files at root, we can support it.
        # But we'll stick to folders having files, root only has folders. That aligns with "Company A", "Company B" folders at root.
        
        return Response({
            "subfolders": subfolders_data,
            "files": []
        })

    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        folder = self.get_object()
        permissions = FolderPermission.objects.filter(folder=folder)
        return Response(FolderPermissionSerializer(permissions, many=True).data)

    @action(detail=True, methods=['post'], url_path='assign-access')
    def assign_access(self, request, pk=None):
        folder = self.get_object()
        user_id = request.data.get('user_id')
        is_granted = request.data.get('is_granted', True)
        
        if not user_id:
            return Response({"user_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user = get_object_or_404(User, id=user_id)
        
        # Create or update access rule
        folder_perm, created = FolderPermission.objects.update_or_create(
            user=target_user,
            folder=folder,
            defaults={'is_granted': is_granted}
        )
        
        action_type = "granted" if is_granted else "revoked"
        log_activity(
            request.user, 
            f"Explicitly {action_type} access to folder '{folder.name}' for user {target_user.email}", 
            "folders", 
            request
        )
        
        create_notification(
            target_user, 
            "Folder Access Update", 
            f"You have been {action_type} access to folder '{folder.name}'.",
            metadata={'action': 'folder_share', 'folder_id': folder.id, 'folder_name': folder.name, 'share_type': action_type}
        )
        
        return Response({
            "detail": f"Access {action_type} successfully.",
            "permission": FolderPermissionSerializer(folder_perm).data
        })
