from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uvicorn

from config import settings
from auth_routes import router as auth_router
from payment_routes import router as payment_router
from routers import (
    schools, profiles, admin, subjects, notes, curriculum, 
    settings as user_settings, timetable, schemes, lesson_plans, 
    records, announcements, sharing, learning, dashboard
)

# Initialize FastAPI app
app = FastAPI(
    title="TeachTrack CBC API",
    description="API for TeachTrack CBC - Curriculum tracking for Kenyan teachers",
    version="1.0.0"
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
