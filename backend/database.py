from sqlalchemy import create_engine, Column, String, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Create database directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Create SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/users.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)

# Create all tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user(db, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db, email: str, hashed_password: str, verification_token: str = None):
    db_user = User(
        email=email, 
        hashed_password=hashed_password,
        email_verified=False,
        verification_token=verification_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user 