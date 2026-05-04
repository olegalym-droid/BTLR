import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
TOKEN_TTL_HOURS = 24 * 14


def _get_token_secret() -> bytes:
    secret = os.getenv("AUTH_SECRET_KEY", "").strip()

    if not secret:
        secret = os.getenv("ADMIN_PASSWORD", "").strip() or "butler-dev-secret"

    return secret.encode("utf-8")


def _b64encode(raw_value: bytes) -> str:
    return base64.urlsafe_b64encode(raw_value).rstrip(b"=").decode("ascii")


def _b64decode(raw_value: str) -> bytes:
    padding = "=" * (-len(raw_value) % 4)
    return base64.urlsafe_b64decode((raw_value + padding).encode("ascii"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(*, account_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(account_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=TOKEN_TTL_HOURS)).timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}

    encoded_header = _b64encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8"),
    )
    encoded_payload = _b64encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8"),
    )
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        _get_token_secret(),
        signing_input,
        hashlib.sha256,
    ).digest()

    return f"{encoded_header}.{encoded_payload}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError:
        raise HTTPException(status_code=401, detail="Некорректный токен")

    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_signature = hmac.new(
        _get_token_secret(),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        provided_signature = _b64decode(encoded_signature)
    except Exception:
        raise HTTPException(status_code=401, detail="Некорректный токен")

    if not hmac.compare_digest(provided_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Некорректный токен")

    try:
        payload = json.loads(_b64decode(encoded_payload).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=401, detail="Некорректный токен")

    expires_at = int(payload.get("exp") or 0)
    now_ts = int(datetime.now(timezone.utc).timestamp())

    if expires_at <= now_ts:
        raise HTTPException(status_code=401, detail="Сессия истекла")

    return payload
