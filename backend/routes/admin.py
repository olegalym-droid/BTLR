import os

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    Account,
    Order,
    OrderResponseOffer,
    Complaint,
    MasterWithdrawalRequest,
)
from schemas import (
    MasterProfileResponse,
    OrderResponse,
    ComplaintResponse,
    ComplaintOrderInfoResponse,
    MasterWithdrawalRequestResponse,
)
from routes.orders_helpers import build_order_response, is_order_reviewed

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_COMPLAINT_STATUSES = {"new", "in_progress", "resolved", "rejected"}
ALLOWED_WITHDRAWAL_STATUSES = {"pending", "approved", "rejected"}


class AdminLoginRequest(BaseModel):
    login: str
    password: str


class ComplaintStatusUpdateRequest(BaseModel):
    status: str


class WithdrawalStatusUpdateRequest(BaseModel):
    status: str


def get_admin_credentials() -> tuple[str, str]:
    admin_login = os.getenv("ADMIN_LOGIN", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()

    if not admin_login or not admin_password:
        raise HTTPException(
            status_code=500,
            detail=(
                "Данные администратора не настроены. "
                "Укажите ADMIN_LOGIN и ADMIN_PASSWORD в переменных окружения."
            ),
        )

    return admin_login, admin_password


def verify_admin(
    x_admin_login: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
):
    admin_login, admin_password = get_admin_credentials()

    if x_admin_login != admin_login or x_admin_password != admin_password:
        raise HTTPException(
            status_code=401,
            detail="Неверные данные администратора",
        )


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


def detect_card_brand(card_number: str | None) -> str:
    normalized = "".join(symbol for symbol in str(card_number or "") if symbol.isdigit())

    if not normalized:
        return "unknown"

    if normalized.startswith("4"):
        return "visa"

    if len(normalized) >= 2 and 51 <= int(normalized[:2]) <= 55:
        return "mastercard"

    if len(normalized) >= 4 and 2221 <= int(normalized[:4]) <= 2720:
        return "mastercard"

    return "unknown"


def mask_card_number(card_number: str | None) -> str:
    normalized = "".join(symbol for symbol in str(card_number or "") if symbol.isdigit())

    if not normalized:
        return ""

    if len(normalized) <= 4:
        return normalized

    visible_last = normalized[-4:]
    masked_prefix = "*" * max(len(normalized) - 4, 0)
    combined = f"{masked_prefix}{visible_last}"

    parts = []
    for index in range(0, len(combined), 4):
        parts.append(combined[index:index + 4])

    return " ".join(parts)


def build_complaint_response(complaint: Complaint) -> ComplaintResponse:
    order_info = None

    if complaint.order is not None:
        order_info = ComplaintOrderInfoResponse(
            id=complaint.order.id,
            service_name=complaint.order.service_name,
            category=complaint.order.category,
            status=complaint.order.status,
            price=complaint.order.price,
            client_price=complaint.order.client_price,
            master_name=complaint.order.master_name,
        )

    return ComplaintResponse(
        id=complaint.id,
        order_id=complaint.order_id,
        user_id=complaint.user_id,
        text=complaint.text,
        status=complaint.status,
        user_name=complaint.user.full_name if complaint.user else None,
        order=order_info,
    )


def serialize_withdrawal_request(
    item: MasterWithdrawalRequest,
) -> MasterWithdrawalRequestResponse:
    card_number = item.card_number or ""

    return MasterWithdrawalRequestResponse(
        id=item.id,
        master_id=item.master_id,
        amount=item.amount,
        card_number=card_number,
        masked_card_number=mask_card_number(card_number),
        card_brand=detect_card_brand(card_number),
        card_holder_name=item.card_holder_name,
        status=item.status,
        created_at=item.created_at.isoformat() if item.created_at else "",
    )


@router.post("/login")
def admin_login(payload: AdminLoginRequest):
    admin_login_value, admin_password_value = get_admin_credentials()

    if (
        payload.login != admin_login_value
        or payload.password != admin_password_value
    ):
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль",
        )

    return {
        "ok": True,
        "login": payload.login,
    }


