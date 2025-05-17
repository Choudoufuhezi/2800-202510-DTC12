from fastapi import APIRouter, Depends, HTTPException, status, FastAPI, Body
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Registered, User, create_memory, delete_memory, get_db
from family_management import get_current_user
from cloudinary.uploader import destroy
from cloudinary.exceptions import Error as CloudinaryError

router = APIRouter(prefix="/profile")

class UserProfileResponse(BaseModel):
    username: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    profile_background_picture: Optional[str] = None
    cloudinary_profile_pictur_id: Optional[str] = None
    cloudinary_profile_background_picture_id: Optional[str] = None


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    profile_background_picture: Optional[str] = None
    cloudinary_profile_picture_id: Optional[str] = None
    cloudinary_profile_background_picture_id: Optional[str] = None

class DeleteImageRequest(BaseModel):
    type: str  

@router.get("/current", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture,
        cloudinary_profile_picture_id=current_user.cloudinary_profile_picture_id,
        cloudinary_profile_background_picture_id=current_user.cloudinary_profile_background_picture_id
    )

@router.delete("/delete")
def delete_my_profile(delete_request: DeleteImageRequest=Body(...), current_user: User = Depends(get_current_user)):
    image_type = delete_request.type
    if image_type == "profile_picture":
        if current_user.profile_picture is not None:
            delete_token = current_user.cloudinary_profile_picture_id
        else:
            return {"message": "Image deleted successfully"}
    else:
        if current_user.profile_background_picture is not None:
            delete_token = current_user.cloudinary_profile_background_picture_id 
        else:
            return {"message": "Image deleted successfully"}
            
    try:
        result = destroy(delete_token)
    except CloudinaryError as e:
        print("Cloudinary deletion failed:", e)
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e) }")

    if result.get("result") == "ok":
        return {"message": "Image deleted successfully"}
    elif result.get("result") == "not found":
        raise HTTPException(status_code=404, detail="Profile Image not found")
    else:
        raise HTTPException(status_code=500, detail="Failed to delete profile image")


@router.put("/update", response_model=UserProfileResponse)
def update_my_profile(updates: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if updates.username is not None:
        current_user.username = updates.username
    if updates.date_of_birth:
        current_user.date_of_birth = updates.date_of_birth
    if updates.address is not None:
        current_user.address = updates.address

    if updates.profile_picture:
        current_user.profile_picture = updates.profile_picture
    if updates.cloudinary_profile_picture_id:
        current_user.cloudinary_profile_picture_id = updates.cloudinary_profile_picture_id  

    if updates.profile_background_picture:
        current_user.profile_background_picture = updates.profile_background_picture
    if updates.cloudinary_profile_background_picture_id:
        current_user.cloudinary_profile_background_picture_id = updates.cloudinary_profile_background_picture_id  

    print(updates)

    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture, 
        cloudinary_profile_picture_id=current_user.cloudinary_profile_picture_id,
        cloudinary_profile_background_picture_id=current_user.cloudinary_profile_background_picture_id
    )
    


