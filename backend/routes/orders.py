from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from schemas import OrderResponse
from routes.orders_queries import (
    get_orders_for_user,
    get_available_orders_for_master,
    get_orders_for_master,
    get_single_order_for_user,
)
from routes.orders_create import create_order_service
from routes.orders_assign import assign_order_to_master_service
from routes.orders_selection import (
    confirm_master_for_order_service,
    reject_master_for_order_service,
)
from routes.orders_status import (
    update_order_status_by_master_service,
    update_order_status_by_user_service,
    upload_order_report_by_master_service,
)

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=list[OrderResponse])
def get_orders(user_id: int, db: Session = Depends(get_db)):
    return get_orders_for_user(user_id, db)


@router.get("/orders/available", response_model=list[OrderResponse])
def get_available_orders(master_id: int, db: Session = Depends(get_db)):
    return get_available_orders_for_master(master_id, db)


@router.get("/orders/master", response_model=list[OrderResponse])
def get_master_orders(master_id: int, db: Session = Depends(get_db)):
    return get_orders_for_master(master_id, db)


@router.put("/orders/{order_id}/assign", response_model=OrderResponse)
def assign_order_to_master(
    order_id: int,
    master_id: int,
    offered_price: str | None = None,
    db: Session = Depends(get_db),
):
    return assign_order_to_master_service(
        order_id=order_id,
        master_id=master_id,
        offered_price=offered_price,
        db=db,
    )


@router.put("/orders/{order_id}/confirm-master", response_model=OrderResponse)
def confirm_master_for_order(
    order_id: int,
    user_id: int,
    offer_id: int,
    db: Session = Depends(get_db),
):
    return confirm_master_for_order_service(
        order_id=order_id,
        user_id=user_id,
        offer_id=offer_id,
        db=db,
    )


@router.put("/orders/{order_id}/reject-master", response_model=OrderResponse)
def reject_master_for_order(
    order_id: int,
    user_id: int,
    offer_id: int,
    db: Session = Depends(get_db),
):
    return reject_master_for_order_service(
        order_id=order_id,
        user_id=user_id,
        offer_id=offer_id,
        db=db,
    )


@router.put("/orders/{order_id}/master-status", response_model=OrderResponse)
def update_order_status_by_master(
    order_id: int,
    status: str,
    master_id: int,
    db: Session = Depends(get_db),
):
    return update_order_status_by_master_service(
        order_id=order_id,
        status=status,
        master_id=master_id,
        db=db,
    )


@router.put("/orders/{order_id}/report", response_model=OrderResponse)
async def upload_order_report(
    order_id: int,
    master_id: int = Form(...),
    photos: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
):
    return await upload_order_report_by_master_service(
        order_id=order_id,
        master_id=master_id,
        photos=photos,
        db=db,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, user_id: int, db: Session = Depends(get_db)):
    return get_single_order_for_user(order_id, user_id, db)


@router.post("/orders", response_model=OrderResponse)
async def create_order(
    user_id: int = Form(...),
    category: str = Form(...),
    service_name: str = Form(...),
    description: str = Form(...),
    address: str = Form(...),
    scheduled_at: str = Form(...),
    client_price: str = Form(...),
    photos: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
):
    return await create_order_service(
        user_id=user_id,
        category=category,
        service_name=service_name,
        description=description,
        address=address,
        scheduled_at=scheduled_at,
        client_price=client_price,
        photos=photos,
        db=db,
    )


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    return update_order_status_by_user_service(
        order_id=order_id,
        status=status,
        user_id=user_id,
        db=db,
    )