from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Account
from security import decode_access_token


def get_current_account(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Account:
    scheme, _, token = (authorization or "").partition(" ")

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Требуется авторизация")

    payload = decode_access_token(token)

    try:
        account_id = int(payload.get("sub") or 0)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Некорректный токен")

    account = db.query(Account).filter(Account.id == account_id).first()

    if not account:
        raise HTTPException(status_code=401, detail="Аккаунт не найден")

    if account.role != payload.get("role"):
        raise HTTPException(status_code=401, detail="Некорректная роль")

    return account


def require_role(account: Account, role: str) -> Account:
    if account.role != role:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    return account
