from datetime import datetime
from sqlalchemy import DateTime, create_engine, Column, String, Integer, Boolean
from sqlalchemy import PrimaryKeyConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
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
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    families = relationship("Registered", back_populates="user")

class ChatRoom(Base):
    __tablename__ = "chatroom"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_date = Column(DateTime, nullable=False)

class UserChatRoom(Base):
    __tablename__ = "userchatroom"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chatroom_id = Column(Integer, ForeignKey("chatroom.id"))

class Message(Base):
    __tablename__ = "message"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chatroom_id = Column(Integer, ForeignKey("chatroom.id"))
    message_text = Column(String)
    time_stamp = Column(DateTime, nullable=False)

class Family(Base):
    __tablename__ = "family"

    id = Column(Integer, primary_key=True, index=True)
    admin = Column(Integer, ForeignKey("users.id"))
    members = relationship("Registered", back_populates="family")

class Registered(Base):
    __tablename__ = "registered"

    email = Column(String, ForeignKey("users.email"))
    family_id = Column(Integer, ForeignKey("family.id"))

    __table_args__ = (
        PrimaryKeyConstraint('email', 'family_id'),
    )
    family = relationship("Family", back_populates="members")
    user = relationship("User", back_populates="families")
    
class FamilyInvite(Base):
    __tablename__ = "family_invite"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("family.id"))
    code = Column(String, unique=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    max_uses = Column(Integer, default=1)  # How many times it can be used
    uses = Column(Integer, default=0)

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

def create_chatroom(db, name: str, date):
    db_chatroom = ChatRoom(
        name=name, 
        created_date=date
    )
    db.add(db_chatroom)
    db.commit()
    db.refresh(db_chatroom)
    return db_chatroom

def create_userchatroom(db, user_id: int, chatroom_id: int):
    db_userchatroom = UserChatRoom(
        user_id=user_id, 
        chatroom_id=chatroom_id
    )
    db.add(db_userchatroom)
    db.commit()
    db.refresh(db_userchatroom)
    return db_userchatroom

def create_message(db, user_id: int, chatroom_id: int,  message_text:str, time_stamp):
    db_message = Message(
        user_id=user_id, 
        chatroom_id=chatroom_id,
        message_text=message_text,
        time_stamp=time_stamp
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def create_family(db, admin_user_id: int):
    db_family = Family(
        admin=admin_user_id
    )
    db.add(db_family)
    db.commit()
    db.refresh(db_family)
    return db_family

def register_user_to_family(db, email: str, family_id: int):
    db_registration = Registered(
        email=email,
        family_id=family_id
    )
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    return db_registration