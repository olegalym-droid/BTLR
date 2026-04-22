import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routes.auth import router as auth_router
from routes.orders import router as orders_router
from routes.masters import router as masters_router
from routes.reviews import router as reviews_router
from routes.admin import router as admin_router
from routes.complaints import router as complaints_router
from routes.notifications import router as notifications_router
from routes.schedules import router as schedules_router
from routes.wallet import router as wallet_router


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


def get_allowed_origins() -> list[str]:
    raw_value = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [item.strip() for item in raw_value.split(",") if item.strip()]
    return origins or ["http://localhost:3000"]


def create_app() -> FastAPI:
    app = FastAPI()

    Base.metadata.create_all(bind=engine)

    uploads_dir = BASE_DIR / "uploads"
    if uploads_dir.is_dir():
        app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"message": "Backend is running"}

    @app.get("/health")
    def health():
        return {
            "ok": True,
            "allowed_origins": get_allowed_origins(),
            "admin_login_configured": bool(os.getenv("ADMIN_LOGIN")),
            "admin_password_configured": bool(os.getenv("ADMIN_PASSWORD")),
            "env_path": str(ENV_PATH),
            "env_exists": ENV_PATH.exists(),
        }

    app.include_router(auth_router)
    app.include_router(orders_router)
    app.include_router(masters_router)
    app.include_router(reviews_router)
    app.include_router(admin_router)
    app.include_router(complaints_router)
    app.include_router(notifications_router)
    app.include_router(schedules_router)
    app.include_router(wallet_router)

    return app


app = create_app()