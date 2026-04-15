from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from models import Account, Order, OrderResponseOffer
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

    orders = query.order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        already_offered = any(
            offer.master_id == master_id and offer.status == "pending"
            for offer in order.offers
        )

        if already_offered:
            continue

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