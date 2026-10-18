import unittest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.controllers.organization_controller import update_employee
from app.db.base import Base, EmployeeStatus, Role
from app.models import Department, Designation, Employee, User
from app.schemas.api import EmployeeUpdate


class EmployeeUpdateExistingRelationsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.session = Session(self.engine)

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_unrelated_update_preserves_existing_department_designation_mismatch(self):
        hr_user = User(email="hr@example.com", password_hash="hash", role=Role.hr)
        employee_user = User(
            email="employee@example.com",
            password_hash="hash",
            role=Role.employee,
        )
        department = Department(name="Employee Department")
        other_department = Department(name="Designation Department")
        self.session.add_all([hr_user, employee_user, department, other_department])
        self.session.flush()

        designation = Designation(
            name="Legacy Designation",
            department_id=other_department.id,
        )
        self.session.add(designation)
        self.session.flush()
        employee = Employee(
            user_id=employee_user.id,
            employee_code="EMP900",
            first_name="Before",
            last_name="Update",
            date_of_joining=date(2024, 1, 1),
            department_id=department.id,
            designation_id=designation.id,
            status=EmployeeStatus.active,
        )
        self.session.add(employee)
        self.session.commit()

        updated = update_employee(
            employee.public_id,
            EmployeeUpdate(first_name="After", gender="OTHER"),
            self.session,
            hr_user,
        )

        self.assertEqual(updated["first_name"], "After")
        self.assertEqual(updated["department_id"], department.public_id)
        self.assertEqual(updated["designation_id"], designation.public_id)


if __name__ == "__main__":
    unittest.main()
