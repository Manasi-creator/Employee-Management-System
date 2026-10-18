import unittest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.controllers.organization_controller import list_employees
from app.db.base import Base, EmployeeStatus, Role
from app.models import Employee, User


class EmployeeOrderingTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.session = Session(self.engine)

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_employee_list_is_ordered_by_descending_id(self):
        hr_user = User(email="hr@example.com", password_hash="hash", role=Role.hr)
        self.session.add(hr_user)
        self.session.flush()

        employees = []
        for number in range(3):
            user = User(
                email=f"employee{number}@example.com",
                password_hash="hash",
                role=Role.employee,
            )
            self.session.add(user)
            self.session.flush()
            employee = Employee(
                user_id=user.id,
                employee_code=f"EMP{number:03}",
                first_name=f"Employee{number}",
                last_name="Test",
                date_of_joining=date(2025, 1, number + 1),
                status=EmployeeStatus.active,
            )
            self.session.add(employee)
            self.session.flush()
            employees.append(employee)

        self.session.commit()

        response = list_employees(
            page=1,
            page_size=100,
            search=None,
            status_filter=None,
            department_id=None,
            designation_id=None,
            db=self.session,
            user=hr_user,
        )

        self.assertEqual(
            [item["id"] for item in response["items"]],
            [employee.public_id for employee in reversed(employees)],
        )


if __name__ == "__main__":
    unittest.main()
