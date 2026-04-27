import os
from datetime import datetime, time
from hmac import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from complaint_constants import (
    ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES,
    ALLOWED_COMPLAINT_RESOLUTIONS,
    ALLOWED_COMPLAINT_STATUSES,
    FINAL_COMPLAINT_STATUSES,
    RESOLUTION_STATUS_MAP,
    get_complaint_reason_label,
    get_complaint_resolution_label,
    get_complaint_status_label,
)
from models import (
    Account,
    Order,
    OrderResponseOffer,
    Complaint,
    ComplaintHistory,
    MasterWithdrawalRequest,
    MasterSchedule,
    Review,
    Notification,
)
from schemas import (
    MasterProfileResponse,
    OrderResponse,
    ComplaintResponse,
    ComplaintHistoryResponse,
    ComplaintOrderInfoResponse,
    MasterWithdrawalRequestResponse,
)
from routes.orders_helpers import build_order_response, is_order_reviewed
from payment_ledger import (
    get_order_payout_amount,
    refund_order_payout_to_client,
    release_order_payout_to_master,
)

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_WITHDRAWAL_STATUSES = {"pending", "approved", "rejected"}
ALLOWED_ACCOUNT_ROLES = {"user", "master"}
ALLOWED_ORDER_STATUSES = {
    "searching",
    "pending_user_confirmation",
    "assigned",
    "on_the_way",
    "on_site",
    "completed",
    "paid",
}


class AdminLoginRequest(BaseModel):
    login: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=128)


class ComplaintStatusUpdateRequest(BaseModel):
    status: str | None = Field(default=None, max_length=32)
    resolution: str | None = Field(default=None, max_length=64)
    admin_comment: str | None = Field(default=None, max_length=1000)


class WithdrawalStatusUpdateRequest(BaseModel):
    status: str = Field(..., min_length=1, max_length=32)


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

    is_login_valid = compare_digest(x_admin_login or "", admin_login)
    is_password_valid = compare_digest(x_admin_password or "", admin_password)

    if not is_login_valid or not is_password_valid:
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
    payment_blocked = (
        complaint.payment_blocked
        and complaint.status in ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES
    )

    if complaint.order is not None:
        order_info = ComplaintOrderInfoResponse(
            id=complaint.order.id,
            user_id=complaint.order.user_id,
            master_id=complaint.order.master_id,
            service_name=complaint.order.service_name,
            category=complaint.order.category,
            status=complaint.order.status,
            payout_status=complaint.order.payout_status,
            payment_status=(
                "blocked"
                if payment_blocked
                else "paid"
                if complaint.order.status == "paid"
                else "available"
            ),
            payment_blocked=payment_blocked,
            price=complaint.order.price,
            client_price=complaint.order.client_price,
            master_name=complaint.order.master_name,
            user_phone=complaint.order.user.phone if complaint.order.user else None,
            master_phone=complaint.order.master.phone if complaint.order.master else None,
            created_at=(
                complaint.order.created_at.isoformat()
                if complaint.order.created_at
                else None
            ),
        )

    return ComplaintResponse(
        id=complaint.id,
        order_id=complaint.order_id,
        user_id=complaint.user_id,
        reason=complaint.reason or "other",
        reason_label=get_complaint_reason_label(complaint.reason),
        text=complaint.text,
        status=complaint.status,
        status_label=get_complaint_status_label(complaint.status),
        resolution=complaint.resolution,
        resolution_label=get_complaint_resolution_label(complaint.resolution),
        admin_comment=complaint.admin_comment,
        payment_blocked=payment_blocked,
        user_name=complaint.user.full_name if complaint.user else None,
        created_at=complaint.created_at.isoformat() if complaint.created_at else None,
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else None,
        resolved_at=complaint.resolved_at.isoformat() if complaint.resolved_at else None,
        order=order_info,
        history=[
            ComplaintHistoryResponse(
                id=item.id,
                status=item.status,
                status_label=get_complaint_status_label(item.status),
                resolution=item.resolution,
                resolution_label=get_complaint_resolution_label(item.resolution),
                comment=item.comment,
                actor=item.actor,
                created_at=item.created_at.isoformat() if item.created_at else None,
            )
            for item in (complaint.history or [])
        ],
    )


def serialize_withdrawal_request(
    item: MasterWithdrawalRequest,
) -> MasterWithdrawalRequestResponse:
    card_number = item.card_number or ""

    return MasterWithdrawalRequestResponse(
        id=item.id,
        master_id=item.master_id,
        amount=item.amount,
        masked_card_number=mask_card_number(card_number),
        card_brand=detect_card_brand(card_number),
        card_holder_name=item.card_holder_name,
        status=item.status,
        created_at=item.created_at.isoformat() if item.created_at else "",
    )


