from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.controllers.api_utils import (
    commit_or_conflict,
    enum_from_name,
    enum_value,
    page_bounds,
    paginate,
)
from app.controllers.organization_controller import employee_summary_out
from app.core.deps import get_current_user, require_role
from app.db.base import LeaveStatus, Role
from app.db.session import get_db
from app.models import Employee, LeaveRequest, LeaveType, User
from app.schemas.api import LeaveAction, LeaveApply
from app.services.leave_service import get_leave_balance

router = APIRouter(prefix="/leaves", tags=["Leaves"])


def leave_type_out(leave_type: LeaveType) -> dict:
    return {
        "id": leave_type.id,
        "name": leave_type.name,
        "max_days": leave_type.annual_balance,
    }


def leave_out(request: LeaveRequest) -> dict:
    return {
        "id": request.id,
        "employee_id": request.employee_id or 0,
        "leave_type_id": request.leave_type_id,
        "leave_type": leave_type_out(request.leave_type),
        "start_date": request.start_date.isoformat(),
        "end_date": request.end_date.isoformat(),
        "days": float(request.number_of_days),
        "reason": request.reason or "",
        "status": enum_value(request.status).upper(),
        "remarks": request.approver_remarks,
        "employee": employee_summary_out(request.employee),
        "reviewed_by": request.approved_by,
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat(),
    }


def _request_query():
    return select(LeaveRequest).options(
        joinedload(LeaveRequest.leave_type),
        joinedload(LeaveRequest.employee).joinedload(Employee.user),
        joinedload(LeaveRequest.employee).joinedload(Employee.department),
        joinedload(LeaveRequest.employee).joinedload(Employee.designation),
    )


def _filter_status(stmt, status_value: str | None):
    if status_value:
        return stmt.where(LeaveRequest.status == enum_from_name(LeaveStatus, status_value, "status"))
    return stmt


def _paginated_leave_list(db: Session, stmt, count_stmt, page: int, page_size: int):
    offset, limit = page_bounds(page, page_size)
    requests = db.scalars(stmt.order_by(LeaveRequest.created_at.desc()).offset(offset).limit(limit)).unique().all()
    return paginate([leave_out(item) for item in requests], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/types")
def list_leave_types(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [leave_type_out(item) for item in db.scalars(select(LeaveType).order_by(LeaveType.id)).all()]


@router.get("/my")
def list_my_leaves(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    stmt = _request_query().where(LeaveRequest.employee_id == user.employee.id)
    count_stmt = select(func.count(LeaveRequest.id)).where(LeaveRequest.employee_id == user.employee.id)
    stmt = _filter_status(stmt, status_filter)
    count_stmt = _filter_status(count_stmt, status_filter)
    return _paginated_leave_list(db, stmt, count_stmt, page, page_size)


@router.get("/balance")
def get_my_leave_balance(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    return get_leave_balance(db, user.employee.id, date.today().year)


@router.post("", status_code=status.HTTP_201_CREATED)
def apply_for_leave(
    body: LeaveApply,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    if body.end_date < body.start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "end_date must not be before start_date")
    leave_type = db.get(LeaveType, body.leave_type_id)
    if leave_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave type not found")
    days = (body.end_date - body.start_date).days + 1
    request = LeaveRequest(
        employee_id=user.employee.id,
        leave_type_id=body.leave_type_id,
        start_date=body.start_date,
        end_date=body.end_date,
        number_of_days=Decimal(days),
        reason=body.reason.strip(),
        status=LeaveStatus.pending,
    )
    db.add(request)
    commit_or_conflict(db)
    return leave_out(db.scalar(_request_query().where(LeaveRequest.id == request.id)))


@router.post("/{leave_id}/cancel")
def cancel_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    request = db.scalar(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    if request is None or request.employee_id != getattr(user.employee, "id", None):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    if request.status != LeaveStatus.pending:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only pending leave requests can be cancelled")
    request.status = LeaveStatus.cancelled
    commit_or_conflict(db)
    return leave_out(db.scalar(_request_query().where(LeaveRequest.id == request.id)))


@router.get("/team")
def list_team_leaves(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    team_ids = select(Employee.id).where(Employee.manager_id == user.employee.id)
    stmt = _request_query().where(LeaveRequest.employee_id.in_(team_ids))
    count_stmt = select(func.count(LeaveRequest.id)).where(LeaveRequest.employee_id.in_(team_ids))
    stmt = _filter_status(stmt, status_filter)
    count_stmt = _filter_status(count_stmt, status_filter)
    return _paginated_leave_list(db, stmt, count_stmt, page, page_size)


@router.get("/manager-requests")
def list_manager_leaves(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    manager_employee_ids = select(Employee.id).join(Employee.user).where(User.role == Role.manager)
    stmt = _request_query().where(LeaveRequest.employee_id.in_(manager_employee_ids))
    count_stmt = select(func.count(LeaveRequest.id)).where(LeaveRequest.employee_id.in_(manager_employee_ids))
    stmt = _filter_status(stmt, status_filter)
    count_stmt = _filter_status(count_stmt, status_filter)
    return _paginated_leave_list(db, stmt, count_stmt, page, page_size)


@router.post("/{leave_id}/action")
def action_on_leave(
    leave_id: int,
    body: LeaveAction,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    request = db.scalar(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.employee).joinedload(Employee.user))
        .where(LeaveRequest.id == leave_id)
    )
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    next_status = enum_from_name(LeaveStatus, body.status, "status")
    if next_status not in (LeaveStatus.approved, LeaveStatus.rejected):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "status must be APPROVED or REJECTED")
    owner_role = request.employee.user.role if request.employee else None
    if user.role == Role.manager:
        if owner_role != Role.employee or request.employee.manager_id != getattr(user.employee, "id", None):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This leave request is not for your team")
    elif user.role == Role.hr:
        if owner_role != Role.manager:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "HR can only review manager leave requests")
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    if request.status != LeaveStatus.pending:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only pending leave requests can be reviewed")
    request.status = next_status
    request.approved_by = user.id
    request.approver_remarks = body.remarks
    request.approved_at = datetime.utcnow()
    commit_or_conflict(db)
    return leave_out(db.scalar(_request_query().where(LeaveRequest.id == leave_id)))


@router.get("/{leave_id}")
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    request = db.scalar(_request_query().where(LeaveRequest.id == leave_id))
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    if user.role == Role.hr:
        if request.employee is None or request.employee.user.role != Role.manager:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    elif user.role == Role.manager:
        if request.employee_id != getattr(user.employee, "id", None) and (
            request.employee is None or request.employee.manager_id != getattr(user.employee, "id", None)
        ):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    elif request.employee_id != getattr(user.employee, "id", None):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    return leave_out(request)
