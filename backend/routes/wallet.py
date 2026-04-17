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


def normalize_card_number(raw_value: str) -> str:
    normalized = (raw_value or "").strip()

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Укажите номер карты",
        )

    cleaned = "".join(symbol for symbol in normalized if symbol.isdigit())

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="Номер карты должен содержать цифры",
        )

    if len(cleaned) < 12 or len(cleaned) > 19:
        raise HTTPException(
            status_code=400,
            detail="Некорректный номер карты",
        )

    return cleaned


def detect_card_brand(card_number: str) -> str:
    if not card_number:
        return "unknown"

    if card_number.startswith("4"):
        return "visa"

    if len(card_number) >= 2 and 51 <= int(card_number[:2]) <= 55:
        return "mastercard"

    if len(card_number) >= 4 and 2221 <= int(card_number[:4]) <= 2720:
        return "mastercard"

    return "unknown"


def mask_card_number(card_number: str) -> str:
    if not card_number:
        return ""

    if len(card_number) <= 4:
        return card_number

    visible_last = card_number[-4:]
    masked_prefix = "*" * max(len(card_number) - 4, 0)
    combined = f"{masked_prefix}{visible_last}"

    parts = []
    for index in range(0, len(combined), 4):
        parts.append(combined[index:index + 4])

    return " ".join(parts)


def normalize_card_holder_name(raw_value: str) -> str:
    normalized = " ".join((raw_value or "").strip().split())

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Укажите имя владельца карты",
        )

    if len(normalized) < 2:
        raise HTTPException(
            status_code=400,
            detail="Слишком короткое имя владельца карты",
        )

    if len(normalized) > 100:
        raise HTTPException(
            status_code=400,
            detail="Слишком длинное имя владельца карты",
        )

    return normalized


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

    normalized_card_number = normalize_card_number(payload.card_number)
    normalized_card_holder_name = normalize_card_holder_name(
        payload.card_holder_name,
    )

    if amount_value > available_value:
        raise HTTPException(
            status_code=400,
            detail="Недостаточно доступных средств для вывода",
        )

    new_item = MasterWithdrawalRequest(
        master_id=master.id,
        amount=normalized_amount,
        card_number=normalized_card_number,
        card_holder_name=normalized_card_holder_name,
        status="pending",
        created_at=datetime.utcnow(),
    )

    master.available_withdraw_amount = str(available_value - amount_value)

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return serialize_withdrawal_request(new_item)