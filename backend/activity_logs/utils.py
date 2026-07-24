from .models import ActivityLog

def get_client_ip(request):
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_activity(user, action, module, request=None):
    """
    Logs an audit event in the system.
    """
    ip = get_client_ip(request) if request else None
    
    # Check if the user is authenticated, else default to None (Anonymous/System)
    log_user = user if (user and user.is_authenticated) else None
    
    try:
        ActivityLog.objects.create(
            user=log_user,
            action=action,
            module=module,
            ip_address=ip
        )
    except Exception as e:
        # We fail silently or log to server stdout if database logging fails,
        # so it doesn't break the actual application workflow.
        print(f"Failed to log activity: {e}")
