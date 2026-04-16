from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models import Order, OrderResponseOffer, Notification
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


def normalize_price_value(raw_price: str | None) -> str:
    normalized = (raw_price or "").strip()

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Укажите цену отклика",
        )

    cleaned = (
        normalized
        .replace("₸", "")
        .replace(" ", "")
        .replace(",", "")
    )

    if not cleaned.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Цена должна содержать только цифры",
        )

    amount = int(cleaned)

    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Цена должна быть больше нуля",
        )

    if amount > 10000000:
        raise HTTPException(
            status_code=400,
            detail="Цена слишком большая",
        )

    return str(amount)


def assign_order_to_master_service(
    order_id: int,
    master_id: int,
    offered_price: str | None,
    db: Session,
) -> OrderResponse:
    master = get_master_or_404(master_id, db, with_categories=True)
    ensure_master_is_approved(master)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
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

    raw_offered_price = (offered_price or "").strip()
    raw_client_price = (order.client_price or "").strip()

    if raw_offered_price:
        normalized_offered_price = normalize_price_value(raw_offered_price)
    else:
        if not raw_client_price:
            raise HTTPException(
                status_code=400,
                detail="Не удалось определить цену отклика мастера",
            )

        normalized_offered_price = normalize_price_value(raw_client_price)

    new_offer = OrderResponseOffer(
        order_id=order.id,
        master_id=master.id,
        status="pending",
        offered_price=normalized_offered_price,
    )

    db.add(new_offer)

    if order.status == SEARCHING:
        order.status = PENDING_USER_CONFIRMATION

    if order.user_id:
        normalized_client_price = (
            normalize_price_value(raw_client_price)
            if raw_client_price
            else ""
        )

        is_custom_price = normalized_offered_price != normalized_client_price

        if is_custom_price:
            notification_title = "Мастер предложил свою цену"
            notification_message = (
                f"Мастер {master.full_name or 'без имени'} откликнулся на заказ "
                f"«{order.service_name}» и предложил цену {normalized_offered_price}."
            )
            notification_type = "master_offered_price"
        else:
            notification_title = "Новый отклик мастера"
            notification_message = (
                f"Мастер {master.full_name or 'без имени'} откликнулся на заказ "
                f"«{order.service_name}»."
            )
            notification_type = "master_response"

        db.add(
            Notification(
                user_id=order.user_id,
                order_id=order.id,
                type=notification_type,
                title=notification_title,
                message=notification_message,
                is_read=False,
            )
        )

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order.id)
        .first()
    )

    return build_order_response(order=order)