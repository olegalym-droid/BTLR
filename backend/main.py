from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from auth_routes import router as auth_router
from orders_routes import router as orders_router
from masters_routes import router as masters_router
from reviews_routes import router as reviews_router


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

    return app


app = create_app()