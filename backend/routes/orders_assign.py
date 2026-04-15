from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models import Order, OrderResponseOffer
from schemas import OrderResponse
from routes.orders_helpers import (
    build_order_response,
    get_master_or_404,
    ensure_master_is_approved,
    ensure_master_can_take_order,
)
from order_statuses import (
    SEARCHING,
    PENDING_USER_CONFIRMATION,
)


def assign_order_to_master_service(
    order_id: int,
    master_id: int,
    db: Session,
) -> OrderResponse:
    master = get_master_or_404(master_id, db, with_categories=True)
    ensure_master_is_approved(master)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.master_id is not None:
        raise HTTPException(status_code=400, detail="Order already assigned")

    if order.status not in {SEARCHING, PENDING_USER_CONFIRMATION}:
        raise HTTPException(
            status_code=400,
            detail="Можно откликаться только на активные заказы",
        )

    ensure_master_can_take_order(master, order)

    existing_offer = (
        db.query(OrderResponseOffer)
        .filter(
            OrderResponseOffer.order_id == order_id,
            OrderResponseOffer.master_id == master_id,
            OrderResponseOffer.status == "pending",
        )
        .first()
    )

    if existing_offer:
        raise HTTPException(
            status_code=400,
            detail="Вы уже откликнулись на этот заказ",
        )

    new_offer = OrderResponseOffer(
        order_id=order.id,
        master_id=master.id,
        status="pending",
    )

    db.add(new_offer)

    if order.status == SEARCHING:
        order.status = PENDING_USER_CONFIRMATION

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order.id)
        .first()
    )

    return build_order_response(order=order)