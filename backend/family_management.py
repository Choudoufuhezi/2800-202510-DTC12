import random
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.orm import Session
from auth import get_current_user_email
from database import FamilyInvite, get_db, Family, User, Registered
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

class FamilyInfo(BaseModel):
    id: int
    admin: int
    members: List[str]
    
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
        db_family = Family(admin=current_user.id)
        db.add(db_family)
        db.commit()
        db.refresh(db_family)
        
        # Add creator to the family
        db_registration = Registered(
            email=current_user.email,
            family_id=db_family.id
        )
        db.add(db_registration)
        db.commit()
        
        # Get all members
        members = [current_user.email]
        
        return {
            "id": db_family.id,
            "admin": db_family.admin,
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
    db_family = db.query(Family).filter(Family.id == request.family_id).first()
    if not db_family or db_family.admin != current_user.id:
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

    # Check if user is already in this family
    existing_registration = db.query(Registered).filter(
        Registered.email == current_user.email,
        Registered.family_id == db_invite.family_id
    ).first()

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already in this family",
        )

    # Register the user
    db_registration = Registered(
        email=current_user.email,
        family_id=db_invite.family_id
    )
    db.add(db_registration)

    # Update invite usage count
    db_invite.uses += 1
    db.commit()

    # Return updated family info
    members = [r.email for r in db.query(Registered).filter(
        Registered.family_id == db_invite.family_id
    ).all()]

    return {
        "id": db_invite.family_id,
        "admin": db.query(Family).get(db_invite.family_id).admin,
        "members": members
    }