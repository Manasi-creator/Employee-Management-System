import unittest

from pydantic import ValidationError

from app.schemas.api import EmployeeCreate, EmployeeUpdate, ProfileUpdate


class EmployeePhoneValidationTests(unittest.TestCase):
    def test_employee_create_accepts_ten_digit_phone_and_country_code(self):
        payload = {
            "first_name": "Test",
            "last_name": "Employee",
            "email": "test@example.com",
            "phone": "1234567890",
            "country_code": "+1",
            "gender": "OTHER",
            "joining_date": "2026-01-01",
            "password": "InitialPass123",
        }

        employee = EmployeeCreate.model_validate(payload)

        self.assertEqual(employee.phone, "1234567890")
        self.assertEqual(employee.country_code, "+1")

    def test_employee_create_rejects_eleven_digit_phone(self):
        with self.assertRaises(ValidationError):
            EmployeeCreate.model_validate({
                "first_name": "Test",
                "last_name": "Employee",
                "email": "test@example.com",
                "phone": "12345678901",
                "country_code": "+1",
                "gender": "OTHER",
                "joining_date": "2026-01-01",
                "password": "InitialPass123",
            })

    def test_employee_create_requires_an_initial_password(self):
        with self.assertRaises(ValidationError):
            EmployeeCreate.model_validate({
                "first_name": "Test",
                "last_name": "Employee",
                "email": "test@example.com",
                "phone": "1234567890",
                "country_code": "+1",
                "gender": "OTHER",
                "joining_date": "2026-01-01",
            })

    def test_employee_update_requires_phone_and_country_code_together(self):
        with self.assertRaises(ValidationError):
            EmployeeUpdate.model_validate({"phone": "1234567890", "gender": "OTHER"})

    def test_employee_update_rejects_eleven_digit_phone(self):
        with self.assertRaises(ValidationError):
            EmployeeUpdate.model_validate({
                "phone": "12345678901",
                "country_code": "+1",
                "gender": "OTHER",
            })

    def test_employee_update_rejects_null_phone_pair(self):
        with self.assertRaises(ValidationError):
            EmployeeUpdate.model_validate({
                "phone": None, "country_code": None, "gender": "OTHER"
            })

    def test_employee_update_requires_gender(self):
        with self.assertRaises(ValidationError):
            EmployeeUpdate.model_validate({})

    def test_profile_update_requires_phone_and_country_code_together(self):
        with self.assertRaises(ValidationError):
            ProfileUpdate.model_validate({"country_code": "+1"})

    def test_profile_update_rejects_eleven_digit_phone(self):
        with self.assertRaises(ValidationError):
            ProfileUpdate.model_validate({
                "phone": "12345678901",
                "country_code": "+1",
            })

    def test_profile_update_rejects_null_phone_pair(self):
        with self.assertRaises(ValidationError):
            ProfileUpdate.model_validate({"phone": None, "country_code": None})


if __name__ == "__main__":
    unittest.main()
