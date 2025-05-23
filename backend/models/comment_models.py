from pydantic import BaseModel

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