from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import Message, UserChatRoom, create_chatroom, create_userchatroom, get_db, User, ChatRoom
from datetime import datetime
from family_management import get_current_user

router = APIRouter()

def verify_chatroom_membership(db: Session, user_id: int, chatroom_id: int):
    """
    Verify if user is a member of the specified chatroom
    
    TODO: authenticate using token instead of using raw user id
    """
    membership = db.query(UserChatRoom).filter(
        UserChatRoom.user_id == user_id,
        UserChatRoom.chatroom_id == chatroom_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of this chatroom"
        )

def get_chatroom_messages(db: Session, chatroom_id: int) -> List[dict]:
    """
    Retrieve all messages for a chatroom
    """
    messages = db.query(Message).filter(
        Message.chatroom_id == chatroom_id
    ).order_by(Message.time_stamp.asc()).all()
    
    return [{
        "id": msg.id,
        "sender_id": msg.user_id,
        "content": msg.message_text,
        "timestamp": msg.time_stamp.isoformat(),
        "chatroom_id": msg.chatroom_id
    } for msg in messages]

@router.get("/chatrooms/{chatroom_id}/messages")
async def get_messages(
    chatroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all messages for a chatroom
    """
    # Verify membership
    verify_chatroom_membership(db, current_user.id, chatroom_id)
    
    # Get and return messages
    return get_chatroom_messages(db, chatroom_id)

@router.get("/users/chatrooms")
async def get_user_chatrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all chatrooms that a user is a member of
    """
    chatrooms = db.query(UserChatRoom, ChatRoom).join(
        ChatRoom,
        UserChatRoom.chatroom_id == ChatRoom.id
    ).filter(
        UserChatRoom.user_id == current_user.id
    ).all()
    
    return [{
        "chatroom_id": chatroom.ChatRoom.id,
        "name": chatroom.ChatRoom.name,
        "created_date": chatroom.ChatRoom.created_date.isoformat() if chatroom.ChatRoom.created_date else None
    } for chatroom in chatrooms]

@router.get("/chatrooms/{chatroom_id}/members")
async def get_chatroom_members(
    chatroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all members of a specific chatroom
    """
    # Verify membership
    verify_chatroom_membership(db, current_user.id, chatroom_id)
    
    # Get all members
    members = db.query(User).join(
        UserChatRoom,
        User.id == UserChatRoom.user_id
    ).filter(
        UserChatRoom.chatroom_id == chatroom_id
    ).all()
    
    return [{
        "user_id": member.id,
        "username": member.username,
        "email": member.email
    } for member in members]

@router.post("/chatrooms/create")
async def create_group_chat(
    target_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new group chat with another user by their email
    """
    # Find the target user by email
    target_user = db.query(User).filter(User.email == target_email).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email not found"
        )
    
    # Create a new chatroom
    chatroom = create_chatroom(
        db,
        name=f"Chat with {target_user.username}",
        date=datetime.now()
    )
    
    # Add both users to the chatroom
    create_userchatroom(db, current_user.id, chatroom.id)
    create_userchatroom(db, target_user.id, chatroom.id)
    
    return { #TODO: use a response model instead, this is rushed
        "chatroom_id": chatroom.id,
        "name": chatroom.name,
        "created_date": chatroom.created_date.isoformat(),
        "members": [
            {"user_id": current_user.id},
            {"user_id": target_user.id}
        ]
    }

@router.get("/user/id")
async def get_user_id(current_user: User = Depends(get_current_user)):
    """
    Get the current user's ID
    """
    return {"user_id": current_user.id}
    
