from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Account, Review, Order
from schemas import (
    OrderResponse,
    OrderOfferResponse,
    OfferMasterResponse,
    ComplaintSummaryResponse,
    ComplaintHistoryResponse,
)
from complaint_constants import (
    ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES,
    get_complaint_reason_label,
    get_complaint_resolution_label,
    get_complaint_status_label,
)

MAX_ORDER_PHOTOS = 4
MAX_ORDER_REPORT_PHOTOS = 8


def calculate_offer_priority(offer) -> tuple:
    master = offer.master

    rating = float(master.rating or 0) if master else 0.0
    completed_orders = float(master.completed_orders_count or 0) if master else 0.0
    experience_years = float(master.experience_years or 0) if master else 0.0
    created_at = offer.created_at or datetime.min

    return (
        rating,
        completed_orders,
        experience_years,
        created_at,
    )


def build_order_response(
    order: Order,
    reviewed: bool = False,
    short_address: bool = False,
) -> OrderResponse:
    address = order.address
    if short_address:
        address = order.address.split(",")[0].strip() if order.address else ""

    pending_offers = [
        offer
        for offer in order.offers
        if offer.status == "pending" and offer.master is not None
    ]

    pending_offers.sort(
        key=calculate_offer_priority,
        reverse=True,
    )

    offers = []
    for offer in pending_offers:
        offers.append(
            OrderOfferResponse(
                id=offer.id,
                status=offer.status,
                offered_price=offer.offered_price,
                master=OfferMasterResponse(
                    id=offer.master.id,
                    full_name=offer.master.full_name,
                    about_me=offer.master.about_me,
                    experience_years=offer.master.experience_years,
                    rating=offer.master.rating,
                    avatar_path=offer.master.avatar_path,
                    selfie_photo_path=offer.master.selfie_photo_path,
                ),
            )
        )

    complaint_items = sorted(
        order.complaints or [],
        key=lambda item: (item.created_at or datetime.min, item.id or 0),
        reverse=True,
    )
    complaints = []
    active_payment_blocking_complaint = False

    for complaint in complaint_items:
        is_payment_blocking = (
            complaint.payment_blocked
            and complaint.status in ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES
        )
        active_payment_blocking_complaint = (
            active_payment_blocking_complaint or is_payment_blocking
        )

        history = [
            ComplaintHistoryResponse(
                id=history_item.id,
                status=history_item.status,
                status_label=get_complaint_status_label(history_item.status),
                resolution=history_item.resolution,
                resolution_label=get_complaint_resolution_label(
                    history_item.resolution,
                ),
                comment=history_item.comment,
                actor=history_item.actor,
                created_at=(
                    history_item.created_at.isoformat()
                    if history_item.created_at
                    else None
                ),
            )
            for history_item in (complaint.history or [])
        ]

        complaints.append(
            ComplaintSummaryResponse(
                id=complaint.id,
                order_id=complaint.order_id,
                reason=complaint.reason or "other",
                reason_label=get_complaint_reason_label(complaint.reason),
                text=complaint.text,
                status=complaint.status,
                status_label=get_complaint_status_label(complaint.status),
                resolution=complaint.resolution,
                resolution_label=get_complaint_resolution_label(
                    complaint.resolution,
                ),
                admin_comment=complaint.admin_comment,
                payment_blocked=is_payment_blocking,
                created_at=(
                    complaint.created_at.isoformat()
                    if complaint.created_at
                    else None
                ),
                updated_at=(
                    complaint.updated_at.isoformat()
                    if complaint.updated_at
                    else None
                ),
                resolved_at=(
                    complaint.resolved_at.isoformat()
                    if complaint.resolved_at
                    else None
                ),
                history=history,
            )
        )

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
        master_phone=order.master.phone if order.master else None,
        user_phone=order.user.phone if order.user else None,
        price=order.price,
        client_price=order.client_price,
        payout_status=order.payout_status,
        reviewed=reviewed,
        offers=offers,
        photos=order.photos,
        report_photos=order.report_photos,
        complaints=complaints,
        active_payment_blocking_complaint=active_payment_blocking_complaint,
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
        from sqlalchemy.orm import joinedload
        query = query.options(joinedload(Account.master_categories))

    master = (
        query
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    return master


def ensure_master_is_approved(master: Account):
    if master.verification_status != "approved":
        raise HTTPException(
            status_code=403,
            detail="Мастер ещё не подтверждён и не может работать с заказами",
        )


def ensure_master_can_take_order(master: Account, order: Order):
    master_categories = [item.category_name for item in master.master_categories]

    if not master_categories:
        raise HTTPException(
            status_code=400,
            detail="У мастера не указаны категории услуг",
        )

    if order.category not in master_categories:
        raise HTTPException(
            status_code=403,
            detail="Мастер не может взять заказ из этой категории",
        )
