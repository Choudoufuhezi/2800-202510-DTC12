from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from database import User
from utils.auth_utils import get_current_user_email

async def get_current_user(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):  
    db_user = db.query(User).filter(User.email == email).first() #first because there's only one occurence (ideally)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return db_user