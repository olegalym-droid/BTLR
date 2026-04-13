from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Account
from schemas import MasterProfileResponse

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "123456"


class AdminLoginRequest(BaseModel):
    login: str
    password: str


def verify_admin(
    x_admin_login: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
):
    if x_admin_login != ADMIN_LOGIN or x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Неверные данные администратора")


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