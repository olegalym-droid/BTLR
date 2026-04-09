from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Depends, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload

from database import Base, engine, get_db
from models import Order, OrderPhoto, Account, Review
from auth_routes import router as auth_router
from schemas import OrderResponse, MasterProfileResponse

app = FastAPI()
Base.metadata.create_all(bind=engine)

UPLOADS_ROOT = Path("uploads")
ORDERS_UPLOADS_DIR = UPLOADS_ROOT / "orders"
ORDERS_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

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


@app.get("/masters/{master_id}", response_model=MasterProfileResponse)
def get_master_profile(master_id: int, db: Session = Depends(get_db)):
    master = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    return master


@app.get("/orders", response_model=list[OrderResponse])
def get_orders(user_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.master),
        )
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        reviewed = (
            db.query(Review)
            .filter(Review.order_id == order.id)
            .first()
            is not None
        )

        result.append(
            OrderResponse(
                id=order.id,
                user_id=order.user_id,
                master_id=order.master_id,
                category=order.category,
                service_name=order.service_name,
                description=order.description,
                address=order.address,
                scheduled_at=order.scheduled_at,
                status=order.status,
                master_name=order.master_name,
                master_rating=order.master_rating,
                price=order.price,
                reviewed=reviewed,
                photos=order.photos,
            )
        )

    return result


@app.get("/orders/available", response_model=list[OrderResponse])
def get_available_orders(master_id: int, db: Session = Depends(get_db)):
    master = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    master_categories = [item.category_name for item in master.master_categories]

    query = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.master_id.is_(None), Order.status == "searching")
    )

    if master_categories:
        query = query.filter(Order.category.in_(master_categories))

    orders = query.order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        short_address = order.address.split(",")[0].strip() if order.address else ""
        result.append(
            OrderResponse(
                id=order.id,
                user_id=order.user_id,
                master_id=order.master_id,
                category=order.category,
                service_name=order.service_name,
                description=order.description,
                address=short_address,
                scheduled_at=order.scheduled_at,
                status=order.status,
                master_name=order.master_name,
                master_rating=order.master_rating,
                price=order.price,
                reviewed=False,
                photos=order.photos,
            )
        )

    return result


@app.get("/orders/master", response_model=list[OrderResponse])
def get_master_orders(master_id: int, db: Session = Depends(get_db)):
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    orders = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.master_id == master_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        result.append(
            OrderResponse(
                id=order.id,
                user_id=order.user_id,
                master_id=order.master_id,
                category=order.category,
                service_name=order.service_name,
                description=order.description,
                address=order.address,
                scheduled_at=order.scheduled_at,
                status=order.status,
                master_name=order.master_name,
                master_rating=order.master_rating,
                price=order.price,
                reviewed=False,
                photos=order.photos,
            )
        )

    return result


@app.put("/orders/{order_id}/assign", response_model=OrderResponse)
def assign_order_to_master(order_id: int, master_id: int, db: Session = Depends(get_db)):
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.master_id is not None:
        raise HTTPException(status_code=400, detail="Order already assigned")

    order.master_id = master.id
    order.master_name = master.full_name
    order.master_rating = master.rating
    order.status = "assigned"

    db.commit()
    db.refresh(order)

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=order.address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=False,
        photos=order.photos,
    )


@app.put("/orders/{order_id}/master-status", response_model=OrderResponse)
def update_order_status_by_master(
    order_id: int,
    status: str,
    master_id: int,
    db: Session = Depends(get_db),
):
    allowed_statuses = ["assigned", "on_the_way", "on_site", "completed"]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid status",
                "allowed_statuses": allowed_statuses,
            },
        )

    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == order_id, Order.master_id == master_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = order.status

    allowed_transitions = {
        "assigned": ["on_the_way"],
        "on_the_way": ["on_site"],
        "on_site": ["completed"],
        "completed": [],
        "paid": [],
        "searching": [],
    }

    if status == current_status:
        return OrderResponse(
            id=order.id,
            user_id=order.user_id,
            master_id=order.master_id,
            category=order.category,
            service_name=order.service_name,
            description=order.description,
            address=order.address,
            scheduled_at=order.scheduled_at,
            status=order.status,
            master_name=order.master_name,
            master_rating=order.master_rating,
            price=order.price,
            reviewed=False,
            photos=order.photos,
        )

    if status not in allowed_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid status transition",
                "current_status": current_status,
                "next_allowed_statuses": allowed_transitions.get(current_status, []),
            },
        )

    order.status = status

    if status == "completed":
        if not order.price:
            order.price = "5000 ₸"

        master.completed_orders_count = (master.completed_orders_count or 0) + 1

    db.commit()
    db.refresh(order)

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=order.address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=False,
        photos=order.photos,
    )


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

    reviewed = (
        db.query(Review)
        .filter(Review.order_id == order.id)
        .first()
        is not None
    )

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=order.address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=reviewed,
        photos=order.photos,
    )


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
        master_id=None,
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
            file_path = ORDERS_UPLOADS_DIR / filename

            content = await photo.read()
            file_path.write_bytes(content)

            order_photo = OrderPhoto(
                order_id=new_order.id,
                file_path=f"uploads/orders/{filename}",
            )
            db.add(order_photo)

        db.commit()

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == new_order.id)
        .first()
    )

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=order.address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=False,
        photos=order.photos,
    )


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

    if status == "paid" and order.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Оплатить можно только завершённый заказ",
        )

    order.status = status
    db.commit()
    db.refresh(order)

    reviewed = (
        db.query(Review)
        .filter(Review.order_id == order.id)
        .first()
        is not None
    )

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=order.address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=reviewed,
        photos=order.photos,
    )


@app.post("/reviews")
def create_review(
    order_id: int,
    rating: int,
    comment: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Рейтинг должен быть от 1 до 5")

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if user_id is None or order.user_id != user_id:
        raise HTTPException(status_code=403, detail="Нельзя оставить отзыв на чужой заказ")

    if order.status != "paid":
        raise HTTPException(status_code=400, detail="Можно оценить только оплаченный заказ")

    if order.master_id is None:
        raise HTTPException(status_code=400, detail="У заказа нет мастера")

    existing_review = (
        db.query(Review)
        .filter(Review.order_id == order_id)
        .first()
    )

    if existing_review:
        raise HTTPException(status_code=400, detail="Отзыв уже оставлен")

    review = Review(
        order_id=order.id,
        master_id=order.master_id,
        user_id=user_id,
        rating=rating,
        comment=comment,
    )

    db.add(review)
    db.commit()

    reviews = db.query(Review).filter(Review.master_id == order.master_id).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews)

    master = db.query(Account).filter(Account.id == order.master_id).first()
    if master:
        master.rating = round(avg_rating, 2)
        db.commit()

    return {"message": "Отзыв сохранён", "rating": master.rating if master else rating}


app.include_router(auth_router)