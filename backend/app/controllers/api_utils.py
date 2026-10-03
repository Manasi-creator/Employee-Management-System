from math import ceil
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import ProjectStatus


def enum_value(value: Any) -> str | None:
    return value.value if value is not None else None


def enum_from_name(enum_type: type, value: str, field: str):
    try:
        normalized = value.strip().lower()
        if enum_type is ProjectStatus and normalized == "planning":
            normalized = "planned"
        return enum_type(normalized)
    except (AttributeError, ValueError):
        allowed = ", ".join(item.name.upper() for item in enum_type)
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Invalid {field}. Expected one of: {allowed}",
        ) from None


def commit_or_conflict(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "The requested change conflicts with an existing record or relationship.",
        ) from exc


def paginate(items: list, total: int, page: int, page_size: int) -> dict:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def page_bounds(page: int, page_size: int) -> tuple[int, int]:
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "page must be positive and page_size must be between 1 and 100.",
        )
    return (page - 1) * page_size, page_size
