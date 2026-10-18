from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.controllers import auth_controller
from app.controllers import (
    dashboard_controller,
    leave_controller,
    organization_controller,
    projects_controller,
)
from app.core.config import settings

is_production = settings.APP_ENV == "production"
app = FastAPI(
    title="EMS API",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    if not is_production
    else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers_and_csrf(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"} and settings.AUTH_COOKIE_NAME in request.cookies:
        origin = request.headers.get("origin")
        fetch_site = request.headers.get("sec-fetch-site")
        if origin is None or origin.rstrip("/") not in settings.cors_origins or fetch_site == "cross-site":
            response = JSONResponse(status_code=403, content={"detail": "Request origin is not allowed"})
        else:
            response = await call_next(request)
    else:
        response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


API_PREFIX = "/api/v1"

app.include_router(auth_controller.router, prefix=API_PREFIX)
app.include_router(organization_controller.router, prefix=API_PREFIX)
app.include_router(projects_controller.router, prefix=API_PREFIX)
app.include_router(leave_controller.router, prefix=API_PREFIX)
app.include_router(dashboard_controller.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}