import random
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.orm import Session
from auth import get_current_user_email
from database import FamilyInvite, delete_family, get_db, Family, User, Registered
from config import settings
from typing import List
from database import create_message, Message  # Importing the create_message function from database module

router = APIRouter()

async def get_current_user(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):  
    db_user = db.query(User).filter(User.email == email).first() #first because there's only one occurence (ideally)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return db_user

class MemberInfo(BaseModel):
    user_id: int # user_id of the member
    email: str
    is_admin: bool
    custom_name: Optional[str] = None
    relationship: Optional[str] = None

class FamilyCreate(BaseModel):
    family_name: str
    family_banner: Optional[str] = None  # Optional field for family banner

class FamilyInfo(BaseModel):
    id: int
    admin: int  # user_id of the admin
    members: List[MemberInfo]
    family_name: str  # Add family_name

class FamilyUpdate(BaseModel):  # Added for updating family name
    family_name: Optional[str] = None
    family_banner: Optional[str] = None
    
class CreateInviteRequest(BaseModel):
    family_id: int
    expires_in_hours: Optional[int] = 24  # Default 24 hour expiration
    max_uses: Optional[int] = 1  # Default single use

class InviteResponse(BaseModel):
    code: str
    expires_at: datetime
    max_uses: int
    family_id: int
    invite_link: str
    uses: int
    
class JoinFamilyRequest(BaseModel):
    code: str
    
@router.post("/create", response_model=FamilyInfo)
async def create_family(
    family_data: FamilyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new family with the current user as an admin
    
    Usage: send a POST request to the /family/create endpoint with header including 'Authorization': `Bearer ${JWT}`
    """
    try:
        # Create the family
        db_family = Family(
            family_name=family_data.family_name,
            family_banner=family_data.family_banner,
        )
        db.add(db_family)
        db.commit()
        db.refresh(db_family)
        
        # Register the creator as admin of the family
        db_registration = Registered(
            user_id=current_user.id,
            family_id=db_family.id,
            is_admin=True
        )
        db.add(db_registration)
        db.commit()
        
        # Create members list using MemberInfo schema
        members = [
            MemberInfo(
                user_id=current_user.id,
                email=current_user.email,
                is_admin=True
            )
        ]

        return FamilyInfo(
            id=db_family.id,
            admin=current_user.id,
            members=members,
            family_name=db_family.family_name
        ).dict() 

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create family: {str(e)}"
        )

@router.post("/create-invite", response_model=InviteResponse)
async def create_invite(
    request: CreateInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new invite code for a family
    
    Usage: send a POST request to the /family/create-invite endpoint with header including 'Authorization': `Bearer ${JWT} and data family_id, expires_in_hours, and max_uses`
    """
    # Verify user is admin of the family
    is_admin = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == request.family_id,
        Registered.is_admin == True
    ).first()

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only family admin can create invites",
        )

    code = ''.join(random.choices(settings.invite_code_chars, k=settings.invite_code_length))
    expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours)

    db_invite = FamilyInvite(
        family_id=request.family_id,
        code=code,
        created_by=current_user.id,
        expires_at=expires_at,
        max_uses=request.max_uses
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)

    return {
        "code": code,
        "expires_at": expires_at,
        "max_uses": request.max_uses,
        "family_id": request.family_id,
        "invite_link": f"{settings.frontend_url}/invite.html?code={code}",
        "uses": 0
    }
    
