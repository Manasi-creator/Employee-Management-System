from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.core.deps import get_optional_user, get_user_allow_first_login
from app.models import User
from app.schemas.auth import LoginRequest, LoginResponse, UserOut, ChangePasswordRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        token, user = auth_service.login(db, body.email, body.password)
    except PermissionError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return LoginResponse(user=user)

@router.get("/me", response_model=UserOut | None)
def me(user: User | None = Depends(get_optional_user)):
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
def logout(response: Response):
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )
    return {"message": "Logged out successfully"}