from fastapi import APIRouter, Depends, HTTPException, status, FastAPI
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Registered, User, create_memory, delete_memory, get_db
from family_management import get_current_user

router = APIRouter(prefix="/profile")

class UserProfileResponse(BaseModel):
    username: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture = Optional[str] = None
    profile_background_picture = Optional[str] = None

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture = Optional[str] = None
    profile_background_picture = Optional[str] = None

@router.get("/current", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture
    )

@router.put("/update", response_model=UserProfileResponse)
def update_my_profile(updates: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if updates.username is not None:
        current_user.username = updates.username
    if updates.date_of_birth:
        current_user.date_of_birth = updates.date_of_birth
    if updates.address is not None:
        current_user.address = updates.address

    current_user.profile_picture = updates.profile_picture
    current_user.profile_background_picture = updates.profile_background_picture

    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture
    )
    


