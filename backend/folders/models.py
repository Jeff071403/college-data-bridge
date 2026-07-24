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
        1. If user is Super Admin, they have access to everything.
        2. Check for an explicit FolderPermission record for the current folder.
        3. If not found, traverse up to the parent folder.
        4. If no rule is found at any level:
           - Admins have access by default.
           - Normal Users do not have access by default.
        """
        if not user or not user.is_authenticated:
            return False
            
        if user.role and user.role.name == "Super Admin":
            return True

        current = self
        while current is not None:
            perm = FolderPermission.objects.filter(user=user, folder=current).first()
            if perm is not None:
                return perm.is_granted
            current = current.parent

        # Default fallback if no rules found on the folder path
        if user.role and user.role.name == "Admin":
            return True
            
        return False

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
