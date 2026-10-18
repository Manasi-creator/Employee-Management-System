import unittest
from datetime import date

from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import Session

from app.controllers.organization_controller import list_employees
from app.db.base import Base, EmployeeStatus, LeaveStatus, Role
from app.models import Department, Employee, LeaveRequest, LeaveType, User
from app.services.employee_service import archive_employee


class EmployeeArchiveTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")

        @event.listens_for(self.engine, "connect")
        def enable_foreign_keys(connection, _):
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        Base.metadata.create_all(self.engine)
        self.session = Session(self.engine)

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def add_employee(self, email="employee@example.com", code="EMP900"):
        user = User(email=email, password_hash="hash", role=Role.employee)
        self.session.add(user)
        self.session.flush()
        employee = Employee(
            user_id=user.id,
            employee_code=code,
            first_name="Test",
            last_name="Employee",
            phone="1234567890",
            phone_country_code="+91",
            date_of_joining=date(2024, 1, 15),
            status=EmployeeStatus.active,
        )
        self.session.add(employee)
        self.session.flush()
        return user, employee

    def test_archive_marks_employee_inactive_without_moving_history(self):
        user, employee = self.add_employee()
        leave_type = LeaveType(name="Annual Leave", code="AL", annual_balance=20)
        self.session.add(leave_type)
        self.session.flush()
        leave = LeaveRequest(
            employee_id=employee.id,
            leave_type_id=leave_type.id,
            start_date=date(2025, 5, 1),
            end_date=date(2025, 5, 2),
            number_of_days=2,
            status=LeaveStatus.approved,
        )
        self.session.add(leave)
        self.session.commit()

        archived = archive_employee(self.session, employee.id)

        self.assertIs(self.session.get(Employee, employee.id), archived)
        self.assertEqual(archived.status, EmployeeStatus.inactive)
        self.assertEqual(archived.phone_country_code, "+91")
        self.assertFalse(self.session.get(User, user.id).is_active)
        self.assertEqual(leave.employee_id, employee.id)
        self.assertEqual(self.session.scalar(select(LeaveRequest.id)), leave.id)

    def test_archive_allows_manager_to_be_marked_inactive_without_deleting_team(self):
        manager_user, manager = self.add_employee(
            email="manager@example.com", code="MGR900"
        )
        _, team_member = self.add_employee(
            email="member@example.com", code="EMP901"
        )
        team_member.manager_id = manager.id
        self.session.commit()

        archived = archive_employee(self.session, manager.id)

        self.assertEqual(archived.status, EmployeeStatus.inactive)
        self.assertFalse(self.session.get(User, manager_user.id).is_active)
        self.assertEqual(self.session.get(Employee, team_member.id).manager_id, manager.id)

    def test_inactive_employee_filter_returns_archived_employee(self):
        hr_user = User(email="hr@example.com", password_hash="hash", role=Role.hr)
        self.session.add(hr_user)
        _, employee = self.add_employee()
        self.session.commit()
        archive_employee(self.session, employee.id)

        response = list_employees(
            page=1,
            page_size=10,
            search=None,
            status_filter="INACTIVE",
            department_id=None,
            designation_id=None,
            db=self.session,
            user=hr_user,
        )

        self.assertEqual([row["id"] for row in response["items"]], [employee.public_id])

    def test_manager_employee_list_is_limited_to_direct_reports(self):
        manager_user = User(
            email="manager@example.com", password_hash="hash", role=Role.manager
        )
        own_department = Department(name="Manager Department")
        other_department = Department(name="Other Department")
        self.session.add_all([manager_user, own_department, other_department])
        self.session.flush()
        manager = Employee(
            user_id=manager_user.id,
            employee_code="MGR901",
            first_name="Team",
            last_name="Manager",
            date_of_joining=date(2024, 1, 1),
            department_id=own_department.id,
            status=EmployeeStatus.active,
        )
        report_user = User(
            email="report@example.com", password_hash="hash", role=Role.employee
        )
        unrelated_user = User(
            email="unrelated@example.com", password_hash="hash", role=Role.employee
        )
        self.session.add_all([manager, report_user, unrelated_user])
        self.session.flush()
        report = Employee(
            user_id=report_user.id,
            employee_code="EMP902",
            first_name="Direct",
            last_name="Report",
            date_of_joining=date(2024, 1, 1),
            department_id=own_department.id,
            manager_id=manager.id,
            status=EmployeeStatus.active,
        )
        unrelated = Employee(
            user_id=unrelated_user.id,
            employee_code="EMP903",
            first_name="Other",
            last_name="Employee",
            date_of_joining=date(2024, 1, 1),
            department_id=other_department.id,
            status=EmployeeStatus.active,
        )
        self.session.add_all([report, unrelated])
        self.session.commit()

        response = list_employees(
            page=1,
            page_size=10,
            search=None,
            status_filter=None,
            department_id=other_department.public_id,
            designation_id=None,
            db=self.session,
            user=manager_user,
        )

        self.assertEqual(response["items"], [])

        team_response = list_employees(
            page=1,
            page_size=10,
            search=None,
            status_filter=None,
            department_id=own_department.public_id,
            designation_id=None,
            db=self.session,
            user=manager_user,
        )
        self.assertEqual(
            [row["id"] for row in team_response["items"]], [report.public_id]
        )


if __name__ == "__main__":
    unittest.main()
