from datetime import datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from utils.file_utils import save_order_photos
from models import Order, OrderPhoto, Account, OrderResponseOffer
from schemas import OrderResponse
from routes.orders_helpers import MAX_ORDER_PHOTOS, build_order_response
from order_statuses import SEARCHING


def normalize_price_value(raw_price: str | None) -> str:
    normalized = (raw_price or "").strip()

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Укажите вашу цену за работу",
        )

    cleaned = normalized.replace("₸", "").replace(" ", "").replace(",", "")

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


async def create_order_service(
    user_id: int,
    category: str,
    service_name: str,
    description: str,
    address: str,
    scheduled_at: str,
    client_price: str | None,
    photos: list[UploadFile] | None,
    db: Session,
) -> OrderResponse:
    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not category.strip():
        raise HTTPException(status_code=400, detail="Категория обязательна")

    if not service_name.strip():
        raise HTTPException(status_code=400, detail="Название услуги обязательно")

    if not description.strip():
        raise HTTPException(status_code=400, detail="Описание обязательно")

    if not address.strip():
        raise HTTPException(status_code=400, detail="Адрес обязателен")

    if not scheduled_at.strip():
        raise HTTPException(status_code=400, detail="Дата и время обязательны")

    normalized_client_price = normalize_price_value(client_price)

    valid_photos = []
    if photos:
        valid_photos = [photo for photo in photos if photo and photo.filename]

    if len(valid_photos) > MAX_ORDER_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail=f"Можно прикрепить не более {MAX_ORDER_PHOTOS} фото",
        )

    new_order = Order(
        user_id=user_id,
        master_id=None,
        category=category.strip(),
        service_name=service_name.strip(),
        description=description.strip(),
        address=address.strip(),
        scheduled_at=scheduled_at.strip(),
        status=SEARCHING,
        master_name=None,
        master_rating=None,
        price=None,
        client_price=normalized_client_price,
        created_at=datetime.utcnow(),
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    await save_order_photos(valid_photos, new_order.id, db, OrderPhoto)

    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == new_order.id)
        .first()
    )

    return build_order_response(order=order)