def parse_iso_date_start(value: str | None) -> datetime | None:
    raw_value = (value or "").strip()
    if not raw_value:
        return None

    try:
        parsed_date = datetime.strptime(raw_value, "%Y-%m-%d").date()
        return datetime.combine(parsed_date, time.min)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="date_from должен быть в формате YYYY-MM-DD",
        )


def parse_iso_date_end(value: str | None) -> datetime | None:
    raw_value = (value or "").strip()
    if not raw_value:
        return None

    try:
        parsed_date = datetime.strptime(raw_value, "%Y-%m-%d").date()
        return datetime.combine(parsed_date, time.max)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="date_to должен быть в формате YYYY-MM-DD",
        )


def serialize_schedule_item(item: MasterSchedule) -> dict:
    return {
        "id": item.id,
        "weekday": item.weekday,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "created_at": item.created_at.isoformat() if item.created_at else "",
    }


def serialize_account_search_item(account: Account) -> dict:
    categories = [
        item.category_name
        for item in (account.master_categories or [])
    ]

    return {
        "id": account.id,
        "role": account.role,
        "phone": account.phone,
        "full_name": account.full_name,
        "avatar_path": account.avatar_path,
        "verification_status": account.verification_status,
        "rating": account.rating,
        "completed_orders_count": account.completed_orders_count,
        "work_city": account.work_city,
        "work_district": account.work_district,
        "categories": categories,
        "balance_amount": account.balance_amount,
        "available_withdraw_amount": account.available_withdraw_amount,
        "frozen_balance_amount": account.frozen_balance_amount,
    }


def build_account_orders_query(
    account: Account,
    db: Session,
):
    query = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
            joinedload(Order.photos),
            joinedload(Order.report_photos),
            joinedload(Order.offers).joinedload(OrderResponseOffer.master),
        )
        .order_by(Order.created_at.desc(), Order.id.desc())
    )

    if account.role == "user":
        query = query.filter(Order.user_id == account.id)
    else:
        query = query.filter(
            or_(
                Order.master_id == account.id,
                Order.id.in_(
                    db.query(OrderResponseOffer.order_id).filter(
                        OrderResponseOffer.master_id == account.id
                    )
                ),
            )
        )

    return query


def apply_order_filters(
    query,
    *,
    order_status: str | None,
    date_from: datetime | None,
    date_to: datetime | None,
):
    normalized_status = (order_status or "").strip()

    if normalized_status:
        if normalized_status not in ALLOWED_ORDER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Недопустимый статус заказа",
            )

        query = query.filter(Order.status == normalized_status)

    if date_from is not None:
        query = query.filter(Order.created_at >= date_from)

    if date_to is not None:
        query = query.filter(Order.created_at <= date_to)

    return query


def count_orders_by_status(
    account: Account,
    db: Session,
    *,
    date_from: datetime | None,
    date_to: datetime | None,
) -> dict:
    result = {status: 0 for status in ALLOWED_ORDER_STATUSES}

    query = build_account_orders_query(account, db)
    query = apply_order_filters(
        query,
        order_status=None,
        date_from=date_from,
        date_to=date_to,
    )

    orders = query.all()

    for order in orders:
        if order.status in result:
            result[order.status] += 1

    return result


