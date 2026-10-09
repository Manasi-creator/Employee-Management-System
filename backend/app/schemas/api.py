from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class EmployeeCreate(ApiModel):
    employee_code: str | None = None
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None
    joining_date: date
    department_id: int | None = None
    designation_id: int | None = None
    manager_id: int | None = None
    status: str = "ACTIVE"
    password: str | None = Field(default=None, min_length=8, max_length=72)
    role: str = "EMPLOYEE"


class EmployeeUpdate(ApiModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None
    joining_date: date | None = None
    department_id: int | None = None
    designation_id: int | None = None
    manager_id: int | None = None
    status: str | None = None


class ProfileUpdate(ApiModel):
    phone: str | None = None
    address: str | None = None
    skills: str | None = None
    emergency_contact: str | None = None


class DepartmentCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class DepartmentUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


class DesignationCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    department_id: int


class DesignationUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    department_id: int | None = None


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
    employee_id: int
    project_role: str = Field(min_length=1, max_length=100)


class LeaveApply(ApiModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str = Field(min_length=1)


class LeaveAction(ApiModel):
    status: str
    remarks: str | None = None