@router.get("/masters/pending", response_model=list[MasterProfileResponse])
def get_pending_masters(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    masters = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(
            Account.role == "master",
            Account.verification_status == "pending",
        )
        .order_by(Account.id.desc())
        .all()
    )

    return masters


@router.get("/masters/approved", response_model=list[MasterProfileResponse])
def get_approved_masters(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    masters = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(
            Account.role == "master",
            Account.verification_status == "approved",
        )
        .order_by(Account.id.desc())
        .all()
    )

    return masters


@router.put("/masters/{master_id}/approve", response_model=MasterProfileResponse)
def approve_master_by_admin(
    master_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    master = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    if not master.id_card_front_path:
        raise HTTPException(
            status_code=400,
            detail="Не загружена лицевая сторона удостоверения",
        )

    if not master.id_card_back_path:
        raise HTTPException(
            status_code=400,
            detail="Не загружена обратная сторона удостоверения",
        )

    if not master.selfie_photo_path:
        raise HTTPException(
            status_code=400,
            detail="Не загружено фото лица",
        )

    master.verification_status = "approved"

    db.commit()
    db.refresh(master)

    return master


@router.put("/masters/{master_id}/reject", response_model=MasterProfileResponse)
def reject_master_by_admin(
    master_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    master = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    master.verification_status = "pending"

    db.commit()
    db.refresh(master)

    return master


@router.get("/orders/with-reports", response_model=list[OrderResponse])
def get_orders_with_reports(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.master_id.isnot(None))
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        if not order.report_photos:
            continue

        result.append(
            build_order_response(
                order=order,
                reviewed=is_order_reviewed(order.id, db),
            )
        )

    return result


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_by_admin(
    order_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    return build_order_response(
        order=order,
        reviewed=is_order_reviewed(order.id, db),
    )


@router.get("/complaints", response_model=list[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    complaints = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.user),
            joinedload(Complaint.order),
        )
        .order_by(Complaint.created_at.desc(), Complaint.id.desc())
        .all()
    )

    return [build_complaint_response(item) for item in complaints]


@router.put("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.user),
            joinedload(Complaint.order),
        )
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")

    normalized_status = (payload.status or "").strip()

    if normalized_status not in ALLOWED_COMPLAINT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый статус жалобы",
        )

    complaint.status = normalized_status
    db.commit()
    db.refresh(complaint)

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.user),
            joinedload(Complaint.order),
        )
        .filter(Complaint.id == complaint_id)
        .first()
    )

    return build_complaint_response(complaint)


@router.get(
    "/withdrawals",
    response_model=list[MasterWithdrawalRequestResponse],
)
def get_withdrawal_requests(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    items = (
        db.query(MasterWithdrawalRequest)
        .order_by(
            MasterWithdrawalRequest.created_at.desc(),
            MasterWithdrawalRequest.id.desc(),
        )
        .all()
    )

    return [serialize_withdrawal_request(item) for item in items]


@router.put(
    "/withdrawals/{withdrawal_id}/status",
    response_model=MasterWithdrawalRequestResponse,
)
def update_withdrawal_status(
    withdrawal_id: int,
    payload: WithdrawalStatusUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    withdrawal = (
        db.query(MasterWithdrawalRequest)
        .filter(MasterWithdrawalRequest.id == withdrawal_id)
        .first()
    )

    if not withdrawal:
        raise HTTPException(
            status_code=404,
            detail="Заявка на вывод не найдена",
        )

    next_status = (payload.status or "").strip()

    if next_status not in ALLOWED_WITHDRAWAL_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый статус заявки на вывод",
        )

    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Можно обработать только заявку со статусом pending",
        )

    master = (
        db.query(Account)
        .filter(Account.id == withdrawal.master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")

    amount_value = parse_amount_to_int(withdrawal.amount)

    if next_status == "approved":
        current_balance = parse_amount_to_int(master.balance_amount)

        if amount_value > current_balance:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно средств на общем балансе мастера",
            )

        master.balance_amount = str(current_balance - amount_value)

    elif next_status == "rejected":
        current_available = parse_amount_to_int(master.available_withdraw_amount)
        master.available_withdraw_amount = str(current_available + amount_value)

    withdrawal.status = next_status

    db.commit()
    db.refresh(withdrawal)

    return serialize_withdrawal_request(withdrawal)