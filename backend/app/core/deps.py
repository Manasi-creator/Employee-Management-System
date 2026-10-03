from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token
from app.models import User
from app.db.base import Role

bearer = HTTPBearer(auto_error=False)


def get_user_allow_first_login(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(creds.credentials) if creds else None
    subject = payload.get("sub") if payload else None
    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        user_id = None
    user = db.get(User, user_id) if user_id is not None and user_id > 0 else None
    if not user or not user.is_active:
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