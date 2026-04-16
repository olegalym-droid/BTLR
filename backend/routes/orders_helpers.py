from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Account, Review, Order
from schemas import (
    OrderResponse,
    OrderOfferResponse,
    OfferMasterResponse,
)

MAX_ORDER_PHOTOS = 4
MAX_ORDER_REPORT_PHOTOS = 8


def build_order_response(
    order: Order,
    reviewed: bool = False,
    short_address: bool = False,
) -> OrderResponse:
    address = order.address
    if short_address:
        address = order.address.split(",")[0].strip() if order.address else ""

    offers = []
    for offer in order.offers:
        if offer.status != "pending" or offer.master is None:
            continue

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
        reviewed=reviewed,
        offers=offers,
        photos=order.photos,
        report_photos=order.report_photos,
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