from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Account, Review, Order

router = APIRouter(tags=["reviews"])


def get_order_or_404(order_id: int, db: Session):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    return order


def validate_review_creation(order: Order, rating: int, user_id: int | None):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Рейтинг должен быть от 1 до 5")

    if user_id is None or order.user_id != user_id:
        raise HTTPException(status_code=403, detail="Нельзя оставить отзыв на чужой заказ")

    if order.status != "paid":
        raise HTTPException(status_code=400, detail="Можно оценить только оплаченный заказ")

    if order.master_id is None:
        raise HTTPException(status_code=400, detail="У заказа нет мастера")


def review_exists(order_id: int, db: Session) -> bool:
    return (
        db.query(Review)
        .filter(Review.order_id == order_id)
        .first()
        is not None
    )


def update_master_rating(master_id: int, db: Session):
    reviews = db.query(Review).filter(Review.master_id == master_id).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews)

    master = db.query(Account).filter(Account.id == master_id).first()
    if master:
        master.rating = round(avg_rating, 2)
        db.commit()

    return master


@router.post("/reviews")
def create_review(
    order_id: int,
    rating: int,
    comment: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    order = get_order_or_404(order_id, db)
    validate_review_creation(order, rating, user_id)

    if review_exists(order_id, db):
        raise HTTPException(status_code=400, detail="Отзыв уже оставлен")

    review = Review(
        order_id=order.id,
        master_id=order.master_id,
        user_id=user_id,
        rating=rating,
        comment=comment,
    )

    db.add(review)
    db.commit()

    master = update_master_rating(order.master_id, db)

    return {"message": "Отзыв сохранён", "rating": master.rating if master else rating}