from sqlalchemy import select, func, and_, extract
from sqlalchemy.orm import Session
from app.models import LeaveType, LeaveRequest
from app.db.base import LeaveStatus

def get_leave_balance(db: Session, employee_id: int, year: int):
    used = func.coalesce(func.sum(LeaveRequest.number_of_days), 0)
    stmt = (
        select(LeaveType.id, LeaveType.name, LeaveType.annual_balance, used.label("used"))
        .outerjoin(LeaveRequest, and_(
            LeaveRequest.leave_type_id == LeaveType.id,
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status == LeaveStatus.approved,
            extract("year", LeaveRequest.start_date) == year))
        .group_by(LeaveType.id)
    )
    return [{"leave_type": r.name, "total": r.annual_balance,
             "used": float(r.used), "remaining": float(r.annual_balance - r.used)}
            for r in db.execute(stmt)]