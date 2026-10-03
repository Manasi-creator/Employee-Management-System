from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import User
from app.core.security import verify_password, hash_password, create_access_token

def login(db: Session, email: str, password: str) -> tuple[str, User]:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise PermissionError("Invalid email or password")   # same message for all cases
    user.last_login = datetime.now()
    db.commit()
    return create_access_token(user.id, user.role.value), user

def change_password(db: Session, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.password_hash):
        raise PermissionError("Current password is incorrect")
    if current == new:
        raise ValueError("New password must be different from the current one")
    user.password_hash = hash_password(new)
    user.is_first_login = False
    db.commit()