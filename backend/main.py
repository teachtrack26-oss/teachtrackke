from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uvicorn
import logging
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import engine, SessionLocal
from models import Base, SystemSetting

from config import settings
from auth_routes import router as auth_router
from payment_routes import router as payment_router
from routers import (
    schools, profiles, admin, subjects, notes, curriculum, 
    settings as user_settings, timetable, schemes, lesson_plans, 
    records, announcements, sharing, learning, dashboard, analytics
)

# Initialize FastAPI app
app = FastAPI(
    title="TeachTrack CBC API",
    description="API for TeachTrack CBC - Curriculum tracking for Kenyan teachers",
    version="1.0.0"
)


DEFAULT_PRICING_CONFIG = {
    "currency": "KES",
    "termly": {"label": "Termly Pass", "price_kes": 350, "duration_label": "/term"},
    "yearly": {"label": "Yearly Saver", "price_kes": 1000, "duration_label": "/year"},
}


@app.on_event("startup")
def ensure_system_settings_table_and_seed_pricing():
    """Best-effort creation of system_settings + seed pricing_config.

    This removes the need for manual SQL setup in most environments.
    If the DB user lacks DDL permissions, the app will continue and endpoints
    will fall back to defaults.
    """
    try:
        # This startup hook runs in every Gunicorn worker.
        # Use a DB advisory lock to avoid concurrent DDL.
        lock_key = "teachtrack_startup_schema"
        acquired = 0

        with engine.connect() as conn:
            acquired = int(conn.execute(text("SELECT GET_LOCK(:k, 10)"), {"k": lock_key}).scalar() or 0)
            if acquired != 1:
                return

        try:
            # Ensure base schema exists first, otherwise FK references
            # (e.g., system_settings.updated_by -> users.id) can fail.
            Base.metadata.create_all(bind=engine)
            SystemSetting.__table__.create(bind=engine, checkfirst=True)
        finally:
            # Release lock best-effort
            with engine.connect() as conn:
                conn.execute(text("SELECT RELEASE_LOCK(:k)"), {"k": lock_key})

        db = SessionLocal()
        try:
            existing = (
                db.query(SystemSetting)
                .filter(SystemSetting.key == "pricing_config")
                .first()
            )
            if not existing:
                db.add(SystemSetting(key="pricing_config", value=DEFAULT_PRICING_CONFIG))
                db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"[Startup] Could not ensure system_settings/pricing_config: {e}")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    logger.error(f"Body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(payment_router, prefix=settings.API_V1_PREFIX)
app.include_router(schools.router)
app.include_router(profiles.router)
app.include_router(admin.router)
app.include_router(subjects.router)
app.include_router(notes.router)
app.include_router(curriculum.router)
app.include_router(user_settings.router)
app.include_router(timetable.router)
app.include_router(schemes.router)
app.include_router(lesson_plans.router)
app.include_router(records.router)
app.include_router(announcements.router)
app.include_router(sharing.router)
app.include_router(learning.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)

# Health check
@app.get("/")
def read_root():
    return {"message": "TeachTrack CBC API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", os.getenv("PORT", 8000)))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
