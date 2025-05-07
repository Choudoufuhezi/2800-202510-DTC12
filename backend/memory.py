from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Registered, User, create_memory, get_db
from family_management import get_current_user

router = APIRouter(prefix="/memories")

class MemoryCreateRequest(BaseModel):
    location: str
    tags: str
    file_location: str
    time_stamp: Optional[datetime] = None
    family_id: int

class MemoryResponse(BaseModel):
    id: int
    location: str
    tags: str
    file_location: str
    time_stamp: datetime
    user_id: int
    family_id: int

@router.post("/", response_model=MemoryResponse)
async def create_memory_endpoint(
    memory_data: MemoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new memory
    """
    try:
        # Verify user belongs to the specified family
        is_member = db.query(Registered).filter(
            Registered.email == current_user.email,
            Registered.family_id == memory_data.family_id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of the specified family"
            )

        # Set current time if timestamp not provided
        timestamp = memory_data.time_stamp if memory_data.time_stamp else datetime.utcnow()

        # Use the helper function
        db_memory = create_memory(
            db=db,
            location=memory_data.location,
            tags=memory_data.tags,
            file_location=memory_data.file_location,
            time_stamp=timestamp,
            user_id=current_user.id,
            family_id=memory_data.family_id
        )
        
        return db_memory
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create memory: {str(e)}"
        )