import unittest
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.security import create_access_token, decode_token
from app.db.base import Role
from app.main import app
from app.models import User


class AuthCookieTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        )

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_login_sets_http_only_cookie_without_returning_token(self):
        user = User(
            id=7,
            public_id="00000000-0000-4000-8000-000000000007",
            email="hr@example.com",
            role=Role.hr,
            is_first_login=False,
            is_active=True,
        )
        with patch("app.controllers.auth_controller.auth_service.login", return_value=("signed-token", user)):
            response = await self.client.post(
                "/api/v1/auth/login",
                json={"email": "hr@example.com", "password": "valid-password"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("access_token", response.json())
        self.assertEqual(response.json()["user"]["id"], user.public_id)
        self.assertIsNone(response.json()["user"]["employee_id"])
        self.assertIn(f"{settings.AUTH_COOKIE_NAME}=signed-token", response.headers["set-cookie"])
        self.assertIn("httponly", response.headers["set-cookie"].lower())
        self.assertEqual(response.headers["cache-control"], "no-store")

    async def test_logout_clears_cookie(self):
        response = await self.client.post("/api/v1/auth/logout")

        self.assertEqual(response.status_code, 200)
        self.assertIn(f"{settings.AUTH_COOKIE_NAME}=", response.headers["set-cookie"])
        self.assertIn("max-age=0", response.headers["set-cookie"].lower())

    async def test_me_returns_null_without_session(self):
        response = await self.client.get("/api/v1/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())

    async def test_access_token_uses_public_id_as_subject(self):
        public_id = "00000000-0000-4000-8000-000000000007"
        token = create_access_token(public_id, Role.hr.value)

        self.assertEqual(decode_token(token)["sub"], public_id)

    async def test_cookie_authenticated_mutation_rejects_foreign_origin(self):
        self.client.cookies.set(settings.AUTH_COOKIE_NAME, "not-a-real-token")
        response = await self.client.post(
            "/api/v1/auth/logout",
            headers={"Origin": "https://attacker.example"},
        )

        self.assertEqual(response.status_code, 403)

    async def test_cookie_authenticated_mutation_requires_origin(self):
        self.client.cookies.set(settings.AUTH_COOKIE_NAME, "not-a-real-token")
        response = await self.client.post("/api/v1/auth/logout")

        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
