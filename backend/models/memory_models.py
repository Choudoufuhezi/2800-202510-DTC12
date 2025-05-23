from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MemoryCreateRequest(BaseModel):
    location: dict
    tags: Optional[str] = None 
    description: Optional[str] = None
    file_url: str
    cloudinary_id: str
    date_for_notification: Optional[datetime] = None
    family_id: int

class MemoryResponse(BaseModel):
    id: int
    location: dict
    tags: str
    description: str
    file_url: str
    cloudinary_id: str
    date_for_notification: datetime
    user_id: int
    family_id: int
    resource_type: Optional[str] = "image"

class MemoryUpdateRequest(BaseModel):
    tags: Optional[str] = None
    description: Optional[str] = None

class MemoryDeleteResponse(BaseModel):
    message: str