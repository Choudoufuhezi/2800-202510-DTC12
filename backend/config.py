# config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 
    
    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    
    # SMTP settings
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'  # recommended
        extra = 'ignore'  # ignore extra env variables

settings = Settings()