def serialize_account_details(
    account: Account,
    db: Session,
    *,
    order_status: str | None,
    date_from: datetime | None,
    date_to: datetime | None,
) -> dict:
    account_data = serialize_account_search_item(account)

    orders_query = build_account_orders_query(account, db)
    orders_query = apply_order_filters(
        orders_query,
        order_status=order_status,
        date_from=date_from,
        date_to=date_to,
    )

    orders = orders_query.all()

    serialized_orders = [
        build_order_response(
            order=order,
            reviewed=is_order_reviewed(order.id, db),
        )
        for order in orders
    ]

    reviews_query = db.query(Review)

    if account.role == "user":
        reviews = (
            reviews_query
            .filter(Review.user_id == account.id)
            .order_by(Review.created_at.desc(), Review.id.desc())
            .all()
        )
    else:
        reviews = (
            reviews_query
            .filter(Review.master_id == account.id)
            .order_by(Review.created_at.desc(), Review.id.desc())
            .all()
        )

    complaints = []
    complaint_query = db.query(Complaint).options(
        joinedload(Complaint.user),
        joinedload(Complaint.order).joinedload(Order.user),
        joinedload(Complaint.order).joinedload(Order.master),
        joinedload(Complaint.history),
    )

    if account.role == "user":
        complaint_items = (
            complaint_query
            .filter(Complaint.user_id == account.id)
            .order_by(Complaint.created_at.desc(), Complaint.id.desc())
            .all()
        )
    else:
        complaint_items = (
            complaint_query
            .join(Order, Complaint.order_id == Order.id)
            .filter(Order.master_id == account.id)
            .order_by(Complaint.created_at.desc(), Complaint.id.desc())
            .all()
        )

    complaints = [build_complaint_response(item) for item in complaint_items]

    withdrawal_requests = []
    schedules = []

    if account.role == "master":
        withdrawal_items = (
            db.query(MasterWithdrawalRequest)
            .filter(MasterWithdrawalRequest.master_id == account.id)
            .order_by(
                MasterWithdrawalRequest.created_at.desc(),
                MasterWithdrawalRequest.id.desc(),
            )
            .all()
        )
        withdrawal_requests = [
            serialize_withdrawal_request(item)
            for item in withdrawal_items
        ]

        schedule_items = (
            db.query(MasterSchedule)
            .filter(MasterSchedule.master_id == account.id)
            .order_by(MasterSchedule.weekday.asc(), MasterSchedule.start_time.asc())
            .all()
        )
        schedules = [serialize_schedule_item(item) for item in schedule_items]

    categories = [
        item.category_name
        for item in (account.master_categories or [])
    ]

    order_counts = count_orders_by_status(
        account,
        db,
        date_from=date_from,
        date_to=date_to,
    )

    return {
        "account": {
            **account_data,
            "about_me": account.about_me,
            "experience_years": account.experience_years,
            "face_photo_path": account.face_photo_path,
            "id_card_front_path": account.id_card_front_path,
            "id_card_back_path": account.id_card_back_path,
            "selfie_photo_path": account.selfie_photo_path,
            "categories": categories,
            "created_context": {
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "order_status": (order_status or "").strip() or None,
            },
        },
        "stats": {
            "orders_total": len(serialized_orders),
            "order_counts_by_status": order_counts,
            "reviews_total": len(reviews),
            "complaints_total": len(complaints),
            "withdrawals_total": len(withdrawal_requests),
            "schedules_total": len(schedules),
        },
        "orders": serialized_orders,
        "reviews": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "master_id": item.master_id,
                "user_id": item.user_id,
                "rating": item.rating,
                "comment": item.comment,
                "created_at": item.created_at.isoformat() if item.created_at else "",
            }
            for item in reviews
        ],
        "complaints": complaints,
        "withdrawals": withdrawal_requests,
        "schedule": schedules,
    }


