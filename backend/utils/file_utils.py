from pathlib import Path
from uuid import uuid4


ORDERS_UPLOADS_DIR = Path("uploads/orders")
MASTER_DOCS_UPLOADS_DIR = Path("uploads/master_docs")


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