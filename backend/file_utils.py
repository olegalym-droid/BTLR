from pathlib import Path
from uuid import uuid4


ORDERS_UPLOADS_DIR = Path("uploads/orders")


async def save_order_photos(photos, order_id, db, OrderPhoto):
    saved_photos = []

    if not photos:
        return saved_photos

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