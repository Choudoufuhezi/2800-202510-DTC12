import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.orm import Session
from auth import get_current_user_email
from database import get_db, Family, User, Registered
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