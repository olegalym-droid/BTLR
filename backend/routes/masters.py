from fastapi import APIRouter, HTTPException, Depends, Form
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Account
from schemas import MasterProfileResponse

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