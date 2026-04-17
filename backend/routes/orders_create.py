from datetime import datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from utils.file_utils import save_order_photos
from models import Order, OrderPhoto, Account, OrderResponseOffer
from schemas import OrderResponse
from routes.orders_helpers import MAX_ORDER_PHOTOS, build_order_response
from order_statuses import SEARCHING


MAX_ORDER_PRICE = 10_000_000
MIN_ORDER_PRICE = 100


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

    if amount < MIN_ORDER_PRICE:
        raise HTTPException(
            status_code=400,
            detail=f"Минимальная цена — {MIN_ORDER_PRICE} ₸",
        )

    if amount > MAX_ORDER_PRICE:
        raise HTTPException(
            status_code=400,
            detail=f"Максимальная цена — {MAX_ORDER_PRICE} ₸",
        )

    return str(amount)


def validate_text(
    value: str | None,
    *,
    field_name: str,
    min_len: int,
    max_len: int,
    empty_detail: str,
) -> str:
    normalized = (value or "").strip()

    if not normalized:
        raise HTTPException(status_code=400, detail=empty_detail)

    if len(normalized) < min_len:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} слишком короткое",
        )

    if len(normalized) > max_len:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} слишком длинное",
        )

    return normalized


def validate_category(value: str | None) -> str:
    return validate_text(
        value,
        field_name="Категория",
        min_len=2,
        max_len=100,
        empty_detail="Категория обязательна",
    )


def validate_service_name(value: str | None) -> str:
    return validate_text(
        value,
        field_name="Название услуги",
        min_len=3,
        max_len=100,
        empty_detail="Название услуги обязательно",
    )


def validate_description(value: str | None) -> str:
    return validate_text(
        value,
        field_name="Описание",
        min_len=5,
        max_len=1000,
        empty_detail="Описание обязательно",
    )


def validate_address(value: str | None) -> str:
    return validate_text(
        value,
        field_name="Адрес",
        min_len=5,
        max_len=300,
        empty_detail="Адрес обязателен",
    )


def normalize_scheduled_at(raw_value: str | None) -> str:
    normalized = (raw_value or "").strip()

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Дата и время обязательны",
        )

    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M",
        "%d.%m.%Y %H:%M",
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(normalized, fmt)
            return parsed.strftime("%Y-%m-%d %H:%M")
        except ValueError:
            continue

    raise HTTPException(
        status_code=400,
        detail="Некорректный формат даты и времени",
    )


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

    normalized_category = validate_category(category)
    normalized_service_name = validate_service_name(service_name)
    normalized_description = validate_description(description)
    normalized_address = validate_address(address)
    normalized_scheduled_at = normalize_scheduled_at(scheduled_at)
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
        category=normalized_category,
        service_name=normalized_service_name,
        description=normalized_description,
        address=normalized_address,
        scheduled_at=normalized_scheduled_at,
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