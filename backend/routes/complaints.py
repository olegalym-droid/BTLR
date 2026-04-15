from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Complaint, Order, Account
from schemas import ComplaintCreateRequest, ComplaintResponse

router = APIRouter(prefix="/complaints", tags=["complaints"])

MAX_COMPLAINT_LENGTH = 1000


@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(Account)
        .filter(Account.id == payload.user_id, Account.role == "user")
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    order = (
        db.query(Order)
        .filter(Order.id == payload.order_id, Order.user_id == payload.user_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Заказ не найден или не принадлежит пользователю",
        )

    text = (payload.text or "").strip()

    if not text:
        raise HTTPException(status_code=400, detail="Опишите проблему")

    if len(text) > MAX_COMPLAINT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Жалоба не должна быть длиннее {MAX_COMPLAINT_LENGTH} символов",
        )

    complaint = Complaint(
        order_id=payload.order_id,
        user_id=payload.user_id,
        text=text,
        status="new",
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return complaint