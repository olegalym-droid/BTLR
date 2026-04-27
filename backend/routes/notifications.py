from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Account, Notification
from schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


def serialize_notification(notification: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        order_id=notification.order_id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        is_read=notification.is_read,
        created_at=notification.created_at.isoformat() if notification.created_at else "",
    )


@router.get("", response_model=list[NotificationResponse])
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(Account).filter(Account.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .all()
    )

    return [serialize_notification(item) for item in notifications]


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(Account).filter(Account.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return serialize_notification(notification)
