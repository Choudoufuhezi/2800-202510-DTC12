from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Memory, User, Comment, Registered, create_comment, get_db
from family_management import get_current_user

router = APIRouter(prefix="/comments")

class CommentCreateRequest(BaseModel):
    memory_id: int
    comment_text: str

class CommentResponse(BaseModel):
    id: int
    memory_id: int
    comment_text: str
    user_id: int

class CommentDeleteResponse(BaseModel):
    message: str

@router.get("/memory/{memory_id}", response_model=list[CommentResponse])
async def get_comments_endpoint(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all comments for a specific memory
    """
    try:
        # Verify that the memory exists
        memory = db.query(Memory).filter_by(id=memory_id).first()
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found"
            )
        
        # Check if user is a member of the family associated with the memory
        membership = db.query(Registered).filter_by(
            user_id=current_user.id,
            family_id=memory.family_id
            ).first()

        if not membership:
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
        memory = db.query(Memory).filter_by(id=comment_data.memory_id).first()
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found"
            )
        
        membership = db.query(Registered).filter_by(
            user_id=current_user.id,
            family_id=memory.family_id
            ).first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view comments for this memory"
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
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )
    
@router.delete("/{comment_id}", response_model=CommentDeleteResponse)
async def delete_comment_endpoint(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment by ID
    """
    try:
        # Verify that the comment exists
        comment = db.query(Comment).filter_by(id=comment_id).first()
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        # Verify if the user is the owner of the comment
        if comment.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this comment"
            )
        
        # Delete the comment
        db.delete(comment)
        db.commit()
        
        return {
            "message": "Comment deleted successfully",
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete comment: {str(e)}"
        )