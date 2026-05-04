from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from auth_dependencies import get_current_account, require_role
from complaint_constants import (
    ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES,
    ALLOWED_COMPLAINT_REASONS,
    get_complaint_reason_label,
    get_complaint_resolution_label,
    get_complaint_status_label,
)
from database import get_db
from models import Account, Complaint, ComplaintHistory, Notification, Order
from chat_service import add_admin_system_message, add_order_system_message
from payment_ledger import (
    PAYOUT_AVAILABLE,
    PAYOUT_FROZEN,
    freeze_paid_order_payout,
    get_order_payout_amount,
)
from schemas import (
    ComplaintCreateRequest,
    ComplaintHistoryResponse,
    ComplaintOrderInfoResponse,
    ComplaintResponse,
)

router = APIRouter(prefix="/complaints", tags=["complaints"])

MAX_COMPLAINT_LENGTH = 1000


def serialize_complaint_history(item: ComplaintHistory) -> ComplaintHistoryResponse:
    return ComplaintHistoryResponse(
        id=item.id,
        status=item.status,
        status_label=get_complaint_status_label(item.status),
        resolution=item.resolution,
        resolution_label=get_complaint_resolution_label(item.resolution),
        comment=item.comment,
        actor=item.actor,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


def serialize_complaint(complaint: Complaint) -> ComplaintResponse:
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
            master_phone=(
                complaint.order.master.phone
                if complaint.order.master
                else None
            ),
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
            serialize_complaint_history(item)
            for item in (complaint.history or [])
        ],
    )


def create_complaint_created_notifications(
    complaint: Complaint,
) -> list[Notification]:
    reason_label = get_complaint_reason_label(complaint.reason)
    notifications = [
        Notification(
            user_id=complaint.user_id,
            order_id=complaint.order_id,
            type="complaint_created",
            title="Спор по заказу открыт",
            message=(
                f"Ваш спор по заказу #{complaint.order_id} создан. "
                f"Причина: {reason_label}. Оплата временно заблокирована "
                "до решения администратора."
            ),
            is_read=False,
        )
    ]

    if complaint.order and complaint.order.master_id:
        notifications.append(
            Notification(
                user_id=complaint.order.master_id,
                order_id=complaint.order_id,
                type="complaint_created_for_master",
                title="По заказу открыт спор",
                message=(
                    f"По заказу #{complaint.order_id} открыт спор. "
                    f"Причина: {reason_label}. Ожидайте решения администратора."
                ),
                is_read=False,
            )
        )

    return notifications


@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")

    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.master),
        )
        .filter(Order.id == payload.order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Заказ не найден или не принадлежит пользователю",
        )

    reason = (payload.reason or "").strip()
    if reason not in ALLOWED_COMPLAINT_REASONS:
        raise HTTPException(status_code=400, detail="Выберите причину жалобы")

    text = (payload.text or "").strip()

    if not text:
        raise HTTPException(status_code=400, detail="Опишите проблему")

    if len(text) > MAX_COMPLAINT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Жалоба не должна быть длиннее {MAX_COMPLAINT_LENGTH} символов",
        )

    active_complaint = (
        db.query(Complaint)
        .filter(
            Complaint.order_id == order.id,
            Complaint.status.in_(ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES),
        )
        .first()
    )

    if active_complaint:
        raise HTTPException(
            status_code=400,
            detail="По этому заказу уже открыт спор",
        )

    now = datetime.utcnow()
    payment_blocked = order.status != "paid"

    if order.status == "paid" and order.master is not None:
        if order.payout_status in {PAYOUT_AVAILABLE, PAYOUT_FROZEN}:
            freeze_paid_order_payout(
                order,
                order.master,
                get_order_payout_amount(order),
            )
            payment_blocked = True

    complaint = Complaint(
        order_id=payload.order_id,
        user_id=user.id,
        reason=reason,
        text=text,
        status="new",
        payment_blocked=payment_blocked,
        created_at=now,
        updated_at=now,
    )

    db.add(complaint)
    db.flush()

    db.add(
        ComplaintHistory(
            complaint_id=complaint.id,
            actor="user",
            status="new",
            comment="Пользователь открыл спор",
            created_at=now,
        )
    )

    reason_label = get_complaint_reason_label(reason)
    system_text = (
        f"Открыт спор по заказу #{order.id}. "
        f"Причина: {reason_label}. Оплата заблокирована до решения администратора."
    )

    add_order_system_message(
        order,
        db,
        system_text,
        read_by_user=True,
        read_by_master=False,
    )
    add_admin_system_message(
        user,
        db,
        system_text,
        read_by_user=True,
        read_by_admin=False,
    )

    if order.master is not None:
        add_admin_system_message(
            order.master,
            db,
            system_text,
            read_by_master=False,
            read_by_admin=True,
        )

    for notification in create_complaint_created_notifications(complaint):
        db.add(notification)

    db.commit()

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.user),
            joinedload(Complaint.order).joinedload(Order.user),
            joinedload(Complaint.order).joinedload(Order.master),
            joinedload(Complaint.history),
        )
        .filter(Complaint.id == complaint.id)
        .first()
    )

    return serialize_complaint(complaint)
