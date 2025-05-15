from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import Registered, User, create_memory, delete_memory, get_db, Memory
from family_management import get_current_user

router = APIRouter(prefix="/memories")

class MemoryCreateRequest(BaseModel):
    location: dict
    tags: str
    file_url: str
    date_for_notification: Optional[datetime] = None
    family_id: int

class MemoryResponse(BaseModel):
    id: int
    location: dict
    tags: str
    file_url: str
    date_for_notification: datetime
    user_id: int
    family_id: int
    
class MemoryDeleteResponse(BaseModel):
    message: str

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
            Registered.user_id == current_user.id,
            Registered.family_id == memory_data.family_id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of the specified family"
            )

        # Set current time if timestamp not provided
        date_for_notification = memory_data.date_for_notification if memory_data.date_for_notification else datetime.utcnow()

        db_memory = create_memory(
            db=db,
            location=memory_data.location,
            tags=memory_data.tags,
            file=memory_data.file,
            date_for_notification=date_for_notification,
            user_id=current_user.id,
            family_id=memory_data.family_id
        )
        
        return db_memory
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create memory: {str(e)}"
        )
        
@router.delete("/{memory_id}", response_model=MemoryDeleteResponse)
async def delete_single_memory_endpoint(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a memory by ID
    """
    try:
        success = delete_memory(db, memory_id, current_user.id)
        if success:
            return {
                "message": "Memory deleted successfully",
            }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete memory: {str(e)}"
        )
    
@router.get("/{family_id}", response_model=List[MemoryResponse])
async def get_family_memories(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent memories for a family (limited to 5 per user)
    """
    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == family_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of the family to view memories"
        )
    
    # Fetch memories for the family
    memories = db.query(Memory).filter(
        Memory.family_id == family_id
    ).order_by(Memory.date_for_notification.desc()).all()

    return memories