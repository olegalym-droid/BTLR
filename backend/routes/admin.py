from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Account, Order, OrderResponseOffer, Complaint
from schemas import (
    MasterProfileResponse,
    OrderResponse,
    ComplaintResponse,
    ComplaintOrderInfoResponse,
)
from routes.orders_helpers import build_order_response, is_order_reviewed

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "123456"

ALLOWED_COMPLAINT_STATUSES = {"new", "in_progress", "resolved", "rejected"}


class AdminLoginRequest(BaseModel):
    login: str
    password: str


class ComplaintStatusUpdateRequest(BaseModel):
    status: str


def verify_admin(
    x_admin_login: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
):
    if x_admin_login != ADMIN_LOGIN or x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Неверные данные администратора")


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


@router.post("/login")
def admin_login(payload: AdminLoginRequest):
    if payload.login != ADMIN_LOGIN or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

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
        raise HTTPException(status_code=400, detail="Недопустимый статус жалобы")

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