@router.post("/join", response_model=FamilyInfo)
async def join_family(
    request: JoinFamilyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Join a family using a valid invite code.
    
    Usage: send a POST request to the /family/create-invite endpoint with header including 'Authorization': `Bearer ${JWT} and data invite code`
    """
    # Check if the invite code is valid
    db_invite = db.query(FamilyInvite).filter(
        FamilyInvite.code == request.code,
        FamilyInvite.expires_at > datetime.utcnow(),
        FamilyInvite.uses < FamilyInvite.max_uses
    ).first()

    if not db_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite code",
        )

    # Check if user already in family
    existing_registration = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == db_invite.family_id
    ).first()

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already in this family",
        )

    # Register the user
    db_registration = Registered(
        user_id=current_user.id,
        family_id=db_invite.family_id,
        is_admin=False
    )
    db.add(db_registration)

    # Update invite usage count
    db_invite.uses += 1
    db.commit()

    # Get all members with their admin status
    members = db.query(User.id, User.email, Registered.is_admin).join(
        Registered, Registered.user_id == User.id
    ).filter(
        Registered.family_id == db_invite.family_id
    ).all()

    # Get admin user_id
    admin = db.query(Registered.user_id).filter(
        Registered.family_id == db_invite.family_id,
        Registered.is_admin == True
    ).first()

    family = db.query(Family).filter(Family.id == db_invite.family_id).first()

    return FamilyInfo(
        id=db_invite.family_id,
        admin=admin[0] if admin else None,
        members=[MemberInfo(user_id=user_id, email=email, is_admin=is_admin) for user_id, email, is_admin in members],
        family_name=family.family_name
    )
    
@router.delete("/{family_id}", response_model=dict)
async def delete_family_endpoint(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a family
    
    Usage: send a DELETE request to /family/{family_id} with Authorization header "Authorization': `Bearer ${JWT}`"
    """
    try:
        success = delete_family(db, family_id, current_user.id)
        if success:
            return {"message": "Family deleted successfully"}
        
    except ValueError as e:
        # Family does not exist
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        # User not admin
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        # Any other errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete family: {str(e)}"
        )
        
