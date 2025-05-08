from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Registered, User, Comment, create_comment, get_db
from family_management import get_current_user

router = APIRouter(prefix="/comments")

class CommentCreateRequest(BaseModel):
    memory_id: int
    comment_text: str
    user_id: int

class CommentResponse(BaseModel):
    id: int
    memory_id: int
    comment_text: str
    user_id: int

@router.get("/{memory_id}", response_model=list[CommentResponse])
async def get_comments_endpoint(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all comments for a specific memory
    """
    try:
        # Verify that the memory exists and belongs to the user's family
        memory = db.query(Registered).filter_by(id=memory_id).first()
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found"
            )
        if memory.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view comments for this memory"
            )
        
        # Fetch comments for the memory
        comments = db.query(Comment).filter_by(memory_id=memory_id).all()
        # Comments could be empty, so we return an empty list if no comments are found
        if not comments:
            return []
        
        # Map the comments to the response model
        comment_response = [CommentResponse(
            id=comment.id,
            memory_id=comment.memory_id,
            comment_text=comment.comment_text,
            user_id=comment.user_id
        ) for comment in comments]
        
        return comment_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
            detail=f"Failed to fetch comments: {str(e)}"
        )

@router.post("/", response_model=CommentResponse)
async def create_comments_endpoint(
    comment_data: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment for a memory
    """
    try:
        # Verify that the memory exists and belongs to the user's family
        memory = db.query(Registered).filter_by(id=comment_data.memory_id).first()
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found"
            )
        if memory.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to comment on this memory"
            )
        
        # Create the comment
        db_comment = create_comment(
            db=db,
            memory_id=comment_data.memory_id,
            comment_text=comment_data.comment_text,
            user_id=current_user.id
        )
        
        # Return the created comment
        return db_comment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
            detail=f"Failed to create comment: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create memory: {str(e)}"
        )