from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from models import (
    Order,
    Account,
    OrderResponseOffer,
    OrderReportPhoto,
    Notification,
    Complaint,
)
from schemas import OrderResponse
from routes.orders_helpers import (
    build_order_response,
    is_order_reviewed,
    ensure_master_is_approved,
    MAX_ORDER_REPORT_PHOTOS,
)
from utils.file_utils import save_order_report_photos
from order_statuses import (
    COMPLETED,
    PAID,
    MASTER_ALLOWED_STATUSES,
    MASTER_ALLOWED_TRANSITIONS,
    REPORT_UPLOAD_ALLOWED_STATUSES,
)

ACTIVE_COMPLAINT_BLOCKING_STATUSES = {"new", "in_progress"}


def parse_amount_to_int(raw_value: str | None) -> int:
    if not raw_value:
        return 0

    cleaned = (
        str(raw_value)
        .replace("₸", "")
        .replace(" ", "")
        .replace(",", "")
        .strip()
    )

    return int(cleaned) if cleaned.isdigit() else 0


def normalize_amount_to_storage(raw_value: str | None) -> str:
    amount = parse_amount_to_int(raw_value)

    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Сумма должна быть больше нуля",
        )

    return str(amount)


def get_order_final_amount(order: Order) -> str:
    raw_amount = order.price or order.client_price

    if not raw_amount:
        raise HTTPException(
            status_code=400,
            detail="У заказа не указана цена",
        )

    return normalize_amount_to_storage(raw_amount)


def get_master_or_404(master_id: int, db: Session) -> Account:
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    return master


def get_master_order_or_404(order_id: int, master_id: int, db: Session) -> Order:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.master_id == master_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


def get_user_or_404(user_id: int, db: Session) -> Account:
    user = (
        db.query(Account)
        .filter(Account.id == user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def get_user_order_or_404(order_id: int, user_id: int, db: Session) -> Order:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


def validate_master_status_change(order: Order, next_status: str) -> None:
    if next_status not in MASTER_ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    allowed_next_statuses = MASTER_ALLOWED_TRANSITIONS.get(order.status, set())

    if next_status not in allowed_next_statuses:
        raise HTTPException(status_code=400, detail="Invalid transition")

    if next_status == COMPLETED and not order.report_photos:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите фото-отчёт, затем завершайте заказ",
        )


def validate_report_upload(order: Order, photos: list[UploadFile] | None) -> list[UploadFile]:
    if order.status not in REPORT_UPLOAD_ALLOWED_STATUSES:
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

    return valid_photos


def refresh_master_order(order_id: int, db: Session) -> Order:
    return (
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


def create_order_completed_notification(order: Order) -> Notification | None:
    if not order.user_id:
        return None

    final_amount = order.price or order.client_price or ""
    amount_text = f" на сумму {final_amount} ₸" if final_amount else ""

    return Notification(
        user_id=order.user_id,
        order_id=order.id,
        type="order_completed_payment_required",
        title="Заказ завершён, требуется оплата",
        message=(
            f"Мастер завершил заказ «{order.service_name}»{amount_text}. "
            f"Подтвердите оплату в карточке заказа."
        ),
        is_read=False,
    )


def has_active_payment_blocking_complaint(order_id: int, db: Session) -> bool:
    active_complaint = (
        db.query(Complaint)
        .filter(
            Complaint.order_id == order_id,
            Complaint.status.in_(ACTIVE_COMPLAINT_BLOCKING_STATUSES),
        )
        .first()
    )

    return active_complaint is not None


def update_order_status_by_master_service(
    order_id: int,
    status: str,
    master_id: int,
    db: Session,
) -> OrderResponse:
    master = get_master_or_404(master_id, db)
    ensure_master_is_approved(master)

    order = get_master_order_or_404(order_id, master_id, db)

    validate_master_status_change(order, status)

    if status == COMPLETED:
        order.price = get_order_final_amount(order)
        master.completed_orders_count = (master.completed_orders_count or 0) + 1

        notification = create_order_completed_notification(order)
        if notification is not None:
            db.add(notification)

    order.status = status

    db.commit()

    refreshed_order = refresh_master_order(order.id, db)
    return build_order_response(order=refreshed_order)


async def upload_order_report_by_master_service(
    order_id: int,
    master_id: int,
    photos: list[UploadFile] | None,
    db: Session,
) -> OrderResponse:
    master = get_master_or_404(master_id, db)
    ensure_master_is_approved(master)

    order = get_master_order_or_404(order_id, master_id, db)

    valid_photos = validate_report_upload(order, photos)

    await save_order_report_photos(
        valid_photos,
        order_id=order.id,
        master_id=master.id,
        db=db,
        OrderReportPhoto=OrderReportPhoto,
    )

    refreshed_order = refresh_master_order(order.id, db)
    return build_order_response(order=refreshed_order)


def update_order_status_by_user_service(
    order_id: int,
    status: str,
    user_id: int,
    db: Session,
) -> OrderResponse:
    if status != PAID:
        raise HTTPException(status_code=400, detail="Invalid status")

    get_user_or_404(user_id, db)
    order = get_user_order_or_404(order_id, user_id, db)

    if order.status == PAID:
        raise HTTPException(
            status_code=400,
            detail="Заказ уже оплачен",
        )

    if order.status != COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Можно оплатить только завершённый заказ",
        )

    if order.master is None:
        raise HTTPException(
            status_code=400,
            detail="У заказа нет назначенного мастера",
        )

    if has_active_payment_blocking_complaint(order.id, db):
        raise HTTPException(
            status_code=400,
            detail=(
                "По этому заказу есть активная жалоба. "
                "Оплата временно заблокирована до решения администратора."
            ),
        )

    payout_amount = parse_amount_to_int(get_order_final_amount(order))

    current_balance = parse_amount_to_int(order.master.balance_amount)
    current_available = parse_amount_to_int(order.master.available_withdraw_amount)

    order.status = PAID
    order.price = str(payout_amount)

    order.master.balance_amount = str(current_balance + payout_amount)
    order.master.available_withdraw_amount = str(current_available + payout_amount)

    db.commit()

    refreshed_order = refresh_master_order(order.id, db)

    return build_order_response(
        order=refreshed_order,
        reviewed=is_order_reviewed(order.id, db),
    )