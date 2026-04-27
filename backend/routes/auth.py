from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Account, MasterCategory
from schemas import RegisterRequest, LoginRequest, AuthResponse
from security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_categories: list[str] = []
    if payload.role == "master":
        seen_categories = set()
        for raw_category in payload.categories or []:
            category = str(raw_category or "").strip()
            if category and category not in seen_categories:
                normalized_categories.append(category)
                seen_categories.add(category)

        if not normalized_categories:
            raise HTTPException(
                status_code=400,
                detail="Выберите хотя бы одну категорию",
            )

    existing_account = (
        db.query(Account)
        .filter(Account.phone == payload.phone)
        .first()
    )

    if existing_account:
        raise HTTPException(
            status_code=400,
            detail="Аккаунт с таким номером уже существует",
        )

    verification_status = "approved"
    if payload.role == "master":
        verification_status = "pending"

    account = Account(
        role=payload.role,
        phone=payload.phone,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        verification_status=verification_status,
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    if payload.role == "master":
        categories = normalized_categories

        for category in categories:
            db.add(
                MasterCategory(
                    master_id=account.id,
                    category_name=category,
                )
            )

        db.commit()

    return AuthResponse(
        id=account.id,
        role=account.role,
        phone=account.phone,
        full_name=account.full_name,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    account = (
        db.query(Account)
        .filter(Account.phone == payload.phone)
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=401,
            detail="Неверный номер или пароль",
        )

    if account.role != payload.role:
        raise HTTPException(
            status_code=401,
            detail="Неверная роль для этого аккаунта",
        )

    if not verify_password(payload.password, account.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Неверный номер или пароль",
        )

    return AuthResponse(
        id=account.id,
        role=account.role,
        phone=account.phone,
        full_name=account.full_name,
    )
