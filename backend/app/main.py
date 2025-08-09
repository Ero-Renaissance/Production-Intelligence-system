from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes.health import router as health_router
from app.api.routes import api_router


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


# Optional root to hint API is running
@app.get("/", include_in_schema=False)
def root():
    return {"message": f"{settings.APP_NAME} running", "docs": "/api/v1/docs"} 