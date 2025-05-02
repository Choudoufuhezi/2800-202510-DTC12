import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings
import secrets

def generate_verification_token():
    return secrets.token_urlsafe(32)

def send_verification_email(email: str, verification_token: str):
    # Create message
    msg = MIMEMultipart()
    msg['From'] = settings.smtp_username
    msg['To'] = email
    msg['Subject'] = "Verify your email address"

    # Create verification link
    verification_link = f"http://localhost:3000/verify-email.html?token={verification_token}"

    # Create email body
    body = f"""
    <html>
        <body>
            <h2>Welcome to Family Vault!</h2>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="{verification_link}">Verify Email</a></p>
            <p>If you did not create an account, please ignore this email.</p>
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
    You requested a password reset. Click the link below to reset your password:
    {reset_link}
    
    If you didn't request this, please ignore this email.
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