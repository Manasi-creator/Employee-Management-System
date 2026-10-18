from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from app.db.base import Role

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str = Field(validation_alias="public_id")
    email: EmailStr
    role: Role
    is_first_login: bool
    is_active: bool
    employee_id: str | None

    @field_serializer("role")
    def serialize_role(self, role: Role) -> str:
        return role.value.upper()

class LoginResponse(BaseModel):
    user: UserOut

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)