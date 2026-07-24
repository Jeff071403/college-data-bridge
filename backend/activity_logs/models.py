from django.db import models
from django.conf import settings

class ActivityLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='activity_logs'
    )
    action = models.TextField()
    module = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.email if self.user else "System"
        return f"{user_str} - {self.action} ({self.created_at})"

    # Prevent saving modifications or deleting audit logs at the Django model layer
    def delete(self, *args, **kwargs):
        raise NotImplementedError("Audit logs cannot be deleted.")

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise NotImplementedError("Audit logs cannot be modified.")
        super().save(*args, **kwargs)
