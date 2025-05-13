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


router = APIRouter(prefix="/family")

async def get_current_user(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):  
    db_user = db.query(User).filter(User.email == email).first() #first because there's only one occurence (ideally)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return db_user

class MemberInfo(BaseModel):
    email: str
    is_admin: bool

class FamilyInfo(BaseModel):
    id: int
    admin: int  # user_id of the admin
    members: List[MemberInfo]
    
class CreateInviteRequest(BaseModel):
    family_id: int
    expires_in_hours: Optional[int] = 24  # Default 24 hour expiration
    max_uses: Optional[int] = 1  # Default single use

class InviteResponse(BaseModel):
    code: str
    expires_at: datetime
    max_uses: int
    family_id: int
    
class JoinFamilyRequest(BaseModel):
    code: str
    
@router.post("/create", response_model=FamilyInfo)
async def create_family(
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
            family_banner = None
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
        
        # Get all members
        members = [
            {
                "email": current_user.email,
                "is_admin": True
            }
        ]
        
        return {
            "id": db_family.id,
            "admin": current_user.id,
            "members": members
        }
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

    code = ''.join(random.choices('0123456789', k=6)) # generate random 6 number string
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
        "family_id": request.family_id
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
    members = db.query(User.email, Registered.is_admin).join(
        Registered, Registered.user_id == User.id
    ).filter(
        Registered.family_id == db_invite.family_id
    ).all()

    # Get admin user_id
    admin = db.query(Registered.user_id).filter(
        Registered.family_id == db_invite.family_id,
        Registered.is_admin == True
    ).first()

    return FamilyInfo(
        id=db_invite.family_id,
        admin=admin[0] if admin else None,
        members=[MemberInfo(email=email, is_admin=is_admin) for email, is_admin in members]
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
        
@router.get("/{family_id}/members", response_model=List[MemberInfo])
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
    members = db.query(User.email, Registered.is_admin).join(
        Registered, Registered.user_id == User.id
    ).filter(
        Registered.family_id == family_id
    ).all()
    
    return [MemberInfo(email=email, is_admin=is_admin) for email, is_admin in members]

@router.get("/my-families", response_model=List[int])
async def get_user_families(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all family IDs that the current user belongs to
    """
    # Query all family IDs where user is registered
    family_ids = db.query(Registered.family_id).filter(
        Registered.user_id == current_user.id
    ).all()
    
    # Extract just the IDs from the query results
    return [family_id for (family_id,) in family_ids]