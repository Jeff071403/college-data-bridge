from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from permissions.custom_permissions import HasDynamicPermission
from activity_logs.utils import log_activity
from notifications.utils import create_notification, notify_admins
from .models import Folder, FolderPermission, get_mou_share_permission
from .serializers import FolderSerializer, FolderPermissionSerializer
from files.serializers import FileSerializer # For listing files in folder
from django.db import transaction
from services import drive_service
import logging

logger = logging.getLogger(__name__)

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
            
            # Share permission restriction
            is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
            if not is_admin and parent_folder.created_by != request.user:
                share_perm = get_mou_share_permission(request.user, parent_folder)
                if share_perm in ['View Only', 'Upload Only']:
                    return Response(
                        {"detail": "You only have read/upload access and cannot create subfolders here."},
                        status=status.HTTP_403_FORBIDDEN
                    )

        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                folder = serializer.save(created_by=request.user)

                # Get parent Google folder ID
                parent_google_id = None
                if parent_folder:
                    parent_google_id = parent_folder.google_folder_id

                # Create folder on Google Drive (Strict: Google Drive is required)
                google_folder_id = drive_service.create_folder(folder.name, parent_google_id)
                folder.google_folder_id = google_folder_id
                folder.save(update_fields=['google_folder_id'])

                # Support custom creation date/time
                custom_created_at = request.data.get('created_at')
                if custom_created_at:
                    from django.utils.dateparse import parse_datetime
                    parsed_dt = parse_datetime(custom_created_at)
                    if parsed_dt:
                        Folder.objects.filter(pk=folder.pk).update(created_at=parsed_dt)
                        folder.refresh_from_db()

                # Audit & Notify
                log_activity(request.user, f"Created folder '{folder.name}'", "folders", request)
                notify_admins("Folder Created", f"Folder '{folder.name}' was created by {request.user.name}.", metadata={'action': 'folder_created', 'folder_id': folder.id, 'folder_name': folder.name})
        except Exception as e:
            return Response({"detail": f"Google Drive folder creation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        headers = self.get_success_headers(serializer.data)
        return Response(FolderSerializer(folder).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        folder = self.get_object()
        old_name = folder.name
        
        # Access check: user created the folder or has folder access
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to edit this folder."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Share permission restriction (unless user created the folder)
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        if not is_admin and folder.created_by != request.user:
            share_perm = get_mou_share_permission(request.user, folder)
            if share_perm in ['View Only', 'Upload Only']:
                return Response(
                    {"detail": "You only have read/upload access and cannot edit folders here."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        try:
            with transaction.atomic():
                serializer = self.get_serializer(folder, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                updated_folder = serializer.save()
                
                # Sync rename to Google Drive
                if updated_folder.google_folder_id and old_name != updated_folder.name:
                    drive_service.rename_file(updated_folder.google_folder_id, updated_folder.name)

                # Log & Notify
                log_activity(request.user, f"Renamed folder from '{old_name}' to '{updated_folder.name}'", "folders", request)
                notify_admins("Folder Renamed", f"Folder '{old_name}' was renamed to '{updated_folder.name}' by {request.user.name}.", metadata={'action': 'folder_renamed', 'folder_id': updated_folder.id, 'folder_name': updated_folder.name})
        except Exception as e:
            return Response({"detail": f"Google Drive folder rename failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(FolderSerializer(updated_folder).data)

    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        
        # Access check: user created the folder or has access
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to delete this folder."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Share permission restriction (unless user created the folder)
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        if not is_admin and folder.created_by != request.user:
            share_perm = get_mou_share_permission(request.user, folder)
            if share_perm in ['View Only', 'Upload Only']:
                return Response(
                    {"detail": "You only have read/upload access and cannot delete folders here."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        folder_name = folder.name
        google_folder_id = folder.google_folder_id
        
        try:
            with transaction.atomic():
                if google_folder_id:
                    drive_service.delete_file(google_folder_id)
                self.perform_destroy(folder)
                    
                # Log & Notify
                log_activity(request.user, f"Deleted folder '{folder_name}'", "folders", request)
                notify_admins("Folder Deleted", f"Folder '{folder_name}' was deleted by {request.user.name}.", metadata={'action': 'folder_deleted', 'folder_name': folder_name})
        except Exception as e:
            return Response({"detail": f"Google Drive folder deletion failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='drive-status', permission_classes=[permissions.IsAuthenticated])
    def drive_status(self, request):
        """Tests Google Drive connectivity and returns status."""
        try:
            svc = drive_service.authenticate()
            # Try to get the root folder metadata as a live ping
            from django.conf import settings
            root_id = settings.GOOGLE_DRIVE_ROOT_FOLDER_ID
            meta = svc.files().get(fileId=root_id, fields='id,name').execute()
            return Response({
                'connected': True,
                'root_folder_id': root_id,
                'root_folder_name': meta.get('name'),
                'service_account': settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            })
        except Exception as e:
            return Response({
                'connected': False,
                'error': str(e),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['post'], url_path='create')
    def create_custom(self, request):
        """
        Maps to POST /api/folders/create/
        """
        return self.create(request)

    @action(detail=False, methods=['put'], url_path='rename')
    def rename_custom(self, request):
        """
        Maps to PUT /api/folders/rename/
        """
        folder_id = request.data.get('folder_id')
        new_name = request.data.get('name')
        if not folder_id or not new_name:
            return Response({"folder_id": ["This field is required."], "name": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
        folder = get_object_or_404(Folder, id=folder_id)
        if not folder.has_access(request.user):
            return Response({"detail": "You do not have access to this folder."}, status=status.HTTP_403_FORBIDDEN)
            
        # Share permission restriction
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        if not is_admin:
            share_perm = get_mou_share_permission(request.user, folder)
            if share_perm in ['View Only', 'Upload Only']:
                return Response(
                    {"detail": "You only have read/upload access and cannot edit folders here."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        old_name = folder.name
        try:
            with transaction.atomic():
                folder.name = new_name
                folder.save(update_fields=['name', 'updated_at'])
                
                if folder.google_folder_id:
                    drive_service.rename_file(folder.google_folder_id, new_name)
                    
                log_activity(request.user, f"Renamed folder from '{old_name}' to '{new_name}'", "folders", request)
                notify_admins("Folder Renamed", f"Folder '{old_name}' was renamed to '{new_name}' by {request.user.name}.", metadata={'action': 'folder_renamed', 'folder_id': folder.id, 'folder_name': folder.name})
        except Exception as e:
            return Response({"detail": f"Rename sync with Google Drive failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(FolderSerializer(folder).data)

    @action(detail=False, methods=['delete'], url_path='delete')
    def delete_custom(self, request):
        """
        Maps to DELETE /api/folders/delete/
        """
        folder_id = request.data.get('folder_id') or request.query_params.get('folder_id')
        if not folder_id:
            return Response({"folder_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
        folder = get_object_or_404(Folder, id=folder_id)
        if not folder.has_access(request.user):
            return Response({"detail": "You do not have access to this folder."}, status=status.HTTP_403_FORBIDDEN)
            
        # Share permission restriction
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        if not is_admin:
            share_perm = get_mou_share_permission(request.user, folder)
            if share_perm in ['View Only', 'Upload Only']:
                return Response(
                    {"detail": "You only have read/upload access and cannot delete folders here."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        folder_name = folder.name
        google_folder_id = folder.google_folder_id
        
        try:
            with transaction.atomic():
                if google_folder_id:
                    drive_service.delete_file(google_folder_id)
                folder.delete()
                
                log_activity(request.user, f"Deleted folder '{folder_name}'", "folders", request)
                notify_admins("Folder Deleted", f"Folder '{folder_name}' was deleted by {request.user.name}.", metadata={'action': 'folder_deleted', 'folder_name': folder_name})
        except Exception as e:
            return Response({"detail": f"Deletion sync with Google Drive failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
