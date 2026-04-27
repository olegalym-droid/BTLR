from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException

BASE_DIR = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BASE_DIR / "uploads"
ORDERS_UPLOADS_DIR = UPLOADS_DIR / "orders"
MASTER_DOCS_UPLOADS_DIR = UPLOADS_DIR / "master_docs"
ORDER_REPORTS_UPLOADS_DIR = UPLOADS_DIR / "order_reports"

ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def get_safe_image_suffix(filename: str) -> str:
    suffix = Path(filename).suffix.lower() or ".jpg"

    if suffix not in ALLOWED_IMAGE_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail="Можно загружать только изображения JPG, PNG или WEBP",
        )

    return suffix


async def read_validated_upload_file(file) -> bytes:
    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Файл слишком большой. Максимальный размер: 5 МБ",
        )

    return content


async def save_order_photos(photos, order_id, db, OrderPhoto):
    saved_photos = []

    if not photos:
        return saved_photos

    ORDERS_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    for photo in photos:
        if not photo.filename:
            continue

        suffix = get_safe_image_suffix(photo.filename)
        filename = f"{uuid4()}{suffix}"
        file_path = ORDERS_UPLOADS_DIR / filename

        content = await read_validated_upload_file(photo)
        file_path.write_bytes(content)

        order_photo = OrderPhoto(
            order_id=order_id,
            file_path=f"uploads/orders/{filename}",
        )

        db.add(order_photo)
        saved_photos.append(order_photo)

    db.commit()

    return saved_photos


# 🔥 НОВОЕ: сохранение фото-отчёта мастера
async def save_order_report_photos(photos, order_id, master_id, db, OrderReportPhoto):
    saved_photos = []

    if not photos:
        return saved_photos

    ORDER_REPORTS_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    for photo in photos:
        if not photo.filename:
            continue

        suffix = get_safe_image_suffix(photo.filename)
        filename = f"order_{order_id}_master_{master_id}_{uuid4()}{suffix}"
        file_path = ORDER_REPORTS_UPLOADS_DIR / filename

        content = await read_validated_upload_file(photo)
        file_path.write_bytes(content)

        report_photo = OrderReportPhoto(
            order_id=order_id,
            master_id=master_id,
            file_path=f"uploads/order_reports/{filename}",
        )

        db.add(report_photo)
        saved_photos.append(report_photo)

    db.commit()

    return saved_photos


async def save_master_document(file, prefix: str) -> str | None:
    if not file or not file.filename:
        return None

    MASTER_DOCS_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    suffix = get_safe_image_suffix(file.filename)
    filename = f"{prefix}_{uuid4()}{suffix}"
    file_path = MASTER_DOCS_UPLOADS_DIR / filename

    content = await read_validated_upload_file(file)
    file_path.write_bytes(content)

    return f"uploads/master_docs/{filename}"
