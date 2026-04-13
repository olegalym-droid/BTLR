from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models import Order, Account, OrderResponseOffer
from schemas import OrderResponse
from routes.orders_helpers import build_order_response, is_order_reviewed, ensure_master_is_approved


def update_order_status_by_master_service(
    order_id: int,
    status: str,
    master_id: int,
    db: Session,
) -> OrderResponse:
    allowed_statuses = ["assigned", "on_the_way", "on_site", "completed"]

    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    ensure_master_is_approved(master)

    order = (
        db.query(Order)
        .options(joinedload(Order.photos), joinedload(Order.offers).joinedload(OrderResponseOffer.master))
        .filter(Order.id == order_id, Order.master_id == master_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed_transitions = {
        "assigned": ["on_the_way"],
        "on_the_way": ["on_site"],
        "on_site": ["completed"],
        "completed": [],
        "paid": [],
    }

    if status not in allowed_transitions.get(order.status, []):
        raise HTTPException(status_code=400, detail="Invalid transition")

    order.status = status

    if status == "completed":
        if not order.price:
            order.price = "5000 ₸"

        master.completed_orders_count = (master.completed_orders_count or 0) + 1

    db.commit()
    db.refresh(order)

    return build_order_response(order=order)


def update_order_status_by_user_service(
    order_id: int,
    status: str,
    user_id: int,
    db: Session,
) -> OrderResponse:
    if status != "paid":
        raise HTTPException(status_code=400, detail="Invalid status")

    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    order = (
        db.query(Order)
        .options(joinedload(Order.photos), joinedload(Order.offers).joinedload(OrderResponseOffer.master))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "completed":
        raise HTTPException(status_code=400, detail="Можно оплатить только завершённый заказ")

    order.status = "paid"
    db.commit()
    db.refresh(order)

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )