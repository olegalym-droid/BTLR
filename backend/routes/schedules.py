from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Account, MasterSchedule

router = APIRouter(prefix="/masters", tags=["master-schedules"])


class MasterScheduleItemRequest(BaseModel):
    weekday: int
    start_time: str
    end_time: str


class MasterScheduleItemResponse(BaseModel):
    id: int
    weekday: int
    start_time: str
    end_time: str

    class Config:
        from_attributes = True


def get_master_or_404(master_id: int, db: Session) -> Account:
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")

    return master


@router.get(
    "/{master_id}/schedule",
    response_model=list[MasterScheduleItemResponse],
)
def get_master_schedule(
    master_id: int,
    db: Session = Depends(get_db),
):
    get_master_or_404(master_id, db)

    schedule = (
        db.query(MasterSchedule)
        .filter(MasterSchedule.master_id == master_id)
        .order_by(MasterSchedule.weekday.asc(), MasterSchedule.start_time.asc())
        .all()
    )

    return schedule


@router.put(
    "/{master_id}/schedule",
    response_model=list[MasterScheduleItemResponse],
)
def save_master_schedule(
    master_id: int,
    payload: list[MasterScheduleItemRequest],
    db: Session = Depends(get_db),
):
    get_master_or_404(master_id, db)

    for item in payload:
        if item.weekday < 0 or item.weekday > 6:
            raise HTTPException(
                status_code=400,
                detail="День недели должен быть от 0 до 6",
            )

        start_time = (item.start_time or "").strip()
        end_time = (item.end_time or "").strip()

        if not start_time or not end_time:
            raise HTTPException(
                status_code=400,
                detail="Укажите время начала и конца",
            )

        if len(start_time) != 5 or len(end_time) != 5:
            raise HTTPException(
                status_code=400,
                detail="Время должно быть в формате HH:MM",
            )

        if start_time >= end_time:
            raise HTTPException(
                status_code=400,
                detail="Время окончания должно быть позже времени начала",
            )

    (
        db.query(MasterSchedule)
        .filter(MasterSchedule.master_id == master_id)
        .delete()
    )

    for item in payload:
        db.add(
            MasterSchedule(
                master_id=master_id,
                weekday=item.weekday,
                start_time=item.start_time.strip(),
                end_time=item.end_time.strip(),
            )
        )

    db.commit()

    updated_schedule = (
        db.query(MasterSchedule)
        .filter(MasterSchedule.master_id == master_id)
        .order_by(MasterSchedule.weekday.asc(), MasterSchedule.start_time.asc())
        .all()
    )

    return updated_schedule