from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from models import Order, Account, OrderResponseOffer
from schemas import OrderResponse
from routes.orders_helpers import build_order_response, is_order_reviewed
from order_statuses import (
    PENDING_USER_CONFIRMATION,
    SEARCHING,
    ASSIGNED,
)


def normalize_price_value(raw_price: str | None) -> str:
    normalized = (raw_price or "").strip()

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Не удалось определить итоговую цену заказа",
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


def confirm_master_for_order_service(
    order_id: int,
    user_id: int,
    offer_id: int,
    db: Session,
) -> OrderResponse:
    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != PENDING_USER_CONFIRMATION:
        raise HTTPException(
            status_code=400,
            detail="Этот заказ сейчас не ожидает выбора мастера",
        )

    selected_offer = next(
        (offer for offer in order.offers if offer.id == offer_id),
        None,
    )

    if selected_offer is None:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    if selected_offer.status != "pending":
        raise HTTPException(status_code=400, detail="Отклик уже обработан")

    if selected_offer.master is None:
        raise HTTPException(status_code=400, detail="Мастер не найден")

    final_price = normalize_price_value(
        selected_offer.offered_price or order.client_price,
    )

    order.master_id = selected_offer.master.id
    order.master_name = selected_offer.master.full_name
    order.master_rating = selected_offer.master.rating
    order.price = final_price
    order.status = ASSIGNED

    for offer in order.offers:
        offer.status = "accepted" if offer.id == offer_id else "rejected"

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order.id)
        .first()
    )

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )


def reject_master_for_order_service(
    order_id: int,
    user_id: int,
    offer_id: int,
    db: Session,
) -> OrderResponse:
    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != PENDING_USER_CONFIRMATION:
        raise HTTPException(status_code=400, detail="Нельзя отклонить")

    selected_offer = next(
        (offer for offer in order.offers if offer.id == offer_id),
        None,
    )

    if not selected_offer:
        raise HTTPException(status_code=404, detail="Отклик не найден")

    if selected_offer.status != "pending":
        raise HTTPException(status_code=400, detail="Отклик уже обработан")

    selected_offer.status = "rejected"

    has_pending = any(
        offer.id != offer_id and offer.status == "pending"
        for offer in order.offers
    )

    order.status = PENDING_USER_CONFIRMATION if has_pending else SEARCHING

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order.id)
        .first()
    )

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )