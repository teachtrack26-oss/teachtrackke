"""
Google OAuth utilities for TeachTrack
"""

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from config import settings
import logging

logger = logging.getLogger(__name__)


async def verify_google_token(token: str) -> dict:
    """
    Verify Google OAuth token and extract user information
    
    Args:
        token: Google ID token
    
    Returns:
        dict: User information from Google
    
    Raises:
        ValueError: If token is invalid
    """
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Token is valid, extract user info
        return {
            'email': idinfo.get('email'),
            'email_verified': idinfo.get('email_verified', False),
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture'),
            'google_id': idinfo.get('sub')
        }
        
    except ValueError as e:
        logger.error(f"Invalid Google token: {str(e)}")
        raise ValueError("Invalid Google token")
    except Exception as e:
        logger.error(f"Error verifying Google token: {str(e)}")
        raise ValueError("Failed to verify Google token")


def get_google_oauth_url() -> str:
    """
    Get the Google OAuth URL for initiating the sign-in flow
    
    Returns:
        str: Google OAuth URL
    """
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account"
    }
    
    # Build query string
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    
    return f"{base_url}?{query_string}"
