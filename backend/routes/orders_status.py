from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from models import Order, Account, OrderResponseOffer, OrderReportPhoto
from schemas import OrderResponse
from routes.orders_helpers import (
    build_order_response,
    is_order_reviewed,
    ensure_master_is_approved,
    MAX_ORDER_REPORT_PHOTOS,
)
from utils.file_utils import save_order_report_photos


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
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
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

    if status == "completed" and not order.report_photos:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите фото-отчёт, затем завершайте заказ",
        )

    order.status = status

    if status == "completed":
        if not order.price:
            order.price = "5000 ₸"

        master.completed_orders_count = (master.completed_orders_count or 0) + 1

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


async def upload_order_report_by_master_service(
    order_id: int,
    master_id: int,
    photos: list[UploadFile] | None,
    db: Session,
) -> OrderResponse:
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
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.master_id == master_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in ["on_site", "completed", "paid"]:
        raise HTTPException(
            status_code=400,
            detail="Фото-отчёт можно загрузить только после начала выполнения работ",
        )

    valid_photos = []
    if photos:
        valid_photos = [photo for photo in photos if photo and photo.filename]

    if not valid_photos:
        raise HTTPException(
            status_code=400,
            detail="Выберите хотя бы одно фото отчёта",
        )

    if len(valid_photos) > MAX_ORDER_REPORT_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail=f"Можно прикрепить не более {MAX_ORDER_REPORT_PHOTOS} фото отчёта",
        )

    await save_order_report_photos(
        valid_photos,
        order_id=order.id,
        master_id=master.id,
        db=db,
        OrderReportPhoto=OrderReportPhoto,
    )

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

    if order.status != "completed":
        raise HTTPException(status_code=400, detail="Можно оплатить только завершённый заказ")

    order.status = "paid"
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

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )