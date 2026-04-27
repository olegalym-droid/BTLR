from typing import Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    role: str = Field(..., pattern="^(user|master)$")
    phone: str
    password: str
    full_name: str | None = None
    categories: Optional[list[str]] = None


class LoginRequest(BaseModel):
    role: str = Field(..., pattern="^(user|master)$")
    phone: str
    password: str


class AuthResponse(BaseModel):
    id: int
    role: str
    phone: str
    full_name: str | None = None


class OrderPhotoResponse(BaseModel):
    id: int
    file_path: str

    class Config:
        from_attributes = True


class OrderReportPhotoResponse(BaseModel):
    id: int
    file_path: str

    class Config:
        from_attributes = True


class OrderCreateRequest(BaseModel):
    user_id: int
    category: str
    service_name: str
    description: str
    address: str
    scheduled_at: str
    client_price: str | None = None


class MasterCategoryResponse(BaseModel):
    id: int
    category_name: str

    class Config:
        from_attributes = True


class MasterProfileResponse(BaseModel):
    id: int
    role: str
    phone: str
    full_name: str | None = None

    avatar_path: str | None = None
    face_photo_path: str | None = None
    id_card_front_path: str | None = None
    id_card_back_path: str | None = None
    selfie_photo_path: str | None = None

    about_me: str | None = None
    experience_years: int | None = None

    work_city: str | None = None
    work_district: str | None = None

    verification_status: str
    rating: float
    completed_orders_count: int
    balance_amount: str | None = None
    available_withdraw_amount: str | None = None
    frozen_balance_amount: str | None = None

    master_categories: list[MasterCategoryResponse] = []

    class Config:
        from_attributes = True


class OfferMasterResponse(BaseModel):
    id: int
    full_name: str | None = None
    about_me: str | None = None
    experience_years: int | None = None
    rating: float
    avatar_path: str | None = None
    selfie_photo_path: str | None = None

    class Config:
        from_attributes = True


class OrderOfferResponse(BaseModel):
    id: int
    status: str
    offered_price: str | None = None
    master: OfferMasterResponse

    class Config:
        from_attributes = True


class ComplaintHistoryResponse(BaseModel):
    id: int
    status: str
    status_label: str | None = None
    resolution: str | None = None
    resolution_label: str | None = None
    comment: str | None = None
    actor: str
    created_at: str | None = None

    class Config:
        from_attributes = True


class ComplaintSummaryResponse(BaseModel):
    id: int
    order_id: int
    reason: str
    reason_label: str
    text: str
    status: str
    status_label: str
    resolution: str | None = None
    resolution_label: str | None = None
    admin_comment: str | None = None
    payment_blocked: bool = False
    created_at: str | None = None
    updated_at: str | None = None
    resolved_at: str | None = None
    history: list[ComplaintHistoryResponse] = []

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    master_id: int | None = None
    category: str
    service_name: str
    description: str
    address: str
    scheduled_at: str
    status: str
    master_name: str | None = None
    master_rating: float | None = None
    master_phone: str | None = None
    user_phone: str | None = None
    price: str | None = None
    client_price: str | None = None
    payout_status: str | None = None
    reviewed: bool = False
    offers: list[OrderOfferResponse] = []
    photos: list[OrderPhotoResponse] = []
    report_photos: list[OrderReportPhotoResponse] = []
    complaints: list[ComplaintSummaryResponse] = []
    active_payment_blocking_complaint: bool = False

    class Config:
        from_attributes = True


class ComplaintCreateRequest(BaseModel):
    order_id: int
    user_id: int
    reason: str
    text: str


class ComplaintOrderInfoResponse(BaseModel):
    id: int
    user_id: int
    master_id: int | None = None
    service_name: str
    category: str
    status: str
    payout_status: str | None = None
    payment_status: str
    payment_blocked: bool = False
    price: str | None = None
    client_price: str | None = None
    master_name: str | None = None
    user_phone: str | None = None
    master_phone: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True


class ComplaintResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    reason: str
    reason_label: str
    text: str
    status: str
    status_label: str | None = None
    resolution: str | None = None
    resolution_label: str | None = None
    admin_comment: str | None = None
    payment_blocked: bool = False
    user_name: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    resolved_at: str | None = None
    order: ComplaintOrderInfoResponse | None = None
    history: list[ComplaintHistoryResponse] = []

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    order_id: int | None = None
    type: str
    title: str
    message: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


class MasterBalanceResponse(BaseModel):
    master_id: int
    balance_amount: str
    available_withdraw_amount: str
    frozen_balance_amount: str = "0"


class MasterWithdrawalRequestCreate(BaseModel):
    amount: str
    card_number: str
    card_holder_name: str


class MasterWithdrawalRequestResponse(BaseModel):
    id: int
    master_id: int
    amount: str
    masked_card_number: str | None = None
    card_brand: str | None = None
    card_holder_name: str
    status: str
    created_at: str

    class Config:
        from_attributes = True