@router.get("/{family_id}/members", response_model=dict)
async def get_family_members(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all members of a family
    
    Usage: send a GET request to /family/{family_id}/members with Authorization header "Authorization': `Bearer ${JWT}`"
    """
    # Check if user is part of the family
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this family to view its members"
        )
    
    # Get all members with email and admin status
    members = db.query(User.id,
                    User.email,
                    Registered.is_admin,
                    Registered.custom_name,
                    Registered.relationship_).join(
        Registered, Registered.user_id == User.id
    ).filter(
        Registered.family_id == family_id
    ).all()

    family = db.query(Family).filter(Family.id == family_id).first()
    
    return {
        "family_name": family.family_name,
        "family_banner": family.family_banner,
        "members": [
            {
                "user_id": user_id,
                "email": email,
                "is_admin": is_admin,
                "custom_name": custom_name,
                "relationship_": relationship_
            }
            for user_id, email, is_admin, custom_name, relationship_ in members
        ]
    }

@router.get("/my-families", response_model=List[FamilyInfo])
async def get_user_families(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return all family details for the families the current user belongs to.
    """
    registrations = db.query(Registered).filter(
        Registered.user_id == current_user.id
    ).all()

    families = []
    for reg in registrations:
        db_family = db.query(Family).filter(Family.id == reg.family_id).first()
        if not db_family:
            continue

        print(f"Processing Family ID {db_family.id} - Name: {db_family.family_name}")

        members = db.query(User.id, User.email, Registered.is_admin).join(
            Registered, Registered.user_id == User.id
        ).filter(Registered.family_id == reg.family_id).all()

        admin = db.query(Registered.user_id).filter(
            Registered.family_id == reg.family_id,
            Registered.is_admin == True
        ).first()

        families.append(FamilyInfo(
            id=db_family.id,
            admin=admin[0] if admin else None,
            members=[
                MemberInfo(user_id=user_id, email=email, is_admin=is_admin)
                for user_id, email, is_admin in members
            ],
            family_name=db_family.family_name
        ))

    return families

    
@router.get("/invite/{code}", response_model=InviteResponse)
async def get_invite_details(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(FamilyInvite).filter(
        FamilyInvite.code == code,
        FamilyInvite.expires_at > datetime.utcnow(),
        FamilyInvite.uses < FamilyInvite.max_uses
    ).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite code"
        )

    return {
        "code": invite.code,
        "expires_at": invite.expires_at,
        "max_uses": invite.max_uses,
        "family_id": invite.family_id,
        "uses": invite.uses
    }

@router.get("/{family_id}/invites", response_model=List[InviteResponse])
async def get_family_invites(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this family to view its invites"
        )
    
    invites = db.query(FamilyInvite).filter(
        FamilyInvite.family_id == family_id,
        FamilyInvite.expires_at > datetime.utcnow(),
        FamilyInvite.uses < FamilyInvite.max_uses
    ).all()
    
    return [
        {
            "code": invite.code,
            "expires_at": invite.expires_at,
            "max_uses": invite.max_uses,
            "family_id": invite.family_id,
            "invite_link": f"{settings.frontend_url}/invite.html?code={invite.code}",
            "uses": invite.uses
        }
        for invite in invites
    ]

@router.put("/{family_id}/update", response_model=FamilyInfo)
async def update_family(
    family_id: int,
    update_data: FamilyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a family's name
    """
    is_admin = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id,
        Registered.is_admin == True
    ).first()

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail = "Only family admin can update the family name",
        )

    db_family = db.query(Family).filter(Family.id == family_id).first()
    if not db_family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found",
        )

    try:
        if update_data.family_name is not None:
            db_family.family_name = update_data.family_name
        if update_data.family_banner is not None:
            db_family.family_banner = update_data.family_banner
        db.commit()
        db.refresh(db_family)

        members = db.query(
                    User.id,
                    User.email,
                    Registered.is_admin,
                    Registered.custom_name,
                    Registered.relationship_
                ).join(
                    Registered, Registered.user_id == User.id
                ).filter(
                    Registered.family_id == family_id
                ).all()

        admin = db.query(Registered.user_id).filter(
            Registered.family_id == family_id,
            Registered.is_admin == True
        ).first()
        
        return {
            "id": db_family.id,
            "admin": admin[0] if admin else None,
            "members": [
                MemberInfo(
                    user_id=user_id,
                    email=email,
                    is_admin=is_admin,
                    custom_name=custom_name,
                    relationship_=relationship_
                ).dict()
                for user_id, email, is_admin, custom_name, relationship_ in members
            ],
            "family_name": db_family.family_name,
            "family_banner": db_family.family_banner
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update family: {str(e)}"
        )

class SendMessageRequest(BaseModel):
    text: str
    reply_to: Optional[int] = None

@router.post("/{family_id}/messages")
async def send_message(
    family_id: int,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this family")

    msg = create_message(
        db=db,
        user_id=current_user.id,
        chatroom_id=family_id,
        message_text=payload.text,
        time_stamp=datetime.utcnow()
    )

    return {
        "id": msg.id,
        "from": current_user.email,
        "text": msg.message_text,
        "reply_to": msg.reply_to
    }

@router.get("/{family_id}/messages")
async def get_messages(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this family")

    messages = db.query(Message).filter(
        Message.chatroom_id == family_id
    ).order_by(Message.time_stamp).all()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.user_id).first()
        result.append({
            "id": msg.id,
            "from": sender.email if sender else "Unknown",
            "text": msg.message_text,
            "reply_to": msg.reply_to
        })
    return result

class MemberUpdateRequest(BaseModel):
    custom_name: Optional[str] = None
    relationship: Optional[str] = None

@router.put("/{family_id}/me", response_model=dict)
async def update_member_info(
    family_id: int,
    update: MemberUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this family.")

    if update.custom_name is not None:
        member.custom_name = update.custom_name
    if update.relationship is not None:
        member.relationship = update.relationship

    db.commit()
    db.refresh(member)

    return {
        "message": "Member info updated",
        "custom_name": member.custom_name,
        "relationship": member.relationship
    }
