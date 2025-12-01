"""
Authentication routes for TeachTrack
Handles user registration, login, Google OAuth, and email verification
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from typing import Optional

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token, GoogleAuth
from auth import get_password_hash, verify_password, create_access_token
from config import settings
from google_auth import verify_google_token
from email_utils import send_verification_email, send_welcome_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


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
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    Returns JWT access token
    """
    try:
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
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
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


@router.post("/google", response_model=Token)
async def google_auth(google_data: GoogleAuth, db: Session = Depends(get_db)):
    """
    Authenticate with Google OAuth
    Creates user if doesn't exist, returns JWT token
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
            db.refresh(user)
            
            # Send welcome email
            try:
                await send_welcome_email(user.email, user.full_name)
            except Exception as e:
                logger.error(f"Failed to send welcome email: {str(e)}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        print(f"DEBUG: Returning user {user.email} with role {user.role}")

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
