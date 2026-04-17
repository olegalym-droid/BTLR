from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from models import Account, Order, OrderResponseOffer, MasterSchedule
from schemas import OrderResponse
from routes.orders_helpers import (
    build_order_response,
    is_order_reviewed,
    get_master_or_404,
    ensure_master_is_approved,
)
from order_statuses import (
    SEARCHING,
    PENDING_USER_CONFIRMATION,
)


def parse_order_datetime(value: str) -> datetime | None:
    raw_value = (value or "").strip()
    if not raw_value:
        return None

    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M",
        "%d.%m.%Y %H:%M",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(raw_value, fmt)
        except ValueError:
            continue

    return None


def master_can_work_at_order_time(
    master_id: int,
    scheduled_at: str,
    db: Session,
) -> bool:
    order_dt = parse_order_datetime(scheduled_at)

    if order_dt is None:
        return False

    weekday = order_dt.weekday()
    order_time = order_dt.strftime("%H:%M")

    matching_schedule = (
        db.query(MasterSchedule)
        .filter(
            MasterSchedule.master_id == master_id,
            MasterSchedule.weekday == weekday,
            MasterSchedule.start_time <= order_time,
            MasterSchedule.end_time >= order_time,
        )
        .first()
    )

    return matching_schedule is not None


def calculate_order_priority(order: Order) -> tuple:
    created_at = order.created_at or datetime.min

    price_value = 0
    raw_price = order.client_price or order.price or "0"
    cleaned_price = (
        str(raw_price)
        .replace("₸", "")
        .replace(" ", "")
        .replace(",", "")
        .strip()
    )
    if cleaned_price.isdigit():
        price_value = int(cleaned_price)

    offers_count = len([offer for offer in order.offers if offer.status == "pending"])

    return (
        created_at,
        price_value,
        -offers_count,
    )


def get_orders_for_user(user_id: int, db: Session) -> list[OrderResponse]:
    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
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


def get_available_orders_for_master(
    master_id: int,
    db: Session,
) -> list[OrderResponse]:
    master = get_master_or_404(master_id, db, with_categories=True)
    ensure_master_is_approved(master)

    master_categories = [item.category_name for item in master.master_categories]

    query = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(
            Order.master_id.is_(None),
            Order.status.in_([SEARCHING, PENDING_USER_CONFIRMATION]),
        )
    )

    if master_categories:
        query = query.filter(Order.category.in_(master_categories))
    else:
        return []

    orders = query.all()

    filtered_orders = []
    for order in orders:
        already_offered = any(
            offer.master_id == master_id and offer.status == "pending"
            for offer in order.offers
        )

        if already_offered:
            continue

        if not master_can_work_at_order_time(master_id, order.scheduled_at, db):
            continue

        filtered_orders.append(order)

    filtered_orders.sort(
        key=lambda order: calculate_order_priority(order),
        reverse=True,
    )

    result = []
    for order in filtered_orders:
        result.append(
            build_order_response(
                order=order,
                reviewed=False,
                short_address=True,
            )
        )

    return result


def get_orders_for_master(master_id: int, db: Session) -> list[OrderResponse]:
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    pending_offer_order_ids = (
        db.query(OrderResponseOffer.order_id)
        .filter(
            OrderResponseOffer.master_id == master_id,
            OrderResponseOffer.status == "pending",
        )
        .subquery()
    )

    orders = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(
            or_(
                Order.master_id == master_id,
                Order.id.in_(pending_offer_order_ids),
            )
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    return [build_order_response(order=order) for order in orders]


def get_single_order_for_user(
    order_id: int,
    user_id: int,
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
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )