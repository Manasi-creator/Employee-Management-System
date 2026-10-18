import unittest
from datetime import date

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.controllers.organization_controller import get_my_team
from app.controllers.projects_controller import (
    ensure_employee_is_manager_team_member,
    ensure_project_management_access,
    list_projects,
    remove_project_member,
    update_project_member,
)
from app.db.base import Base, EmployeeStatus, Role
from app.models import Department, Employee, Project, ProjectMember, User
from app.schemas.api import ProjectMemberUpdate


class ProjectAccessTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.session = Session(self.engine)

        self.manager_user = User(
            email="manager@example.com", password_hash="hash", role=Role.manager
        )
        self.other_manager_user = User(
            email="other-manager@example.com",
            password_hash="hash",
            role=Role.manager,
        )
        self.report_user = User(
            email="report@example.com", password_hash="hash", role=Role.employee
        )
        self.other_employee_user = User(
            email="other@example.com", password_hash="hash", role=Role.employee
        )
        self.cross_department_user = User(
            email="cross-department@example.com",
            password_hash="hash",
            role=Role.employee,
        )
        self.session.add_all(
            [
                self.manager_user,
                self.other_manager_user,
                self.report_user,
                self.other_employee_user,
                self.cross_department_user,
            ]
        )
        self.session.flush()

        self.department = Department(name="Engineering")
        self.other_department = Department(name="Finance")
        self.session.add_all([self.department, self.other_department])
        self.session.flush()

        self.manager = Employee(
            user_id=self.manager_user.id,
            employee_code="MGR100",
            first_name="First",
            last_name="Manager",
            date_of_joining=date(2024, 1, 1),
            department_id=self.department.id,
            status=EmployeeStatus.active,
        )
        self.other_manager = Employee(
            user_id=self.other_manager_user.id,
            employee_code="MGR101",
            first_name="Other",
            last_name="Manager",
            date_of_joining=date(2024, 1, 1),
            department_id=self.other_department.id,
            status=EmployeeStatus.active,
        )
        self.session.add_all([self.manager, self.other_manager])
        self.session.flush()

        self.report = Employee(
            user_id=self.report_user.id,
            employee_code="EMP100",
            first_name="Direct",
            last_name="Report",
            date_of_joining=date(2024, 1, 1),
            department_id=self.department.id,
            manager_id=self.manager.id,
            status=EmployeeStatus.active,
        )
        self.other_employee = Employee(
            user_id=self.other_employee_user.id,
            employee_code="EMP101",
            first_name="Other",
            last_name="Employee",
            date_of_joining=date(2024, 1, 1),
            department_id=self.other_department.id,
            manager_id=self.other_manager.id,
            status=EmployeeStatus.active,
        )
        self.different_department_report = Employee(
            user_id=self.cross_department_user.id,
            employee_code="EMP102",
            first_name="Cross",
            last_name="Department",
            date_of_joining=date(2024, 1, 1),
            department_id=self.other_department.id,
            manager_id=self.manager.id,
            status=EmployeeStatus.active,
        )
        self.session.add_all([
            self.report,
            self.other_employee,
            self.different_department_report,
        ])
        self.session.flush()

        self.foreign_project = Project(
            name="Other Manager Project",
            created_by=self.other_manager_user.id,
        )
        self.team_project = Project(
            name="Team Project",
            created_by=self.other_manager_user.id,
        )
        self.owned_project = Project(
            name="Owned Project",
            created_by=self.manager_user.id,
        )
        self.session.add_all(
            [self.foreign_project, self.team_project, self.owned_project]
        )
        self.session.flush()
        self.session.add(
            ProjectMember(
                project_id=self.team_project.id,
                employee_id=self.report.id,
                project_role="Developer",
            )
        )
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_manager_cannot_access_another_managers_project_by_uuid(self):
        with self.assertRaises(HTTPException) as raised:
            ensure_project_management_access(
                self.session, self.foreign_project, self.manager_user
            )

        self.assertEqual(raised.exception.status_code, 403)

    def test_manager_can_access_owned_or_direct_team_project(self):
        ensure_project_management_access(
            self.session, self.owned_project, self.manager_user
        )
        ensure_project_management_access(
            self.session, self.team_project, self.manager_user
        )

    def test_manager_cannot_add_an_employee_outside_their_team(self):
        ensure_employee_is_manager_team_member(self.report, self.manager_user)

        with self.assertRaises(HTTPException) as raised:
            ensure_employee_is_manager_team_member(
                self.other_employee, self.manager_user
            )

        self.assertEqual(raised.exception.status_code, 403)

    def test_manager_cannot_add_a_direct_report_from_another_department(self):
        with self.assertRaises(HTTPException) as raised:
            ensure_employee_is_manager_team_member(
                self.different_department_report, self.manager_user
            )

        self.assertEqual(raised.exception.status_code, 403)

    def test_manager_team_list_only_includes_direct_reports_in_their_department(self):
        result = get_my_team(
            page=1,
            page_size=100,
            search=None,
            db=self.session,
            user=self.manager_user,
        )

        self.assertEqual(
            [member["id"] for member in result["items"]],
            [self.report.public_id],
        )

    def test_manager_project_list_excludes_other_department_team_assignments(self):
        cross_department_project = Project(
            name="Cross Department Project",
            created_by=self.other_manager_user.id,
        )
        self.session.add(cross_department_project)
        self.session.flush()
        self.session.add(
            ProjectMember(
                project_id=cross_department_project.id,
                employee_id=self.different_department_report.id,
                project_role="Analyst",
            )
        )
        self.session.commit()

        result = list_projects(
            page=1,
            page_size=100,
            search=None,
            status_filter=None,
            db=self.session,
            user=self.manager_user,
        )

        self.assertEqual(
            {project["id"] for project in result["items"]},
            {self.owned_project.public_id, self.team_project.public_id},
        )

    def test_manager_can_update_a_department_team_member_project_role(self):
        updated = update_project_member(
            self.team_project.public_id,
            self.report.public_id,
            ProjectMemberUpdate(project_role="Technical Lead"),
            self.session,
            self.manager_user,
        )

        self.assertEqual(updated["project_role"], "Technical Lead")
        member = self.session.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == self.team_project.id,
                ProjectMember.employee_id == self.report.id,
            )
        )
        self.assertEqual(member.project_role, "Technical Lead")

    def test_manager_cannot_remove_a_member_from_another_department(self):
        self.session.add(
            ProjectMember(
                project_id=self.team_project.id,
                employee_id=self.different_department_report.id,
                project_role="Analyst",
            )
        )
        self.session.commit()

        with self.assertRaises(HTTPException) as raised:
            remove_project_member(
                self.team_project.public_id,
                self.different_department_report.public_id,
                self.session,
                self.manager_user,
            )

        self.assertEqual(raised.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
