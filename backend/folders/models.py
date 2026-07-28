from django.db import models
from django.conf import settings

class Folder(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='children'
    )
    google_folder_id = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_folders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_ancestors(self):
        """Returns a list of ancestor folders from root down to parent."""
        ancestors = []
        current = self.parent
        while current is not None:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors

    def has_access(self, user):
        """
        Recursively checks folder access up the ancestral chain.
        1. Unauthenticated users have no access.
        2. Super Admin or creator of this folder / ancestor folder has full access.
        3. Check for explicit FolderPermission (grant/revoke).
        4. Check for dynamic MOU sharing access.
        5. Default fallback: authenticated users have access unless explicitly revoked.
        """
        if not user or not user.is_authenticated:
            return False
            
        if user.role and user.role.name == "Super Admin":
            return True

        current = self
        while current is not None:
            # Creator of folder or ancestor folder always has full access
            if current.created_by == user:
                return True

            perm = FolderPermission.objects.filter(user=user, folder=current).first()
            if perm is not None:
                return perm.is_granted
            current = current.parent

        # Check MOU shares
        share_perm = get_mou_share_permission(user, self)
        if share_perm is not None:
            return True

        # Default fallback for authenticated users
        return True

def choose_higher_permission(p1, p2):
    levels = {
        None: 0,
        'View Only': 1,
        'Upload Only': 2,
        'Edit': 3,
        'Full Access': 4
    }
    if levels.get(p1, 0) >= levels.get(p2, 0):
        return p1
    return p2

def get_mou_share_permission(user, folder):
    """
    Checks if there is an active MOUShare for this folder or its ancestors.
    Returns the permission level ('View Only', 'Upload Only', 'Edit', 'Full Access') or None.
    """
    if not user or not user.is_authenticated:
        return None

    if user.role and user.role.name == "Super Admin":
        return 'Full Access'

    try:
        from mous.models import MOUShare, MOU
        current_folder = folder
        best_permission = None

        while current_folder is not None:
            mous = MOU.objects.filter(department=current_folder)
            for m in mous:
                shares = MOUShare.objects.filter(mou=m)
                
                # Check department shares
                if user.department:
                    dept_shares = shares.filter(department__name=user.department)
                    for ds in dept_shares:
                        best_permission = choose_higher_permission(best_permission, ds.permission)

                # Check individual shares
                user_shares = shares.filter(user=user)
                for us in user_shares:
                    best_permission = choose_higher_permission(best_permission, us.permission)
            
            current_folder = current_folder.parent
        
        return best_permission
    except Exception:
        return None


class FolderPermission(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='folder_permissions'
    )
    folder = models.ForeignKey(
        Folder,
        on_delete=models.CASCADE,
        related_name='folder_permissions'
    )
    is_granted = models.BooleanField(default=True) # True = Granted, False = Revoked

    class Meta:
        unique_together = ('user', 'folder')

    def __str__(self):
        status = "Granted" if self.is_granted else "Revoked"
        return f"{self.user.email} - {self.folder.name} ({status})"
