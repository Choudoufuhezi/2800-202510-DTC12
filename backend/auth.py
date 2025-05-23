from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
import jwt
import os
from sqlalchemy.orm import Session
from database import get_db, get_user, create_user
from database import User as DBUser
from config import settings, oauth2_scheme  # Import oauth2_scheme from config
from email_service import generate_verification_token, send_password_reset_email, send_verification_email
import importlib

from models.auth_models import UserCreate
from utils.auth_utils import (
    verify_password,
    get_password_hash,
    generate_password_reset_token,
    get_password_reset_token_expiry,
    create_access_token
)

router = APIRouter()

async def get_current_user_email(request: Request, token: str = Depends(oauth2_scheme)):
    """
    Dependency to get current user's email from the JWT token
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    verification_token = generate_verification_token()
    hashed_password = get_password_hash(user.password)
    create_user(db, user.email, hashed_password, verification_token)
    
    if not send_verification_email(user.email, verification_token):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )
    
    return {"message": "Registration successful. Please check your email for verification."}

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.verification_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    user.email_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/login")
async def login(user_data: dict = Body(...), db: Session = Depends(get_db)):
    db_user = get_user(db, user_data["email"])
    if not db_user or not verify_password(user_data["password"], db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for verification link."
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Google OAuth routes
@router.get("/auth/google")
async def login_via_google(request: Request):
    main = importlib.import_module("main")  # Lazy import to avoid circular import
    redirect_uri = request.url_for('auth_via_google_callback')
    return await main.oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def auth_via_google_callback(request: Request, db: Session = Depends(get_db)):
    main = importlib.import_module("main")  # Lazy import to avoid circular import
    token = await main.oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")
    
    email = user_info.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email not available from Google")
    
    db_user = get_user(db, email)
    if not db_user:
        hashed_password = get_password_hash(os.urandom(16).hex())
        create_user(db, email, hashed_password)
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    return RedirectResponse(url=f"{settings.frontend_url}/login.html?token={access_token}")

@router.delete("/account/delete")
async def delete_account(request: Request, db: Session = Depends(get_db)):
    # Get token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    # Get user from database
    db_user = get_user(db, email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Delete user from database
    try:
        db.delete(db_user)
        db.commit()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )
    
@router.post("/forgot-password")
async def forgot_password(request_data: dict = Body(...), db: Session = Depends(get_db)):
    """
    Initiate password reset process by sending email with reset token
    """
    email = request_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    db_user = get_user(db, email)
    if not db_user:
        return {"message": "If an account with this email exists, a password reset link has been sent"}
    
    # Generate reset token and expiry
    reset_token = generate_password_reset_token()
    reset_token_expiry = get_password_reset_token_expiry()
    
    # Store in database
    db_user.reset_token = reset_token
    db_user.reset_token_expiry = reset_token_expiry
    db.commit()
    
    # Send email
    reset_link = f"{settings.frontend_url}/reset-password.html?token={reset_token}"
    if not send_password_reset_email(email, reset_link):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email"
        )
    
    return {"message": "If an account with this email exists, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(request_data: dict = Body(...), db: Session = Depends(get_db)):
    """
    Verify reset token and update password
    """
    token = request_data.get("token")
    new_password = request_data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new password are required"
        )
    
    # Find user with token
    db_user = db.query(DBUser).filter(
        DBUser.reset_token == token,
        DBUser.reset_token_expiry > datetime.utcnow()
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear reset token
    db_user.hashed_password = get_password_hash(new_password)
    db_user.reset_token = None
    db_user.reset_token_expiry = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}