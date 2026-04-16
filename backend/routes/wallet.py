from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Account, MasterWithdrawalRequest
from schemas import (
    MasterBalanceResponse,
    MasterWithdrawalRequestCreate,
    MasterWithdrawalRequestResponse,
)

router = APIRouter(prefix="/masters", tags=["wallet"])


def get_master_or_404(master_id: int, db: Session) -> Account:
    master = (
        db.query(Account)
        .filter(Account.id == master_id, Account.role == "master")
        .first()
    )

    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")

    return master


def normalize_amount(raw_value: str) -> str:
    normalized = (raw_value or "").strip()

    if not normalized:
        raise HTTPException(status_code=400, detail="Укажите сумму")

    cleaned = (
        normalized
        .replace("₸", "")
        .replace(" ", "")
        .replace(",", "")
    )

    if not cleaned.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Сумма должна содержать только цифры",
        )

    amount = int(cleaned)

    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Сумма должна быть больше нуля",
        )

    if amount > 100000000:
        raise HTTPException(
            status_code=400,
            detail="Сумма слишком большая",
        )

    return str(amount)


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


def serialize_withdrawal_request(
    item: MasterWithdrawalRequest,
) -> MasterWithdrawalRequestResponse:
    return MasterWithdrawalRequestResponse(
        id=item.id,
        master_id=item.master_id,
        amount=item.amount,
        card_number=item.card_number,
        card_holder_name=item.card_holder_name,
        status=item.status,
        created_at=item.created_at.isoformat() if item.created_at else "",
    )


@router.get(
    "/{master_id}/balance",
    response_model=MasterBalanceResponse,
)
def get_master_balance(
    master_id: int,
    db: Session = Depends(get_db),
):
    master = get_master_or_404(master_id, db)

    return MasterBalanceResponse(
        master_id=master.id,
        balance_amount=master.balance_amount or "0",
        available_withdraw_amount=master.available_withdraw_amount or "0",
    )


@router.get(
    "/{master_id}/withdrawals",
    response_model=list[MasterWithdrawalRequestResponse],
)
def get_master_withdrawals(
    master_id: int,
    db: Session = Depends(get_db),
):
    get_master_or_404(master_id, db)

    items = (
        db.query(MasterWithdrawalRequest)
        .filter(MasterWithdrawalRequest.master_id == master_id)
        .order_by(
            MasterWithdrawalRequest.created_at.desc(),
            MasterWithdrawalRequest.id.desc(),
        )
        .all()
    )

    return [serialize_withdrawal_request(item) for item in items]


@router.post(
    "/{master_id}/withdrawals",
    response_model=MasterWithdrawalRequestResponse,
)
def create_master_withdrawal(
    master_id: int,
    payload: MasterWithdrawalRequestCreate,
    db: Session = Depends(get_db),
):
    master = get_master_or_404(master_id, db)

    normalized_amount = normalize_amount(payload.amount)
    amount_value = parse_amount_to_int(normalized_amount)
    available_value = parse_amount_to_int(master.available_withdraw_amount)

    card_number = (payload.card_number or "").strip()
    card_holder_name = (payload.card_holder_name or "").strip()

    if not card_number:
        raise HTTPException(
            status_code=400,
            detail="Укажите номер карты",
        )

    if len(card_number.replace(" ", "")) < 8:
        raise HTTPException(
            status_code=400,
            detail="Некорректный номер карты",
        )

    if not card_holder_name:
        raise HTTPException(
            status_code=400,
            detail="Укажите имя владельца карты",
        )

    if amount_value > available_value:
        raise HTTPException(
            status_code=400,
            detail="Недостаточно доступных средств для вывода",
        )

    new_item = MasterWithdrawalRequest(
        master_id=master.id,
        amount=normalized_amount,
        card_number=card_number,
        card_holder_name=card_holder_name,
        status="pending",
        created_at=datetime.utcnow(),
    )

    master.available_withdraw_amount = str(available_value - amount_value)

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return serialize_withdrawal_request(new_item)