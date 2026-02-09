import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import date
from smartyclient import settings as stns
from users.models import User

# Set up logging for better error tracking
logger = logging.getLogger(__name__)
users_email = User.objects.all().values_list('email', flat=True)

EMAIL_TEMPLATE_MAPPING = {
    'notification': 'emails/notif.html',          
    'alert': 'emails/alert.html',                 
    'confirmation': 'emails/confirmation.html',  
    'receipt': 'emails/receipt.html',             
    'workflow_approval': 'emails/approval.html', 
    'system_error': 'emails/error.html',         
    'report': 'emails/report.html',              
    'new_user': 'emails/new_user.html',              
    'password': 'emails/password_reset.html', 
}

def send_email(subject: str, template_type: str, recipients: list, 
               context: dict, attachments: list = None, from_email: str = None) -> bool:
    
    # 1. Determine the template path
    template_path = EMAIL_TEMPLATE_MAPPING.get(template_type.lower())
    if not template_path:
        logger.error(f"Invalid template_type: '{template_type}'. Available types: {list(EMAIL_TEMPLATE_MAPPING.keys())}")
        return False

    context['logo_url'] = getattr(settings, 'EMAIL_LOGO_URL', '')
    # --- END: LOGO URL IMPLEMENTATION ---

    # 2. Render HTML and extract plain text fallback
    try:
        # Render the HTML content using the provided context
        html_content = render_to_string(template_path, context)
        # Create a plain text version for clients that don't display HTML
        text_content = strip_tags(html_content)
    except Exception as e:
        logger.error(f"Error rendering template '{template_path}': {e}")
        return False
    
    # Set default 'from' email
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    # 3. Create the multi-part email message
    try:
        # Create the email connection (useful if sending many emails in a loop)
        connection = get_connection()
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=recipients, # Handles the list of recipients
            connection=connection
        )
        
        # Attach the HTML version
        msg.attach_alternative(html_content, "text/html")
        
        # 4. Attach files if provided
        if attachments:
            for filename, content, mimetype in attachments:
                msg.attach(filename, content, mimetype)

        # 5. Send the email
        msg.send(fail_silently=False)
        
        logger.info(f"Successfully sent '{template_type}' email to {', '.join(recipients)}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {recipients}: {e}", exc_info=True)
        return False

def send_password_reset_request(user, reset_url):
    email_context = {
        'recipient_name': user.full_name,
        'reset_url': reset_url,
        'expiry_time': '15 minutes',
    }

    return send_email(
        subject='Smarty Password Reset Request',
        template_type='password',
        recipients=[user.email],
        context=email_context,
    )

def send_new_user_notification(user):
    from pprint import pprint
    pprint(user.full_name)
    email_context = {
        'recipient_name': user.full_name,
        'username': user.username,
        'login_url': stns.ONLINE_DOMAIN,
        'temporary_password': 'default_password',
    }

    return send_email(
        subject="Welcome to Smarty BMS - Your New Account Details",
        template_type='new_user',
        recipients=[user.email],
        context=email_context,
    )

def send_alert(alert_type, desc, module, action_url='', action=''):
    # Added 'action' as a parameter to be consistent, though it was implied
    if action == "":
        action = "Immediate attention required!"
    if action_url == '':
        action_url = stns.ONLINE_DOMAIN
        
    email_context = {
        'alert_type': alert_type,
        'description': desc,
        'system': module,
        'action_url': action_url,
        'required_action': action,
        'date': date.today().strftime('%Y-%m-%d'),
    }
    return send_email(
        subject=f"{module} {alert_type}",
        template_type='alert',
        recipients=users_email,
        context=email_context,
    )


def send_database_error_report(module, error_type, desc):
    email_context = {
        'timestamp': date.today().strftime('%Y-%m-%d %H:%M:%S'),
        'module': module,
        'error_type': error_type,
        'traceback_snippet': desc,
        'logs_url': f'{stns.ONLINE_DOMAIN}/historical/logs/',
    }

    return send_email(
        subject="CRITICAL: BMS Database Error Logged",
        template_type='system_error',
        recipients=users_email,
        context=email_context,
    )

def send_report(title, name, module, period, url):

    email_context = {
        'report_name': name,
        'report_date': date(2025, 10, 31).strftime('%Y-%m-%d'),
        
        'dashboard_url': stns.ONLINE_DOMAIN,
    }

    return send_email(
        subject=title,
        template_type='report',
        recipients=users_email,
        context=email_context,
    )