from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers import auth_controller
from app.controllers import (
    dashboard_controller,
    leave_controller,
    organization_controller,
    projects_controller,
)
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="EMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


API_PREFIX = "/api/v1"

app.include_router(auth_controller.router, prefix=API_PREFIX)
app.include_router(organization_controller.router, prefix=API_PREFIX)
app.include_router(projects_controller.router, prefix=API_PREFIX)
app.include_router(leave_controller.router, prefix=API_PREFIX)
app.include_router(dashboard_controller.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}