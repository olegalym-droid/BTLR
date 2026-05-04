from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlalchemy.orm import Session

from auth_dependencies import get_current_account, require_role
from database import get_db
from models import Account
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
def get_orders(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return get_orders_for_user(user.id, db)


@router.get("/orders/available", response_model=list[OrderResponse])
def get_available_orders(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    master = require_role(current_account, "master")
    return get_available_orders_for_master(master.id, db)


@router.get("/orders/master", response_model=list[OrderResponse])
def get_master_orders(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    master = require_role(current_account, "master")
    return get_orders_for_master(master.id, db)


@router.put("/orders/{order_id}/assign", response_model=OrderResponse)
def assign_order_to_master(
    order_id: int,
    offered_price: str | None = None,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    master = require_role(current_account, "master")
    return assign_order_to_master_service(
        order_id=order_id,
        master_id=master.id,
        offered_price=offered_price,
        db=db,
    )


@router.put("/orders/{order_id}/confirm-master", response_model=OrderResponse)
def confirm_master_for_order(
    order_id: int,
    offer_id: int,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return confirm_master_for_order_service(
        order_id=order_id,
        user_id=user.id,
        offer_id=offer_id,
        db=db,
    )


@router.put("/orders/{order_id}/reject-master", response_model=OrderResponse)
def reject_master_for_order(
    order_id: int,
    offer_id: int,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return reject_master_for_order_service(
        order_id=order_id,
        user_id=user.id,
        offer_id=offer_id,
        db=db,
    )


@router.put("/orders/{order_id}/master-status", response_model=OrderResponse)
def update_order_status_by_master(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    master = require_role(current_account, "master")
    return update_order_status_by_master_service(
        order_id=order_id,
        status=status,
        master_id=master.id,
        db=db,
    )


@router.put("/orders/{order_id}/report", response_model=OrderResponse)
async def upload_order_report(
    order_id: int,
    photos: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    master = require_role(current_account, "master")
    return await upload_order_report_by_master_service(
        order_id=order_id,
        master_id=master.id,
        photos=photos,
        db=db,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return get_single_order_for_user(order_id, user.id, db)


@router.post("/orders", response_model=OrderResponse)
async def create_order(
    category: str = Form(...),
    service_name: str = Form(...),
    description: str = Form(...),
    address: str = Form(...),
    scheduled_at: str = Form(...),
    client_price: str = Form(...),
    photos: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return await create_order_service(
        user_id=user.id,
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
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
):
    user = require_role(current_account, "user")
    return update_order_status_by_user_service(
        order_id=order_id,
        status=status,
        user_id=user.id,
        db=db,
    )
