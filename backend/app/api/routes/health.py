from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/healthz", tags=["health"]) 
def healthz():
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "env": settings.ENV,
    } 