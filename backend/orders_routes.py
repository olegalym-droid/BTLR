from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from sqlalchemy.orm import Session, joinedload

from database import get_db
from file_utils import save_order_photos
from models import Order, OrderPhoto, Account, Review
from schemas import OrderResponse

router = APIRouter(tags=["orders"])


def build_order_response(
    order: Order,
    reviewed: bool = False,
    short_address: bool = False,
) -> OrderResponse:
    address = order.address
    if short_address:
        address = order.address.split(",")[0].strip() if order.address else ""

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
        category=order.category,
        service_name=order.service_name,
        description=order.description,
        address=address,
        scheduled_at=order.scheduled_at,
        status=order.status,
        master_name=order.master_name,
        master_rating=order.master_rating,
        price=order.price,
        reviewed=reviewed,
        photos=order.photos,
    )


def is_order_reviewed(order_id: int, db: Session) -> bool:
    return (
        db.query(Review)
        .filter(Review.order_id == order_id)
        .first()
        is not None
    )


def get_master_or_404(
    master_id: int,
    db: Session,
    with_categories: bool = False,
):
    query = db.query(Account)

    if with_categories:
        query = query.options(joinedload(Account.master_categories))

    master = (
        query
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    return master


@router.get("/orders", response_model=list[OrderResponse])
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
        result.append(
            build_order_response(
                order=order,
                reviewed=is_order_reviewed(order.id, db),
            )
        )

    return result


@router.get("/orders/available", response_model=list[OrderResponse])
def get_available_orders(master_id: int, db: Session = Depends(get_db)):
    master = get_master_or_404(master_id, db, with_categories=True)
    master_categories = [item.category_name for item in master.master_categories]

    query = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.master_id.is_(None), Order.status == "searching")
    )

    if master_categories:
        query = query.filter(Order.category.in_(master_categories))

    orders = query.order_by(Order.created_at.desc()).all()

    return [
        build_order_response(order=order, reviewed=False, short_address=True)
        for order in orders
    ]


@router.get("/orders/master", response_model=list[OrderResponse])
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

    return [build_order_response(order=order) for order in orders]


@router.put("/orders/{order_id}/assign", response_model=OrderResponse)
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

    return build_order_response(order=order)


@router.put("/orders/{order_id}/master-status", response_model=OrderResponse)
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
        return build_order_response(order=order)

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

    return build_order_response(order=order)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, user_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )


@router.post("/orders", response_model=OrderResponse)
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

    await save_order_photos(photos, new_order.id, db, OrderPhoto)

    order = (
        db.query(Order)
        .options(joinedload(Order.photos))
        .filter(Order.id == new_order.id)
        .first()
    )

    return build_order_response(order=order)


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
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

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )