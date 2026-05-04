import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

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
from routes.chats import router as chats_router, admin_router as admin_chats_router


def get_allowed_origins() -> list[str]:
    raw_value = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [item.strip() for item in raw_value.split(",") if item.strip()]
    return origins or ["http://localhost:3000"]


def ensure_sqlite_schema() -> None:
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "complaints" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("complaints")
    }
    account_columns = {
        column["name"]
        for column in inspector.get_columns("accounts")
    } if "accounts" in inspector.get_table_names() else set()
    order_columns = {
        column["name"]
        for column in inspector.get_columns("orders")
    } if "orders" in inspector.get_table_names() else set()

    migration_statements = {
        "reason": "ALTER TABLE complaints ADD COLUMN reason VARCHAR NOT NULL DEFAULT 'other'",
        "resolution": "ALTER TABLE complaints ADD COLUMN resolution VARCHAR",
        "admin_comment": "ALTER TABLE complaints ADD COLUMN admin_comment VARCHAR",
        "payment_blocked": "ALTER TABLE complaints ADD COLUMN payment_blocked BOOLEAN NOT NULL DEFAULT 1",
        "updated_at": "ALTER TABLE complaints ADD COLUMN updated_at DATETIME",
        "resolved_at": "ALTER TABLE complaints ADD COLUMN resolved_at DATETIME",
    }

    with engine.begin() as connection:
        for column_name, statement in migration_statements.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))

        if "frozen_balance_amount" not in account_columns:
            connection.execute(
                text(
                    "ALTER TABLE accounts ADD COLUMN frozen_balance_amount "
                    "VARCHAR NOT NULL DEFAULT '0'"
                )
            )

        if "payout_status" not in order_columns:
            connection.execute(
                text(
                    "ALTER TABLE orders ADD COLUMN payout_status "
                    "VARCHAR NOT NULL DEFAULT 'unpaid'"
                )
            )

        if "payout_updated_at" not in order_columns:
            connection.execute(
                text("ALTER TABLE orders ADD COLUMN payout_updated_at DATETIME")
            )

        connection.execute(
            text(
                """
                UPDATE complaints
                SET updated_at = COALESCE(updated_at, created_at)
                WHERE updated_at IS NULL
                """
            )
        )

        connection.execute(
            text(
                """
                UPDATE orders
                SET payout_status = 'available'
                WHERE status = 'paid'
                  AND (payout_status IS NULL OR payout_status = 'unpaid')
                """
            )
        )


def create_app() -> FastAPI:
    app = FastAPI()

    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema()

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
        return {"ok": True}

    app.include_router(auth_router)
    app.include_router(orders_router)
    app.include_router(masters_router)
    app.include_router(reviews_router)
    app.include_router(admin_router)
    app.include_router(complaints_router)
    app.include_router(notifications_router)
    app.include_router(schedules_router)
    app.include_router(wallet_router)
    app.include_router(chats_router)
    app.include_router(admin_chats_router)

    return app


app = create_app()
