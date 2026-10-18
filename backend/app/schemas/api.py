from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class EmployeeCreate(ApiModel):
    employee_code: str | None = None
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(pattern=r"^\d{10}$")
    country_code: str = Field(pattern=r"^\+?[1-9]\d{0,2}$")
    date_of_birth: date | None = None
    gender: str
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None
    joining_date: date
    department_id: UUID | None = None
    designation_id: UUID | None = None
    manager_id: UUID | None = None
    status: str = "ACTIVE"
    password: str = Field(min_length=8, max_length=72)
    role: str = "EMPLOYEE"


class EmployeeUpdate(ApiModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    country_code: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{0,2}$")
    date_of_birth: date | None = None
    gender: str
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None
    joining_date: date | None = None
    department_id: UUID | None = None
    designation_id: UUID | None = None
    manager_id: UUID | None = None
    status: str | None = None

    @model_validator(mode="after")
    def validate_phone_pair(self):
        phone_is_set = "phone" in self.model_fields_set
        country_code_is_set = "country_code" in self.model_fields_set
        if phone_is_set != country_code_is_set:
            raise ValueError("Phone number and country code must be provided together")
        if phone_is_set and (self.phone is None or self.country_code is None):
            raise ValueError("Phone number and country code cannot be null")
        return self


class ProfileUpdate(ApiModel):
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    country_code: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{0,2}$")
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None

    @model_validator(mode="after")
    def validate_phone_pair(self):
        phone_is_set = "phone" in self.model_fields_set
        country_code_is_set = "country_code" in self.model_fields_set
        if phone_is_set != country_code_is_set:
            raise ValueError("Phone number and country code must be provided together")
        if phone_is_set and (self.phone is None or self.country_code is None):
            raise ValueError("Phone number and country code cannot be null")
        return self


class DepartmentCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class DepartmentUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


class DesignationCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    department_id: UUID


class DesignationUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    department_id: UUID | None = None


class ProjectCreate(ApiModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "PLANNING"


class ProjectUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class ProjectMemberCreate(ApiModel):
    employee_id: UUID
    project_role: str = Field(min_length=1, max_length=100)


class ProjectMemberUpdate(ApiModel):
    project_role: str = Field(min_length=1, max_length=100)


class LeaveApply(ApiModel):
    leave_type_id: UUID
    start_date: date
    end_date: date
    reason: str = Field(min_length=1)


class LeaveAction(ApiModel):
    status: str
    remarks: str | None = None
