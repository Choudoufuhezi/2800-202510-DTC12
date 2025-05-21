# config.py
from pydantic_settings import BaseSettings
from fastapi.security import OAuth2PasswordBearer

class Settings(BaseSettings):
    # App settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 
    frontend_url: str = "http://localhost:3000"  
    # frontend_url: str = "https://dev--digitalfamilyvault.netlify.app"
    # backend_url: str = "https://two800-202510-dtc12-0d55.onrender.com"
    backend_url: str = "http://localhost:8000"

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    
    # SMTP settings
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    
    # Deepseek settings
    deepseek_api_key: str | None = None

    invite_code_chars: str = "0123456789"
    invite_code_length: int = 6
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8' 
        extra = 'ignore'  # ignore extra env variables

settings = Settings()

# OAuth2PasswordBearer for password-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")