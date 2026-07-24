from .models import Notification
from django.contrib.auth import get_user_model

def create_notification(user, title, description, metadata=None):
    """
    Creates an in-app notification for a specific user.
    """
    if metadata is None:
        metadata = {}
    try:
        return Notification.objects.create(
            user=user,
            title=title,
            description=description,
            metadata=metadata
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
        return None

def notify_admins(title, description, metadata=None):
    """
    Sends a notification to all Admin and Super Admin users.
    """
    User = get_user_model()
    # Find all users with Super Admin or Admin roles
    admins = User.objects.filter(role__name__in=["Super Admin", "Admin"])
    for admin in admins:
        create_notification(admin, title, description, metadata)

def notify_all(title, description, metadata=None):
    """
    Broadcasts a notification to all active users.
    """
    User = get_user_model()
    users = User.objects.filter(status='Active')
    for user in users:
        create_notification(user, title, description, metadata)
