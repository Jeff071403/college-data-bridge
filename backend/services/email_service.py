from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_invitation_email(email, invite_url, expires_at):
    """
    Renders and sends a professional HTML invitation email using Django SMTP configurations.
    """
    try:
        subject = "You're Invited to Join MCC Legal Document"
        
        # Render HTML template with context
        context = {
            'invite_url': invite_url,
            'expires_at_str': expires_at.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'company_logo_url': getattr(settings, 'COMPANY_LOGO_URL', 'https://example.com/logo.png')
        }
        html_content = render_to_string('emails/user_invitation.html', context)
        text_content = f"You have been invited to join MCC LEGAL DOCUMENT. Complete your registration by visiting: {invite_url}"
        
        # Construct and send email
        from users.models import SMTPSetting
        from django.core.mail import get_connection
        
        # Check for active custom SMTP setting
        smtp_setting = SMTPSetting.objects.filter(is_active=True).first()
        connection = None
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@mcc.edu')
        
        if smtp_setting:
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=smtp_setting.host,
                port=smtp_setting.port,
                username=smtp_setting.username if smtp_setting.auth_required else None,
                password=smtp_setting.password if smtp_setting.auth_required else None,
                use_tls=smtp_setting.use_tls,
                use_ssl=smtp_setting.use_ssl,
            )
            from_email = f"MCC LEGAL DOCUMENT <{smtp_setting.sender_email}>"
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[email],
            connection=connection
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        logger.info(f"Invitation email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"SMTP error while sending invitation email to {email}: {e}", exc_info=True)
        raise e
