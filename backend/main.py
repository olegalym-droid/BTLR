from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routes.auth import router as auth_router
from routes.orders import router as orders_router
from routes.masters import router as masters_router
from routes.reviews import router as reviews_router
from routes.admin import router as admin_router


def create_app() -> FastAPI:
    app = FastAPI()

    Base.metadata.create_all(bind=engine)

    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"message": "Backend is running"}

    app.include_router(auth_router)
    app.include_router(orders_router)
    app.include_router(masters_router)
    app.include_router(reviews_router)
    app.include_router(admin_router)

    return app


app = create_app()

from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")