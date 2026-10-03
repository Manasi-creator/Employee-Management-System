from datetime import date
from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.base import Role
from app.core.security import hash_password
from app.models import (User, Department, Designation, Employee, LeaveType)

TEMP_PASSWORD = "Welcome@123"   # everyone must change it on first login

def make_user(db, email, role):
    user = User(email=email, password_hash=hash_password(TEMP_PASSWORD),
                role=role, is_first_login=True)
    db.add(user); db.flush()
    return user

def make_employee(db, user, code, first, last, dept, desig, manager=None):
    emp = Employee(user_id=user.id, employee_code=code, first_name=first,
                   last_name=last, date_of_joining=date.today(),
                   department_id=dept.id, designation_id=desig.id,
                   manager_id=manager.id if manager else None)
    db.add(emp); db.flush()
    return emp

def seed():
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.role == Role.hr)):
            print("Already seeded"); return

        db.add_all([
            LeaveType(name="Casual Leave", code="CL", annual_balance=12),
            LeaveType(name="Sick Leave",   code="SL", annual_balance=10),
            LeaveType(name="Earned Leave", code="EL", annual_balance=15),
        ])

        hr = make_user(db, "hr@ems.com", Role.hr)

        fin = Department(name="Finance", created_by=hr.id)
        eng = Department(name="Engineering", created_by=hr.id)
        human_resources = Department(name="Human Resources", created_by=hr.id)
        db.add_all([fin, eng, human_resources]); db.flush()

        fin_mgr_d = Designation(name="Finance Manager", department_id=fin.id, created_by=hr.id)
        acct_d    = Designation(name="Accountant",      department_id=fin.id, created_by=hr.id)
        eng_mgr_d = Designation(name="Engineering Manager", department_id=eng.id, created_by=hr.id)
        dev_d     = Designation(name="Developer",       department_id=eng.id, created_by=hr.id)
        test_d    = Designation(name="Tester",          department_id=eng.id, created_by=hr.id)
        hr_d      = Designation(name="HR Manager",       department_id=human_resources.id, created_by=hr.id)
        db.add_all([fin_mgr_d, acct_d, eng_mgr_d, dev_d, test_d, hr_d]); db.flush()

        make_employee(db, hr, "EMP000", "Harper", "Reed", human_resources, hr_d)
        fm = make_employee(db, make_user(db, "fin.manager@ems.com", Role.manager),
                           "EMP001", "Fiona", "Shah", fin, fin_mgr_d)
        em = make_employee(db, make_user(db, "eng.manager@ems.com", Role.manager),
                           "EMP002", "Evan", "Rao", eng, eng_mgr_d)

        for i, (first, last) in enumerate([("Asha", "Patil"), ("Arjun", "Nair")], start=3):
            make_employee(db, make_user(db, f"{first.lower()}@ems.com", Role.employee),
                          f"EMP00{i}", first, last, fin, acct_d, manager=fm)
        make_employee(db, make_user(db, "dev@ems.com", Role.employee),
                      "EMP005", "Dev", "Kumar", eng, dev_d, manager=em)
        make_employee(db, make_user(db, "tester@ems.com", Role.employee),
                      "EMP006", "Tara", "Iyer", eng, test_d, manager=em)

        db.commit()
        print("Seed complete")

if __name__ == "__main__":
    seed()