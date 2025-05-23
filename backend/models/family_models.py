from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Base Models
class MemberInfo(BaseModel):
    user_id: int
    email: str
    is_admin: bool
    custom_name: Optional[str] = None
    relationship: Optional[str] = None

# Request Models
class FamilyCreateRequest(BaseModel):
    family_name: str
    family_banner: Optional[str] = None

class FamilyUpdateRequest(BaseModel):
    family_name: Optional[str] = None
    family_banner: Optional[str] = None

class CreateInviteRequest(BaseModel):
    family_id: int
    expires_in_hours: Optional[int] = 24
    max_uses: Optional[int] = 1

class JoinFamilyRequest(BaseModel):
    code: str

class SendMessageRequest(BaseModel):
    text: str
    reply_to: Optional[int] = None

class MemberUpdateRequest(BaseModel):
    custom_name: Optional[str] = None
    relationship: Optional[str] = None

# Response Models
class FamilyInfoResponse(BaseModel):
    id: int
    admin: int
    members: List[MemberInfo]
    family_name: str
    family_banner: Optional[str] = None

class InviteResponse(BaseModel):
    code: str
    expires_at: datetime
    max_uses: int
    family_id: int
    invite_link: str
    uses: int

class FamilyMembersResponse(BaseModel):
    family_name: str
    family_banner: Optional[str] = None
    members: List[MemberInfo]
    is_admin: bool

class MessageResponse(BaseModel):
    id: int
    from_: str
    text: str
    reply_to: Optional[int] = None

class MemberUpdateResponse(BaseModel):
    message: str
    custom_name: Optional[str] = None
    relationship: Optional[str] = None

class DeleteResponse(BaseModel):
    message: str 