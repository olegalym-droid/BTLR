from pathlib import Path
from uuid import uuid4


ORDERS_UPLOADS_DIR = Path("uploads/orders")
MASTER_DOCS_UPLOADS_DIR = Path("uploads/master_docs")
ORDER_REPORTS_UPLOADS_DIR = Path("uploads/order_reports")


async def save_order_photos(photos, order_id, db, OrderPhoto):
    saved_photos = []

    if not photos:
        return saved_photos

    ORDERS_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    for photo in photos:
        if not photo.filename:
            continue

        suffix = Path(photo.filename).suffix or ".jpg"
        filename = f"{uuid4()}{suffix}"
        file_path = ORDERS_UPLOADS_DIR / filename

        content = await photo.read()
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

        suffix = Path(photo.filename).suffix or ".jpg"
        filename = f"order_{order_id}_master_{master_id}_{uuid4()}{suffix}"
        file_path = ORDER_REPORTS_UPLOADS_DIR / filename

        content = await photo.read()
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

    suffix = Path(file.filename).suffix or ".jpg"
    filename = f"{prefix}_{uuid4()}{suffix}"
    file_path = MASTER_DOCS_UPLOADS_DIR / filename

    content = await file.read()
    file_path.write_bytes(content)

    return f"uploads/master_docs/{filename}"