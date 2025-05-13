from datetime import datetime
from sqlalchemy import DateTime, create_engine, Column, String, Integer, Boolean, JSON, LargeBinary
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
    username = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    profile_background_picture = Column(String, nullable=True)
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
    members = relationship("Registered", back_populates="family")

class Registered(Base):
    __tablename__ = "registered"

    user_id = Column(Integer, ForeignKey("users.id"))
    family_id = Column(Integer, ForeignKey("family.id"))
    is_admin = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'family_id'),
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

class Memory(Base):
    __tablename__ = "memory"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(JSON)
    tags = Column(String)
    file_url = Column(String)
    date_for_notification = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    family_id = Column(Integer, ForeignKey("family.id"))

class Comment(Base):
    __tablename__ = "comment"

    id = Column(Integer, primary_key=True, index=True)
    memory_id = Column(Integer, ForeignKey("memory.id"))
    comment_text = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    memory = relationship("Memory", backref="comments")
    user = relationship("User")

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
        username=None,
        date_of_birth=None,
        address=None,
        profile_picture=None,
        profile_background_picture=None,
        email_verified=False,
        verification_token=verification_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user 

def create_chatroom(db, name: str, date: datetime):
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

def create_message(db, user_id: int, chatroom_id: int,  message_text:str, time_stamp: datetime):
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

def create_family(db):
    db_family = Family()
    db.add(db_family)
    db.commit()
    db.refresh(db_family)
    return db_family

def register_user_to_family(db, user_id: int, family_id: int, is_admin: bool):
    db_registration = Registered(
        user_id=user_id,
        family_id=family_id,
        is_admin=is_admin
    )
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    return db_registration


def create_family_invite(db, family_id: int, code: int, created_by: int, expires_at: datetime, uses: int, max_uses: int):
    db_invite = FamilyInvite(
        family_id=family_id,
        code=code,
        created_by=created_by,
        expires_at=expires_at,
        uses=uses,
        max_uses=max_uses,
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

def create_memory(db, location: str, tags: str, file_url: str, date_for_notification: datetime, user_id: int, family_id: int):
    db_memory = Memory(
        location=location,
        tags=tags,
        file_url=file_url,
        date_for_notification=date_for_notification,
        user_id=user_id,
        family_id=family_id
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

def delete_memory(db, memory_id: int, requesting_user_id: int, family_id: int):
    db_memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not db_memory:
        raise ValueError("Memory not found")
    if family_id and db_memory.family_id != family_id:
        raise ValueError("Invalid credentials")
    
    # only poster and admins can delete
    is_owner = db_memory.user_id == requesting_user_id
    is_admin = db.query(Family).filter(
        Family.id == db_memory.family_id,
        Family.admin == requesting_user_id
    ).first()
    
    if not is_owner and not is_admin:
        raise PermissionError("Only memory owner or family admin can delete")
    
    try:
        db.delete(db_memory)
        db.commit()
        return True
    except Exception as e:
        # If anything goes wrong, rollback
        db.rollback()
        raise e

def create_comment(db, memory_id: int, comment_text: str, user_id: int):
    db_comment = Comment(
        memory_id=memory_id,
        comment_text=comment_text,
        user_id=user_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_family(db, family_id: int, requesting_user_id: int):
    family = db.query(Family).filter(Family.id == family_id).first() # verify user has admin perms
    if not family:
        raise ValueError("Family not found")
    
    is_admin = db.query(Registered).filter(
        Registered.user_id == requesting_user_id,
        Registered.family_id == family_id,
        Registered.is_admin == True
    ).first()
    
    if not is_admin:
        raise PermissionError("Only family admin can delete the family")
    
    try:
        # delete sequentially
        db.query(FamilyInvite).filter(FamilyInvite.family_id == family_id).delete()
        db.query(Registered).filter(Registered.family_id == family_id).delete()
        db.delete(family)
        
        db.commit()
        return True
    except Exception as e:
        # If any issues, rollback all changes
        db.rollback()
        raise e