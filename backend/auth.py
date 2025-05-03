import secrets
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.params import Body
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from typing import Optional
import os
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from database import get_db, get_user, create_user
from database import User as DBUser  # SQLAlchemy model
from config import settings
from email_service import generate_verification_token, send_password_reset_email, send_verification_email

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

app = FastAPI()

# Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    session_cookie="session_cookie"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic Models
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions TODO: move to a diff file?
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(32)

def get_password_reset_token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(hours=1)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return token if isinstance(token, str) else token.decode("utf-8")

# Routes
@app.post("/register")
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

@app.get("/verify-email")
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

@app.post("/login")
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
@app.get("/auth/google")
async def login_via_google(request: Request):
    redirect_uri = request.url_for('auth_via_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def auth_via_google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
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

@app.delete("/account/delete")
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
        
@app.post("/forgot-password")
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

@app.post("/reset-password")
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
        DBUser.reset_token_expiry > datetime.utcnow()  # Check token hasn't expired
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