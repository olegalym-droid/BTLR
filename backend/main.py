from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Depends, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload

from database import Base, engine, get_db
from models import Order, OrderPhoto, Account
from auth_routes import router as auth_router
from schemas import OrderResponse

app = FastAPI()
Base.metadata.create_all(bind=engine)

UPLOADS_DIR = Path("uploads/orders")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

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


@app.get("/orders", response_model=list[OrderResponse])
def get_orders(user_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, user_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@app.post("/orders", response_model=OrderResponse)
async def create_order(
    user_id: int = Form(...),
    category: str = Form(...),
    service_name: str = Form(...),
    description: str = Form(...),
    address: str = Form(...),
    scheduled_at: str = Form(...),
    photos: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
):


    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_order = Order(
        user_id=user_id,
        category=category,
        service_name=service_name,
        description=description,
        address=address,
        scheduled_at=scheduled_at,
        status="searching",
        master_name=None,
        master_rating=None,
        price=None,
        created_at=datetime.utcnow(),
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    if photos:
        for photo in photos:
            if not photo.filename:
                continue

            suffix = Path(photo.filename).suffix or ".jpg"
            filename = f"{uuid4()}{suffix}"
            file_path = UPLOADS_DIR / filename

            content = await photo.read()
            file_path.write_bytes(content)

            order_photo = OrderPhoto(
                order_id=new_order.id,
                file_path=str(file_path).replace("\\", "/"),
            )
            db.add(order_photo)

        db.commit()

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == new_order.id)
        .first()
    )

    return order


@app.put("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    allowed_statuses = [
        "searching",
        "assigned",
        "on_the_way",
        "on_site",
        "completed",
        "paid",
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid status",
                "allowed_statuses": allowed_statuses,
            },
        )

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    db.commit()
    db.refresh(order)

    return order


app.include_router(auth_router)