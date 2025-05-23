from typing import Optional
from datetime import datetime
from pydantic import BaseModel


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