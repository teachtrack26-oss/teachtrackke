"""
Email utilities for TeachTrack
Handles sending verification emails, password reset emails, etc.
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import logging

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = None
) -> bool:
    """
    Send an email using Gmail SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML body of the email
        text_content: Plain text version (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add text version
        if text_content:
            text_part = MIMEText(text_content, "plain")
            message.attach(text_part)
        
        # Add HTML version
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
        )
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def get_verification_email_html(username: str, verification_url: str) -> str:
    """Generate HTML for email verification email"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - TeachTrack</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 40px 0; text-align: center;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                                    📚 TeachTrack
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                                    Welcome to TeachTrack, {username}!
                                </h2>
                                
                                <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                                    Thank you for signing up! We're excited to have you join our community of dedicated educators.
                                </p>
                                
                                <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                                    To get started with TeachTrack, please verify your email address by clicking the button below:
                                </p>
                                
                                <!-- Verification Button -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="{verification_url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                        ✓ Verify Email Address
                                    </a>
                                </div>
                                
                                <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin: 10px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                                    {verification_url}
                                </p>
                                
                                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                                    <p style="margin: 0; color: #999999; font-size: 13px;">
                                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
                                <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                                    © 2024 TeachTrack. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                    Empowering educators, one lesson at a time 📖
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_verification_email_text(username: str, verification_url: str) -> str:
    """Generate plain text version for email verification email"""
    return f"""
Welcome to TeachTrack, {username}!

Thank you for signing up! To get started, please verify your email address.

Verification Link:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The TeachTrack Team

---
© 2024 TeachTrack. All rights reserved.
    """


async def send_verification_email(
    to_email: str,
    username: str,
    verification_token: str
) -> bool:
    """
    Send email verification email
    
    Args:
        to_email: User's email address
        username: User's full name
        verification_token: Verification token
    
    Returns:
        bool: True if email sent successfully
    """
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    html_content = get_verification_email_html(username, verification_url)
    text_content = get_verification_email_text(username, verification_url)
    
    return await send_email(
        to_email=to_email,
        subject="Verify Your Email - TeachTrack",
        html_content=html_content,
        text_content=text_content
    )


async def send_welcome_email(to_email: str, username: str) -> bool:
    """Send welcome email after successful verification"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to TeachTrack!</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px;">
            <h2 style="color: #667eea;">🎉 Welcome aboard, {username}!</h2>
            <p>Your email has been successfully verified. You now have full access to all TeachTrack features!</p>
            
            <h3>Get Started:</h3>
            <ul>
                <li>📚 Track your curriculum progress</li>
                <li>📝 Create and manage lesson plans</li>
                <li>📊 Generate schemes of work</li>
                <li>📎 Upload and organize teaching resources</li>
            </ul>
            
            <p style="margin-top: 30px;">
                <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Go to Dashboard
                </a>
            </p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Happy teaching!<br>
                The TeachTrack Team
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
Welcome aboard, {username}!

Your email has been successfully verified. You now have full access to all TeachTrack features!

Get Started:
- Track your curriculum progress
- Create and manage lesson plans
- Generate schemes of work
- Upload and organize teaching resources

Visit {settings.FRONTEND_URL}/dashboard to get started.

Happy teaching!
The TeachTrack Team
    """
    
    return await send_email(
        to_email=to_email,
        subject="Welcome to TeachTrack!",
        html_content=html_content,
        text_content=text_content
    )


async def send_invitation_email(email: str, school_name: str, password: str):
    """
    Send an invitation email to a new user
    
    Args:
        email: Recipient email address
        school_name: Name of the school
        password: Temporary password for the user
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Invitation to join {school_name} on TeachTrack"
    html_content = f"""
    <h1>You have been invited!</h1>
    <p>You have been invited to join <b>{school_name}</b> on TeachTrack.</p>
    <p>Your temporary password is: <b>{password}</b></p>
    <p>Please login and change your password.</p>
    """
    text_content = f"You have been invited to join {school_name} on TeachTrack. Your temporary password is: {password}"
    
    return await send_email(email, subject, html_content, text_content)
