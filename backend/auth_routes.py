"""
Authentication routes for TeachTrack
Handles user registration, login, Google OAuth, and email verification
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from typing import Optional

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token, GoogleAuth, CaptchaResponse
from auth import get_password_hash, verify_password, create_access_token, verify_token, verify_captcha_token
from config import settings
from google_auth import verify_google_token
from email_utils import send_verification_email, send_welcome_email
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
import random

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

security = HTTPBearer(auto_error=False)

@router.get("/captcha", response_model=CaptchaResponse)
def get_captcha():
    """Generate a simple math captcha"""
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    question = f"What is {num1} + {num2}?"
    answer = str(num1 + num2)
    
    # Sign the answer with a short expiry
    captcha_token = create_access_token(data={"answer": answer, "type": "captcha"}, expires_delta=timedelta(minutes=5))
    
    return {"id": captcha_token, "question": question}


def get_current_user_from_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """Extract and verify the current user from JWT token (Header or Cookie)"""
    token = None
    if credentials:
        token = credentials.credentials
    
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)



@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with email and password
    Sends verification email
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        verification_token = generate_verification_token()
        
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            school=user_data.school,
            grade_level=user_data.grade_level,
            tsc_number=user_data.tsc_number,
            email_verified=True,  # Auto-verify for development
            verification_token=verification_token,
            auth_provider="local",
            subscription_type="FREE", # Explicitly set to FREE for new users to enable Trial
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Send verification email
        try:
            await send_verification_email(
                to_email=new_user.email,
                username=new_user.full_name,
                verification_token=verification_token
            )
            logger.info(f"Verification email sent to {new_user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            # Don't fail registration if email fails
        
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )



@router.post("/login", response_model=Token)
def login(response: Response, user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    Returns JWT access token and sets HttpOnly cookie
    """
    try:
        # Verify Captcha
        if not user_credentials.captcha_id or not user_credentials.captcha_answer:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captcha is required"
            )
            
        if not verify_captcha_token(user_credentials.captcha_id, user_credentials.captcha_answer.strip()):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect captcha answer"
            )

        # Find user
        user = db.query(User).filter(User.email == user_credentials.email).first()
        
        if not user or user.auth_provider != "local":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if email is verified
        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in"
            )
            
        # Check if user is banned
        if hasattr(user, 'is_active') and user.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact support."
            )

        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        # Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7, # 7 days
            expires=60 * 60 * 24 * 7,
            path="/",
            samesite="lax",
            secure=False # Set to True in production with HTTPS
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user_from_token)):
    """
    Get current user information
    Requires valid JWT token
    """
    return current_user


@router.post("/google", response_model=Token)
async def google_auth(response: Response, google_data: GoogleAuth, db: Session = Depends(get_db)):
    """
    Authenticate with Google OAuth
    Creates user if doesn't exist, returns JWT token and sets HttpOnly cookie
    """
    try:
        # Verify Google token
        try:
            user_info = await verify_google_token(google_data.token)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == user_info['email']).first()
        
        if user:
            # Update Google info if user exists
            if user.auth_provider != "google":
                # User registered with email/password, link Google account
                user.google_id = user_info['google_id']
                db.commit()
            db.refresh(user)
        else:
            # Create new user from Google info
            new_user = User(
                email=user_info['email'],
                full_name=user_info.get('name', ''),
                google_id=user_info.get('google_id'),
                auth_provider="google",
                email_verified=True,  # Google emails are verified
                subscription_type="FREE",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            
            # Send welcome email for new users
            try:
                await send_welcome_email(user.email, user.full_name)
            except Exception as e:
                logger.error(f"Failed to send welcome email: {str(e)}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        print(f"DEBUG: Returning user {user.email} with role {user.role}")

        # Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7, # 7 days
            expires=60 * 60 * 24 * 7,
            path="/",
            samesite="lax",
            secure=False # Set to True in production with HTTPS
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed"
        )


@router.post("/logout")
def logout(response: Response):
    """
    Logout user by clearing the access token cookie
    """
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user email with token from verification email
    """
    try:
        # Find user with this token
        user = db.query(User).filter(User.verification_token == token).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Check if already verified
        if user.email_verified:
            return {
                "message": "Email already verified",
                "success": True
            }
        
        # Mark as verified
        user.email_verified = True
        user.verification_token = None  # Clear token
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Send welcome email
        try:
            await send_welcome_email(user.email, user.full_name)
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
        
        return {
            "message": "Email verified successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )


@router.post("/resend-verification")
async def resend_verification(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Resend verification email
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Don't reveal if email exists or not
            return {"message": "If the email exists, a verification email has been sent"}
        
        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )
        
        # Generate new token
        new_token = generate_verification_token()
        user.verification_token = new_token
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Send verification email
        try:
            await send_verification_email(
                to_email=user.email,
                username=user.full_name,
                verification_token=new_token
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email"
            )
        
        return {"message": "Verification email sent"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend verification email"
        )
