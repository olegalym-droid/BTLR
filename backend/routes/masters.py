from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Account
from schemas import MasterProfileResponse
from utils.file_utils import save_master_document

router = APIRouter(tags=["masters"])


def get_master_or_404(master_id: int, db: Session):
    master = (
        db.query(Account)
        .options(joinedload(Account.master_categories))
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Master not found")

    return master


@router.get("/masters/{master_id}", response_model=MasterProfileResponse)
def get_master_profile(master_id: int, db: Session = Depends(get_db)):
    return get_master_or_404(master_id, db)


@router.put("/masters/{master_id}/profile", response_model=MasterProfileResponse)
def update_master_profile(
    master_id: int,
    full_name: str = Form(...),
    about_me: str = Form(""),
    experience_years: int | None = Form(None),
    work_city: str = Form(""),
    work_district: str = Form(""),
    db: Session = Depends(get_db),
):
    master = get_master_or_404(master_id, db)

    master.full_name = full_name
    master.about_me = about_me or None
    master.experience_years = experience_years
    master.work_city = work_city or None
    master.work_district = work_district or None

    db.commit()
    db.refresh(master)

    return master


@router.put("/masters/{master_id}/documents", response_model=MasterProfileResponse)
async def upload_master_documents(
    master_id: int,
    id_card_front: UploadFile | None = File(default=None),
    id_card_back: UploadFile | None = File(default=None),
    selfie_photo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    master = get_master_or_404(master_id, db)

    front_path = await save_master_document(id_card_front, "id_front")
    back_path = await save_master_document(id_card_back, "id_back")
    selfie_path = await save_master_document(selfie_photo, "selfie")

    if front_path:
        master.id_card_front_path = front_path

    if back_path:
        master.id_card_back_path = back_path

    if selfie_path:
        master.selfie_photo_path = selfie_path

    db.commit()
    db.refresh(master)

    return master


@router.put("/masters/{master_id}/approve", response_model=MasterProfileResponse)
def approve_master_profile(master_id: int, db: Session = Depends(get_db)):
    master = get_master_or_404(master_id, db)

    if not master.id_card_front_path:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите лицевую сторону удостоверения",
        )

    if not master.id_card_back_path:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите обратную сторону удостоверения",
        )

    if not master.selfie_photo_path:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите фото лица",
        )

    master.verification_status = "approved"

    db.commit()
    db.refresh(master)

    return master