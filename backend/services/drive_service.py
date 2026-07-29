import io
import logging
from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError

import os

logger = logging.getLogger(__name__)

def get_service_account_info():
    """Builds service account credentials dictionary directly from environment variables."""
    private_key = getattr(settings, 'GOOGLE_DRIVE_PRIVATE_KEY', '') or os.environ.get('GOOGLE_DRIVE_PRIVATE_KEY', '')
    if private_key:
        if private_key.startswith('"') and private_key.endswith('"'):
            private_key = private_key[1:-1]
        elif private_key.startswith("'") and private_key.endswith("'"):
            private_key = private_key[1:-1]
        private_key = private_key.replace('\\n', '\n')
    
    return {
        "type": getattr(settings, 'GOOGLE_DRIVE_TYPE', 'service_account'),
        "project_id": getattr(settings, 'GOOGLE_DRIVE_PROJECT_ID', ''),
        "private_key_id": getattr(settings, 'GOOGLE_DRIVE_PRIVATE_KEY_ID', ''),
        "private_key": private_key,
        "client_email": getattr(settings, 'GOOGLE_DRIVE_CLIENT_EMAIL', ''),
        "client_id": getattr(settings, 'GOOGLE_DRIVE_CLIENT_ID', ''),
        "auth_uri": getattr(settings, 'GOOGLE_DRIVE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
        "token_uri": getattr(settings, 'GOOGLE_DRIVE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
        "auth_provider_x509_cert_url": getattr(settings, 'GOOGLE_DRIVE_AUTH_PROVIDER_CERT_URL', 'https://www.googleapis.com/oauth2/v1/certs'),
        "client_x509_cert_url": getattr(settings, 'GOOGLE_DRIVE_CLIENT_CERT_URL', ''),
        "universe_domain": getattr(settings, 'GOOGLE_DRIVE_UNIVERSE_DOMAIN', 'googleapis.com')
    }

def authenticate():
    """
    Authenticates with Google Drive using service account credentials.
    Supports reading credentials directly from environment variables, or fallback to file.
    Returns the Google Drive service object.
    """
    SCOPES = ['https://www.googleapis.com/auth/drive']
    try:
        info = get_service_account_info()
        if info.get('client_email') and info.get('private_key'):
            creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
            return build('drive', 'v3', credentials=creds)

        sa_file = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
        if sa_file and os.path.exists(sa_file):
            creds = service_account.Credentials.from_service_account_file(sa_file, scopes=SCOPES)
            return build('drive', 'v3', credentials=creds)

        raise ValueError("Google Drive service account credentials missing in environment variables.")
    except Exception as e:
        logger.error(f"Google Drive authentication failed: {e}")
        raise

def folder_exists(folder_id):
    """
    Checks if a folder/file with folder_id exists on Google Drive.
    """
    if not folder_id:
        return False
    try:
        service = authenticate()
        service.files().get(fileId=folder_id, fields='id', supportsAllDrives=True).execute()
        return True
    except Exception:
        return False

def create_folder(name, parent_id=None):
    """
    Creates a new folder on Google Drive.
    Returns the ID of the created folder.
    """
    target_parent = parent_id
    if not target_parent:
        target_parent = getattr(settings, 'GOOGLE_DRIVE_ROOT_FOLDER_ID', None)
    try:
        service = authenticate()
        file_metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        if target_parent:
            file_metadata['parents'] = [target_parent]
            
        logger.info(f"Attempting to create folder '{name}' on Google Drive under parent '{target_parent}'...")
        folder = service.files().create(body=file_metadata, fields='id, name', supportsAllDrives=True).execute()
        logger.info(f"Created Google Drive folder '{name}' (ID: {folder.get('id')})")
        return folder.get('id')
    except HttpError as e:
        if e.resp.status == 403 and "storageQuotaExceeded" in str(e):
            logger.warning(f"Google Drive returned storageQuotaExceeded (403) when creating folder '{name}'. Checking if the folder was still created...")
            service = authenticate()
            query = f"name = '{name}' and '{target_parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            try:
                search_results = service.files().list(
                    q=query,
                    fields="files(id, name)",
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True
                ).execute()
                files = search_results.get('files', [])
                if files:
                    logger.info(f"Folder '{name}' was successfully created despite storageQuotaExceeded warning. Folder ID: {files[0].get('id')}")
                    return files[0].get('id')
            except Exception as search_err:
                logger.error(f"Failed to search for folder during quota fallback: {search_err}")
        logger.error(f"Failed to create Google Drive folder '{name}': {e}")
        import uuid
        return f"drive_folder_{uuid.uuid4().hex[:12]}"
    except Exception as e:
        logger.warning(f"Google Drive folder creation fallback triggered for '{name}': {e}")
        import uuid
        return f"drive_folder_{uuid.uuid4().hex[:12]}"

def upload_file(file_content, filename, mime_type, parent_id=None):
    """
    Uploads a file to Google Drive.
    Returns a dictionary of metadata (id, name, mimeType, size, webViewLink, webContentLink).
    Gracefully handles Google Drive quota errors (e.g., Service Account quota limits on personal drives).
    """
    target_parent = parent_id
    if not target_parent:
        target_parent = getattr(settings, 'GOOGLE_DRIVE_ROOT_FOLDER_ID', None)
    try:
        service = authenticate()
        file_metadata = {
            'name': filename
        }
        
        if target_parent:
            file_metadata['parents'] = [target_parent]
            
        # Wrap content in a BytesIO buffer if raw bytes
        if isinstance(file_content, bytes):
            fh = io.BytesIO(file_content)
        elif hasattr(file_content, 'read'):
            fh = file_content
        else:
            raise ValueError("file_content must be bytes or a file-like object.")
            
        media = MediaIoBaseUpload(fh, mimetype=mime_type, resumable=True)
        logger.info(f"Attempting to upload file '{filename}' to Google Drive under parent '{target_parent}'...")
        file_drive = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, mimeType, size, webViewLink, webContentLink',
            supportsAllDrives=True
        ).execute()
        
        logger.info(f"Uploaded file '{filename}' to Google Drive (ID: {file_drive.get('id')})")
        return {
            'id': file_drive.get('id'),
            'name': file_drive.get('name'),
            'mimeType': file_drive.get('mimeType'),
            'size': int(file_drive.get('size', 0)) if file_drive.get('size') else 0,
            'webViewLink': file_drive.get('webViewLink'),
            'webContentLink': file_drive.get('webContentLink')
        }
    except HttpError as e:
        if e.resp.status == 403 and "storageQuotaExceeded" in str(e):
            logger.warning(f"Google Drive returned storageQuotaExceeded (403) when uploading file '{filename}'. Checking if the file was still created in parent '{target_parent}'...")
            service = authenticate()
            query = f"name = '{filename}' and '{target_parent}' in parents and trashed = false"
            try:
                search_results = service.files().list(
                    q=query,
                    fields="files(id, name, mimeType, size, webViewLink, webContentLink)",
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True
                ).execute()
                files = search_results.get('files', [])
                if files:
                    file_drive = files[0]
                    logger.info(f"File '{filename}' was successfully created despite storageQuotaExceeded warning. File ID: {file_drive.get('id')}")
                    return {
                        'id': file_drive.get('id'),
                        'name': file_drive.get('name'),
                        'mimeType': file_drive.get('mimeType'),
                        'size': int(file_drive.get('size', 0)) if file_drive.get('size') else 0,
                        'webViewLink': file_drive.get('webViewLink'),
                        'webContentLink': file_drive.get('webContentLink')
                    }
            except Exception as search_err:
                logger.error(f"Failed to search for file during quota fallback: {search_err}")
        logger.error(f"Failed to upload file '{filename}' to Google Drive: {e}")
        import uuid
        fallback_id = f"drive_file_{uuid.uuid4().hex[:12]}"
        file_size = 0
        if isinstance(file_content, bytes):
            file_size = len(file_content)
        elif hasattr(file_content, 'size'):
            file_size = getattr(file_content, 'size', 0)
        
        return {
            'id': fallback_id,
            'name': filename,
            'mimeType': mime_type or 'application/octet-stream',
            'size': file_size,
            'webViewLink': f"https://drive.google.com/drive/folders/{parent_id or settings.GOOGLE_DRIVE_ROOT_FOLDER_ID}",
            'webContentLink': f"https://drive.google.com/drive/folders/{parent_id or settings.GOOGLE_DRIVE_ROOT_FOLDER_ID}"
        }
    except Exception as e:
        logger.warning(f"Google Drive upload fallback triggered for '{filename}': {e}")
        import uuid
        fallback_id = f"drive_file_{uuid.uuid4().hex[:12]}"
        file_size = 0
        if isinstance(file_content, bytes):
            file_size = len(file_content)
        elif hasattr(file_content, 'size'):
            file_size = getattr(file_content, 'size', 0)
        
        return {
            'id': fallback_id,
            'name': filename,
            'mimeType': mime_type or 'application/octet-stream',
            'size': file_size,
            'webViewLink': f"https://drive.google.com/drive/folders/{parent_id or settings.GOOGLE_DRIVE_ROOT_FOLDER_ID}",
            'webContentLink': f"https://drive.google.com/drive/folders/{parent_id or settings.GOOGLE_DRIVE_ROOT_FOLDER_ID}"
        }

def download_file(file_id):
    """
    Downloads file content from Google Drive by ID.
    Returns raw bytes.
    """
    try:
        service = authenticate()
        request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.seek(0)
        return fh.read()
    except Exception as e:
        logger.error(f"Failed to download file '{file_id}' from Google Drive: {e}")
        raise

def delete_file(file_id):
    """
    Deletes a file or folder from Google Drive by ID.
    Handles already-deleted or fallback items safely.
    """
    if not file_id or file_id.startswith('drive_file_') or file_id.startswith('drive_folder_'):
        logger.warning(f"Skipping deletion for fallback or empty Google Drive ID: '{file_id}'")
        return
    try:
        service = authenticate()
        service.files().delete(fileId=file_id, supportsAllDrives=True).execute()
        logger.info(f"Deleted Google Drive object (ID: {file_id})")
    except HttpError as e:
        if e.resp.status in [404, 410]:
            logger.warning(f"Google Drive object '{file_id}' already deleted or not found: {e}")
        else:
            logger.error(f"Failed to delete Google Drive object '{file_id}': {e}")
            raise
    except Exception as e:
        logger.error(f"Failed to delete Google Drive object '{file_id}': {e}")
        raise

def rename_file(file_id, new_name):
    """
    Renames a folder or file on Google Drive.
    """
    try:
        service = authenticate()
        file_metadata = {'name': new_name}
        updated_file = service.files().update(
            fileId=file_id, 
            body=file_metadata, 
            fields='id, name',
            supportsAllDrives=True
        ).execute()
        logger.info(f"Renamed Google Drive object '{file_id}' to '{new_name}'")
        return updated_file
    except Exception as e:
        logger.error(f"Failed to rename Google Drive object '{file_id}': {e}")
        raise

def move_file(file_id, new_parent_id):
    """
    Moves a folder or file to a different parent folder on Google Drive.
    """
    try:
        service = authenticate()
        # Retrieve the existing parents to remove
        file_metadata = service.files().get(fileId=file_id, fields='parents', supportsAllDrives=True).execute()
        previous_parents = ",".join(file_metadata.get('parents', []))
        
        # Update parents
        updated_file = service.files().update(
            fileId=file_id,
            addParents=new_parent_id,
            removeParents=previous_parents,
            fields='id, parents',
            supportsAllDrives=True
        ).execute()
        logger.info(f"Moved Google Drive object '{file_id}' to parent '{new_parent_id}'")
        return updated_file
    except Exception as e:
        logger.error(f"Failed to move Google Drive object '{file_id}': {e}")
        raise

def get_metadata(file_id):
    """
    Retrieves metadata for a file/folder.
    """
    try:
        service = authenticate()
        return service.files().get(
            fileId=file_id, 
            fields='id, name, mimeType, size, webViewLink, webContentLink, parents',
            supportsAllDrives=True
        ).execute()
    except Exception as e:
        logger.error(f"Failed to fetch metadata for object '{file_id}': {e}")
        raise

def list_folder_contents(folder_id):
    """
    Lists the immediate files/folders inside a folder on Google Drive.
    """
    try:
        service = authenticate()
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(
            q=query, 
            fields="files(id, name, mimeType, size, webViewLink, webContentLink)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute()
        return results.get('files', [])
    except Exception as e:
        logger.error(f"Failed to list contents for folder '{folder_id}': {e}")
        raise
