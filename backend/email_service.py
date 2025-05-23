from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import secrets

def generate_verification_token():
    return secrets.token_urlsafe(32)

def create_email_footer():
    """
    Create a standardized footer for all emails
    """
    current_year = datetime.now().year
    return f"""
    <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>© {current_year} Family Vault. All rights reserved.</p>
        <p>
            <a href="{settings.frontend_url}/privacy" style="color: #777;">Privacy Policy</a> | 
            <a href="{settings.frontend_url}/terms" style="color: #777;">Terms of Service</a> | 
            <a href="{settings.frontend_url}/unsubscribe" style="color: #777;">Unsubscribe</a>
        </p>
        <p>This email was sent automatically. Please do not reply directly to this message.</p>
    </footer>
    """

def create_email_header():
    """
    Create a standardized header for all emails
    """
    return """<header style="margin-bottom: 20px; padding: 15px 0; background-color: #bae6fd; /* sky-200 */">
        <div style="display: flex; align-items: center; max-width: 600px; margin: 0 auto; padding: 0 15px;">
            <div style="font-size: 24px; color: #1e40af; /* blue-800 */">
                <i class="fas fa-lock" style="font-style: normal; font-family: 'Font Awesome';"></i>
                <h1 style="margin: 0; padding-left: 12px; font-size: 20px; font-weight: 600; color: #1e40af;">
                    Family Heirloom Vault
                </h1>
            </div>
        </div>
    </header>
    """


def send_verification_email(email: str, verification_token: str):
    # Create message
    msg = MIMEMultipart()
    msg['From'] = settings.smtp_username
    msg['To'] = email
    msg['Subject'] = "Verify your email address"

    # Create verification link
    verification_link = f"{settings.backend_url}/verify-email?token={verification_token}"

    # Create email body
    body = f"""
    <html>
        <body>
            {create_email_header()}
            <h2>Welcome to Family Vault!</h2>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="{verification_link}">Verify Email</a></p>
            <p>If you did not create an account, please ignore this email.</p>
            {create_email_footer()}
        </body>
    </html>
    """

    msg.attach(MIMEText(body, 'html'))

    # Send email
    try:
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False 
    
def send_password_reset_email(email: str, reset_link: str) -> bool:
    
    msg = MIMEMultipart()
    msg['From'] = settings.smtp_username
    msg['To'] = email
    msg['Subject'] = "Verify your email address"

    
    subject = "Password Reset Request"
    body = f"""
    <html>
        <body>
            {create_email_header()}
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
            {create_email_footer()}
        </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))
    
    try:
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
    
def test_email():
    print("Starting email sending test...")
    
    test_email = "derekcaoca@gmail.com" 

    test_token = generate_verification_token()
    print(f"Generated test verification token: {test_token}")
    
    success = send_verification_email(test_email, test_token)
    
    if success:
        print("Test email sent")
        return True
    else:
        print("Failed to send test email.")
        return False

if __name__ == "__main__":
    test_email()