def create_complaint_status_notifications(
    complaint: Complaint,
    next_status: str,
) -> list[Notification]:
    if not complaint.user_id:
        return []

    status_text_map = {
        "new": "Жалоба зарегистрирована",
        "in_progress": "Жалоба принята в работу",
        "needs_details": "Администратор запросил детали",
        "resolved": "Жалоба решена",
        "rejected": "Жалоба отклонена",
    }

    reason_text = get_complaint_reason_label(complaint.reason)
    resolution_text = get_complaint_resolution_label(complaint.resolution)
    comment_text = (
        f" Комментарий администратора: {complaint.admin_comment}"
        if complaint.admin_comment
        else ""
    )
    resolution_part = f" Решение: {resolution_text}." if resolution_text else ""

    user_message = (
        f"Статус спора по заказу #{complaint.order_id} обновлён: "
        f"{get_complaint_status_label(next_status)}. "
        f"Причина: {reason_text}.{resolution_part}{comment_text}"
    )
    master_message = (
        f"По заказу #{complaint.order_id} обновлён спор: "
        f"{get_complaint_status_label(next_status)}. "
        f"Причина: {reason_text}.{resolution_part}{comment_text}"
    )

    notifications = [
        Notification(
            user_id=complaint.user_id,
            order_id=complaint.order_id,
            type="complaint_status_changed",
            title=status_text_map.get(next_status, "Статус жалобы обновлён"),
            message=user_message,
            is_read=False,
        )
    ]

    if complaint.order and complaint.order.master_id:
        notifications.append(
            Notification(
                user_id=complaint.order.master_id,
                order_id=complaint.order_id,
                type="complaint_status_changed_for_master",
                title=status_text_map.get(next_status, "Статус спора обновлён"),
                message=master_message,
                is_read=False,
            )
        )

    return notifications


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
            joinedload(Complaint.order).joinedload(Order.user),
            joinedload(Complaint.order).joinedload(Order.master),
            joinedload(Complaint.history),
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
            joinedload(Complaint.order).joinedload(Order.user),
            joinedload(Complaint.order).joinedload(Order.master),
            joinedload(Complaint.history),
        )
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(status_code=404, detail="Жалоба не найдена")

    normalized_status = (payload.status or "").strip()
    normalized_resolution = (payload.resolution or "").strip()
    normalized_comment = (payload.admin_comment or "").strip()

    if normalized_resolution:
        if normalized_resolution not in ALLOWED_COMPLAINT_RESOLUTIONS:
            raise HTTPException(
                status_code=400,
                detail="Недопустимое решение по жалобе",
            )

        inferred_status = RESOLUTION_STATUS_MAP[normalized_resolution]
        if normalized_status and normalized_status != inferred_status:
            raise HTTPException(
                status_code=400,
                detail="Статус не совпадает с выбранным решением",
            )

        normalized_status = inferred_status

    if not normalized_status:
        raise HTTPException(
            status_code=400,
            detail="Укажите новый статус или решение по спору",
        )

    if normalized_status not in ALLOWED_COMPLAINT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый статус жалобы",
        )

    old_status = complaint.status
    old_resolution = complaint.resolution
    old_comment = complaint.admin_comment
    now = datetime.utcnow()

    complaint.status = normalized_status
    complaint.resolution = normalized_resolution or None

    if payload.admin_comment is not None:
        complaint.admin_comment = normalized_comment or None

    complaint.updated_at = now

    if normalized_status in FINAL_COMPLAINT_STATUSES:
        if complaint.order and complaint.order.master:
            payout_amount = get_order_payout_amount(complaint.order)

            if normalized_resolution == "client_favor":
                refund_order_payout_to_client(
                    complaint.order,
                    complaint.order.master,
                    payout_amount,
                )
            elif complaint.order.status == "paid" and (
                normalized_resolution in {"master_favor", "rejected"}
                or normalized_status in {"resolved", "rejected"}
            ):
                release_order_payout_to_master(
                    complaint.order,
                    complaint.order.master,
                    payout_amount,
                )

        complaint.payment_blocked = False
        complaint.resolved_at = now
    elif normalized_status in ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES:
        complaint.payment_blocked = complaint.order.status != "paid" if complaint.order else True
        complaint.resolved_at = None
    else:
        complaint.payment_blocked = False

    has_changes = (
        old_status != normalized_status
        or old_resolution != complaint.resolution
        or old_comment != complaint.admin_comment
    )

    if has_changes:
        db.add(
            ComplaintHistory(
                complaint_id=complaint.id,
                actor="admin",
                status=normalized_status,
                resolution=complaint.resolution,
                comment=complaint.admin_comment,
                created_at=now,
            )
        )

        for notification in create_complaint_status_notifications(
            complaint,
            normalized_status,
        ):
            db.add(notification)

    db.commit()
    db.refresh(complaint)

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.user),
            joinedload(Complaint.order).joinedload(Order.user),
            joinedload(Complaint.order).joinedload(Order.master),
            joinedload(Complaint.history),
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


@router.get("/accounts/search")
def search_accounts(
    q: str = Query(default=""),
    role: str = Query(default=""),
    verification_status: str = Query(default=""),
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    normalized_role = (role or "").strip()
    normalized_status = (verification_status or "").strip()
    normalized_q = (q or "").strip()

    if normalized_role and normalized_role not in ALLOWED_ACCOUNT_ROLES:
        raise HTTPException(
            status_code=400,
            detail="role должен быть user или master",
        )

    query = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .order_by(Account.id.desc())
    )

    if normalized_role:
        query = query.filter(Account.role == normalized_role)

    if normalized_status:
        query = query.filter(Account.verification_status == normalized_status)

    if normalized_q:
        conditions = [
            Account.phone.ilike(f"%{normalized_q}%"),
            Account.full_name.ilike(f"%{normalized_q}%"),
        ]

        if normalized_q.isdigit():
            conditions.append(Account.id == int(normalized_q))

        query = query.filter(or_(*conditions))

    accounts = query.limit(100).all()

    return {
        "items": [serialize_account_search_item(account) for account in accounts],
        "total": len(accounts),
    }


@router.get("/accounts/{account_id}")
def get_account_details(
    account_id: int,
    order_status: str = Query(default=""),
    date_from: str = Query(default=""),
    date_to: str = Query(default=""),
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    parsed_date_from = parse_iso_date_start(date_from)
    parsed_date_to = parse_iso_date_end(date_to)

    if parsed_date_from and parsed_date_to and parsed_date_from > parsed_date_to:
        raise HTTPException(
            status_code=400,
            detail="date_from не может быть позже date_to",
        )

    account = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == account_id)
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")

    return serialize_account_details(
        account,
        db,
        order_status=order_status,
        date_from=parsed_date_from,
        date_to=parsed_date_to,
    )
