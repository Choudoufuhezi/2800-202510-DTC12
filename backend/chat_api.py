from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import Message, Registered, UserChatRoom, create_chatroom, create_userchatroom, get_db, User, ChatRoom
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
    
    # Get all messages
    messages = db.query(Message, User).join(
        User,
        Message.user_id == User.id
    ).filter(
        Message.chatroom_id == chatroom_id
    ).order_by(Message.time_stamp.asc()).all()
    
    # Get user's last read message
    user_chatroom = db.query(UserChatRoom).filter(
        UserChatRoom.user_id == current_user.id,
        UserChatRoom.chatroom_id == chatroom_id
    ).first()
    last_read_id = user_chatroom.last_read_message_id if user_chatroom else None
    
    return [{
        "id": msg.Message.id,
        "sender_id": msg.Message.user_id,
        "sender_name": msg.User.username or msg.User.email,
        "content": msg.Message.message_text,
        "timestamp": msg.Message.time_stamp.isoformat(),
        "chatroom_id": msg.Message.chatroom_id,
        "is_unread": last_read_id is None or msg.Message.id > last_read_id
    } for msg in messages]

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
    
    result = []
    for chatroom in chatrooms:
        # Get the last message
        last_message = db.query(Message).filter(
            Message.chatroom_id == chatroom.ChatRoom.id
        ).order_by(Message.time_stamp.desc()).first()
        
        # Get unread count
        unread_count = 0
        if last_message and chatroom.UserChatRoom.last_read_message_id:
            unread_count = db.query(Message).filter(
                Message.chatroom_id == chatroom.ChatRoom.id,
                Message.id > chatroom.UserChatRoom.last_read_message_id
            ).count()
        
        result.append({
            "chatroom_id": chatroom.ChatRoom.id,
            "name": chatroom.ChatRoom.name,
            "created_date": chatroom.ChatRoom.created_date.isoformat() if chatroom.ChatRoom.created_date else None,
            "last_message": last_message.message_text if last_message else None,
            "unread_count": unread_count
        })
    
    return result
    
@router.get("/chatrooms/{chatroom_id}/info")
async def get_chatroom_info(
    chatroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get information about a specific chatroom
    """
    # Verify membership
    verify_chatroom_membership(db, current_user.id, chatroom_id)
    
    # Get chatroom info
    chatroom = db.query(ChatRoom).filter(
        ChatRoom.id == chatroom_id
    ).first()
    # return member count and last message
    member_count = db.query(UserChatRoom).filter(
        UserChatRoom.chatroom_id == chatroom_id
    ).count()
    last_message = db.query(Message).filter(
        Message.chatroom_id == chatroom_id
    ).order_by(Message.time_stamp.desc()).first()
    
    if not chatroom:
        raise HTTPException(
            status_code=404,
            detail="Chatroom not found"
        )
    
    return {
        "chatroom_id": chatroom.id,
        "name": chatroom.name,
        "created_date": chatroom.created_date.isoformat() if chatroom.created_date else None,
        "member_count": member_count,
        "last_message": last_message.message_text if last_message else None
    }
    
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
    
    return {
        "chatroom_id": chatroom.id,
        "name": chatroom.name,
        "created_date": chatroom.created_date.isoformat(),
        "members": [
            {"user_id": current_user.id},
            {"user_id": target_user.id}
        ]
    }

@router.post("/chatrooms/create-family-chat")
async def create_family_chat(
    family_id: int = Body(..., embed=True), # Hacky way to avoid using a basemodel
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new group chat for all members of a family
    """
    # Verify user is part of the family
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=403,
            detail="You must be a member of this family to create a group chat"
        )
    
    # Get all family members
    members = db.query(User).join(
        Registered, Registered.user_id == User.id
    ).filter(
        Registered.family_id == family_id
    ).all()
    
    # Create a new chatroom
    chatroom = create_chatroom(
        db,
        name=f"Family Chat",
        date=datetime.now()
    )
    
    # Add all family members to the chatroom
    for member in members:
        create_userchatroom(db, member.id, chatroom.id)
    
    return {
        "chatroom_id": chatroom.id,
        "name": chatroom.name,
        "created_date": chatroom.created_date.isoformat(),
        "members": [{"user_id": member.id} for member in members]
    }

@router.get("/user/id")
async def get_user_id(current_user: User = Depends(get_current_user)):
    """
    Get the current user's ID
    """
    return {"user_id": current_user.id}

@router.get("/chatrooms/family/{family_id}")
async def get_family_chat(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the group chat for a family if it exists
    """
    # Verify user is part of the family
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=403,
            detail="You must be a member of this family to view its chat"
        )
    
    # Find the family chat by name pattern
    family_chat = db.query(ChatRoom).filter(
        ChatRoom.name == "Family Chat"
    ).join(
        UserChatRoom,
        UserChatRoom.chatroom_id == ChatRoom.id
    ).join(
        Registered,
        Registered.user_id == UserChatRoom.user_id
    ).filter(
        Registered.family_id == family_id
    ).first()
    
    if not family_chat:
        return None
    
    return {
        "chatroom_id": family_chat.id,
        "name": family_chat.name,
        "created_date": family_chat.created_date.isoformat() if family_chat.created_date else None
    }
    
