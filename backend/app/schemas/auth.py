from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from app.db.base import Role

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    role: Role
    is_first_login: bool
    is_active: bool
    employee_id: int | None

    @field_serializer("role")
    def serialize_role(self, role: Role) -> str:
        return role.value.upper()

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)