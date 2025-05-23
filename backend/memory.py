import os
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from config import settings
from database import Registered, User, Memory, create_memory, delete_memory, get_db
from family_management import get_current_user

# Import the Cloudinary libraries
import cloudinary
from cloudinary.uploader import destroy

# Set configuration parameter
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_cloud_key,
    api_secret=settings.cloudinary_cloud_secret,
    secure=True  
)

router = APIRouter(prefix="/memories")


# ---------------------------
# Models
# ---------------------------
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


# ---------------------------
# Endpoints
# ---------------------------
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
        is_member = db.query(Registered).filter(
            Registered.user_id == current_user.id,
            Registered.family_id == memory_data.family_id
        ).first()

        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of the specified family"
            )

        date_for_notification = memory_data.date_for_notification or datetime.utcnow()

        db_memory = create_memory(
            db=db,
            location=memory_data.location,
            tags=memory_data.tags,
            description=memory_data.description,
            file_url=memory_data.file_url,
            cloudinary_id=memory_data.cloudinary_id,
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
    Delete a memory from Cloudinary and then from the database
    """
    try:
        db_memory = db.query(Memory).filter(Memory.id == memory_id).first()

        if not db_memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found"
            )

        is_owner = db_memory.user_id == current_user.id
        is_admin = db.query(Registered).filter_by(
            user_id=current_user.id,
            family_id=db_memory.family_id,
            is_admin=True
        ).first()

        if not is_owner and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only memory owner or family admin can delete"
            )

        try:
            destroy(
                public_id=db_memory.cloudinary_id,
                resource_type=db_memory.resource_type or "image"
            )
        except Exception as cloudinary_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary deletion failed: {str(cloudinary_error)}"
            )

        delete_memory(db, memory_id, current_user.id, db_memory.family_id)

        return {"message": "Memory deleted successfully"}

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
    Get all memories for a family
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

    memories = db.query(Memory).filter(
        Memory.family_id == family_id
    ).order_by(Memory.date_for_notification.desc()).all()

    return memories


@router.get("/member/{member_user_id}/family/{family_id}", response_model=List[MemoryResponse])
async def get_memories_endpoint(
    member_user_id: int,
    family_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all memories for a specific family member
    """
    try:
        membership = db.query(Registered).filter_by(
            user_id=current_user.id,
            family_id=family_id
        ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not registered in this family"
            )

        memories = db.query(Memory).filter(
            Memory.user_id == member_user_id,
            Memory.family_id == family_id
        ).all()

        return memories

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load memories: {str(e)}"
        )

@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: int,
    memory_update: MemoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    is_member = db.query(Registered).filter(
        Registered.user_id == current_user.id,
        Registered.family_id == memory.family_id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=403, 
            detail="You are not a member of this family"
        )

    # Proceed with updates
    if memory_update.tags is not None:
        memory.tags = memory_update.tags

    if memory_update.description is not None:
        memory.description = memory_update.description

    db.commit()
    db.refresh(memory)
    return memory