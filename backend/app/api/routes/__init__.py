from fastapi import APIRouter

from .health import router as health_router
from .summary import router as summary_router
from .assets import router as assets_router
from .gap_drivers import router as gap_drivers_router
from .production_flow import router as production_flow_router
from .terminals import router as terminals_router
from .hubs import router as hubs_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(summary_router)
api_router.include_router(assets_router)
api_router.include_router(gap_drivers_router)
api_router.include_router(production_flow_router)
api_router.include_router(terminals_router)
api_router.include_router(hubs_router) 