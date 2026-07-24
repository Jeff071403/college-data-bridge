from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.contrib.auth import get_user_model
from permissions.custom_permissions import HasDynamicPermission, get_user_permissions
from activity_logs.utils import log_activity
from notifications.utils import create_notification, notify_admins
from folders.models import Folder
from .models import File, FileVersion
from .serializers import FileSerializer, FileVersionSerializer
import mimetypes
import os

User = get_user_model()

def has_explicit_permission_grant(user, codename):
    from users.models import UserPermission
    return UserPermission.objects.filter(user=user, permission__codename=codename, is_granted=True).exists()

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [HasDynamicPermission]

    # Map actions to dynamic permissions
    action_permissions = {
        'list': 'view_folder',
        'retrieve': 'view_folder',
        'create': 'upload_files',
        'update': 'replace_files',  # Using replace_files for renaming
        'partial_update': 'replace_files',
        'destroy': 'delete_files',
        'download': 'download_files',
        'preview': 'preview_files',
        'replace': 'replace_files',
    }

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return File.objects.none()

        # Super Admin sees all files
        if user.role and user.role.name == "Super Admin":
            return File.objects.all().order_by('-updated_at')

        # Filter files by folder access
        all_folders = Folder.objects.all()
        accessible_folder_ids = [f.id for f in all_folders if f.has_access(user)]
        return File.objects.filter(folder_id__in=accessible_folder_ids).order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        # Read parameters
        folder_id = request.data.get('folder_id')
        uploaded_file = request.FILES.get('file')

        if not folder_id:
            return Response({"folder_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if not uploaded_file:
            return Response({"file": ["No file was uploaded."]}, status=status.HTTP_400_BAD_REQUEST)

        folder = get_object_or_404(Folder, id=folder_id)

        # Check user access to parent folder
        if not folder.has_access(request.user):
            return Response(
                {"detail": "You do not have access to this folder."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check action permission
        active_perms = get_user_permissions(request.user)
        is_super = request.user.role and request.user.role.name == "Super Admin"
        if not is_super and 'upload_files' not in active_perms:
            return Response(
                {"detail": "You do not have permission to upload files."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Extract file info
        name = uploaded_file.name
        size = uploaded_file.size
        # Guess mime type
        file_type, _ = mimetypes.guess_type(name)
        if not file_type:
            file_type = "application/octet-stream"

        file_instance = File.objects.create(
            name=name,
            size=size,
            file_type=file_type,
            folder=folder,
            uploaded_by=request.user,
            file_field=uploaded_file
        )

        # Log & Notify
        log_activity(request.user, f"Uploaded file '{name}' to folder '{folder.name}'", "files", request)
        notify_admins("File Uploaded", f"File '{name}' was uploaded to '{folder.name}' by {request.user.name}.", metadata={'action': 'file_uploaded', 'file_id': file_instance.id, 'file_name': file_instance.name, 'folder_id': folder.id, 'folder_name': folder.name})

        return Response(FileSerializer(file_instance, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        # We handle renaming files via PUT/PATCH
        file_instance = self.get_object()
        
        # Folder access check
        if not file_instance.folder.has_access(request.user):
            return Response({"detail": "You do not have access to this file's folder."}, status=status.HTTP_403_FORBIDDEN)
            
        old_name = file_instance.name
        new_name = request.data.get('name')
        
        if not new_name:
            return Response({"name": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        file_instance.name = new_name
        file_instance.save(update_fields=['name', 'updated_at'])

        log_activity(request.user, f"Renamed file from '{old_name}' to '{new_name}'", "files", request)

        return Response(FileSerializer(file_instance, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        file_instance = self.get_object()
        
        # Access check
        if not file_instance.folder.has_access(request.user):
            return Response({"detail": "You do not have access to this file's folder."}, status=status.HTTP_403_FORBIDDEN)
            
        name = file_instance.name
        folder_name = file_instance.folder.name
        
        # Delete file from disk
        if file_instance.file_field and os.path.exists(file_instance.file_field.path):
            os.remove(file_instance.file_field.path)
            
        # Delete versions from disk
        for version in file_instance.versions.all():
            if version.file_field and os.path.exists(version.file_field.path):
                os.remove(version.file_field.path)

        file_instance.delete()

        log_activity(request.user, f"Deleted file '{name}' from folder '{folder_name}'", "files", request)
        notify_admins("File Deleted", f"File '{name}' was deleted from '{folder_name}' by {request.user.name}.", metadata={'action': 'file_deleted', 'file_name': name, 'folder_name': folder_name})

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_instance = self.get_object()
        
        # Folder access check
        if not file_instance.folder.has_access(request.user):
            return Response({"detail": "You do not have access to this file's folder."}, status=status.HTTP_403_FORBIDDEN)

        # Restrict PDF downloads to administrators or explicitly granted users
        is_pdf = file_instance.file_type == 'application/pdf' or file_instance.name.lower().endswith('.pdf')
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        has_override = has_explicit_permission_grant(request.user, "download_files")
        if is_pdf and not (is_admin or has_override):
            return Response(
                {"detail": "PDF downloads are restricted to administrators."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if not file_instance.file_field or not os.path.exists(file_instance.file_field.path):
            raise Http404("File does not exist on storage.")

        # Log download action
        log_activity(request.user, f"Downloaded file '{file_instance.name}'", "files", request)

        response = FileResponse(open(file_instance.file_field.path, 'rb'), as_attachment=True)
        response['Content-Disposition'] = f'attachment; filename="{file_instance.name}"'
        return response

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        file_instance = self.get_object()
        
        # Folder access check
        if not file_instance.folder.has_access(request.user):
            return Response({"detail": "You do not have access to this file's folder."}, status=status.HTTP_403_FORBIDDEN)

        # Restrict PDF viewing to administrators or explicitly granted users
        is_pdf = file_instance.file_type == 'application/pdf' or file_instance.name.lower().endswith('.pdf')
        is_admin = request.user.role and request.user.role.name in ["Super Admin", "Admin"]
        has_override = has_explicit_permission_grant(request.user, "preview_files")
        if is_pdf and not (is_admin or has_override):
            return Response(
                {"detail": "PDF previews are restricted to administrators."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if not file_instance.file_field or not os.path.exists(file_instance.file_field.path):
            raise Http404("File does not exist on storage.")

        # Log preview action
        log_activity(request.user, f"Previewed file '{file_instance.name}'", "files", request)

        response = FileResponse(open(file_instance.file_field.path, 'rb'), as_attachment=False)
        response['Content-Type'] = file_instance.file_type
        return response

    @action(detail=True, methods=['post'])
    def replace(self, request, pk=None):
        """
        Replaces the current file. The current file is archived in FileVersion,
        and the main File object is updated with the new upload.
        """
        file_instance = self.get_object()
        uploaded_file = request.FILES.get('file')

        if not file_instance.folder.has_access(request.user):
            return Response({"detail": "You do not have access to this file's folder."}, status=status.HTTP_403_FORBIDDEN)

        if not uploaded_file:
            return Response({"file": ["No replacement file was uploaded."]}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Archive the current file to FileVersion
        # We need to duplicate the file field or move it.
        # To avoid deleting the old file when overwriting File.file_field,
        # we can create a FileVersion pointing to the current file field,
        # and then create a new file upload for File.file_field.
        # This keeps the media directory clean.
        
        FileVersion.objects.create(
            file=file_instance,
            version_number=file_instance.version_number,
            name=file_instance.name,
            size=file_instance.size,
            file_type=file_instance.file_type,
            file_field=file_instance.file_field,
            uploaded_by=file_instance.uploaded_by
        )

        # 2. Update File with new info
        name = uploaded_file.name
        size = uploaded_file.size
        file_type, _ = mimetypes.guess_type(name)
        if not file_type:
            file_type = "application/octet-stream"

        file_instance.name = name
        file_instance.size = size
        file_instance.file_type = file_type
        file_instance.uploaded_by = request.user
        file_instance.version_number += 1
        file_instance.file_field = uploaded_file
        file_instance.save()

        # Log & Notify
        log_activity(request.user, f"Replaced file '{file_instance.name}' (New Version: v{file_instance.version_number})", "files", request)
        notify_admins("File Updated", f"File '{file_instance.name}' was replaced with version {file_instance.version_number} by {request.user.name}.", metadata={'action': 'file_replaced', 'file_id': file_instance.id, 'file_name': file_instance.name, 'folder_id': file_instance.folder.id, 'folder_name': file_instance.folder.name})

        return Response(FileSerializer(file_instance, context={'request': request}).data)
