from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from models.profile_models import UserProfileResponse, UserProfileUpdate, DeleteImageRequest
from database import User, get_db
from utils.user_utils import get_current_user
from cloudinary.uploader import destroy
from cloudinary.exceptions import Error as CloudinaryError

router = APIRouter(prefix="/profile")

@router.get("/current", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current user's profile
    
    Usage:
    curl -X GET http://localhost:8000/profile/current -H "Authorization: Bearer <token>" -H "Content-Type: application/json"
    
    Preconditions:
    User must be logged in
    User must have a profile
    """
    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture,
        cloudinary_profile_picture_id=current_user.cloudinary_profile_picture_id,
        cloudinary_profile_background_picture_id=current_user.cloudinary_profile_background_picture_id
    )

@router.delete("/delete")
def delete_my_profile(delete_request: DeleteImageRequest=Body(...), current_user: User = Depends(get_current_user)):
    """
    Delete a profile image

    Usage:
    curl -X DELETE http://localhost:8000/profile/delete -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"type": "profile_picture"}'
    curl -X DELETE http://localhost:8000/profile/delete -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"type": "profile_background_picture"}'
    
    Raises:
    HTTPException: 404 if the image is not found
    HTTPException: 500 if the image deletion fails

    Preconditions:
    User must be logged in
    User must have a profile
    """
    image_type = delete_request.type
    if image_type == "profile_picture":
        if current_user.profile_picture is not None:
            delete_token = current_user.cloudinary_profile_picture_id
        else:
            return {"message": "Image deleted successfully"}
    else:
        if current_user.profile_background_picture is not None:
            delete_token = current_user.cloudinary_profile_background_picture_id 
        else:
            return {"message": "Image deleted successfully"}
            
    try:
        result = destroy(delete_token)
    except CloudinaryError as e:
        print("Cloudinary deletion failed:", e)
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e) }")

    if result.get("result") == "ok":
        return {"message": "Image deleted successfully"}
    elif result.get("result") == "not found":
        raise HTTPException(status_code=404, detail="Profile Image not found")
    else:
        raise HTTPException(status_code=500, detail="Failed to delete profile image")


@router.put("/update", response_model=UserProfileResponse)
def update_my_profile(updates: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Update the current user's profile
    
    Usage:
    curl -X PUT http://localhost:8000/profile/update -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"username": "new_username", "date_of_birth": "2000-01-01", "address": "123 Main St", "profile_picture": "https://example.com/profile.jpg", "cloudinary_profile_picture_id": "1234567890"}'
    
    Raises:
        HTTPException: 400 if the request is invalid
        HTTPException: 500 if the profile update fails
    
    Preconditions:
    User must be logged in
    User must have a profile
    """
    if updates.username is not None:
        current_user.username = updates.username
    if updates.date_of_birth:
        current_user.date_of_birth = updates.date_of_birth
    if updates.address is not None:
        current_user.address = updates.address

    if updates.profile_picture:
        current_user.profile_picture = updates.profile_picture
    if updates.cloudinary_profile_picture_id:
        current_user.cloudinary_profile_picture_id = updates.cloudinary_profile_picture_id  

    if updates.profile_background_picture:
        current_user.profile_background_picture = updates.profile_background_picture
    if updates.cloudinary_profile_background_picture_id:
        current_user.cloudinary_profile_background_picture_id = updates.cloudinary_profile_background_picture_id  

    print(updates)

    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        username=current_user.username,
        date_of_birth=current_user.date_of_birth,
        address=current_user.address,
        profile_picture=current_user.profile_picture,
        profile_background_picture=current_user.profile_background_picture, 
        cloudinary_profile_picture_id=current_user.cloudinary_profile_picture_id,
        cloudinary_profile_background_picture_id=current_user.cloudinary_profile_background_picture_id
    )
    


