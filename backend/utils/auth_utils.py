import secrets
from fastapi import HTTPException, Depends, Request, status
import jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from config import settings, oauth2_scheme

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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