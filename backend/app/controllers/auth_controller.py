from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_user_allow_first_login
from app.models import User
from app.schemas.auth import LoginRequest, LoginResponse, UserOut, ChangePasswordRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    try:
        token, user = auth_service.login(db, body.email, body.password)
    except PermissionError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))
    return LoginResponse(access_token=token, user=user)

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_user_allow_first_login)):
    return user

@router.post("/change-password")
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db),
                    user: User = Depends(get_user_allow_first_login)):
    try:
        auth_service.change_password(db, user, body.current_password, body.new_password)
    except PermissionError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e))
    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout(user: User = Depends(get_user_allow_first_login)):
    return {"message": "Logged out successfully"}