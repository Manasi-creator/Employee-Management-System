from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.models import User
from app.db.base import Role

bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    token = creds.credentials if creds else request.cookies.get(settings.AUTH_COOKIE_NAME)
    payload = decode_token(token) if token else None
    subject = payload.get("sub") if payload else None
    user = db.scalar(select(User).where(User.public_id == subject)) if subject else None
    if user is not None and not user.is_active:
        return None
    return user


def get_user_allow_first_login(
    user: User | None = Depends(get_optional_user),
) -> User:
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user(user: User = Depends(get_user_allow_first_login)) -> User:
    if user.is_first_login:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Password change required")
    return user


def require_role(*roles: Role):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
        return user
    return checker