from typing import Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    role: str = Field(..., pattern="^(user|master)$")
    phone: str = Field(..., min_length=6, max_length=32)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=100)
    categories: Optional[list[str]] = None


class LoginRequest(BaseModel):
    role: str = Field(..., pattern="^(user|master)$")
    phone: str = Field(..., min_length=6, max_length=32)
    password: str = Field(..., min_length=1, max_length=128)


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
    user_id: int = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=80)
    service_name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(..., min_length=1, max_length=2000)
    address: str = Field(..., min_length=1, max_length=300)
    scheduled_at: str = Field(..., min_length=1, max_length=80)
    client_price: str | None = Field(default=None, max_length=32)


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

    master_categories: list[MasterCategoryResponse] = Field(default_factory=list)

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
    history: list[ComplaintHistoryResponse] = Field(default_factory=list)

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
    offers: list[OrderOfferResponse] = Field(default_factory=list)
    photos: list[OrderPhotoResponse] = Field(default_factory=list)
    report_photos: list[OrderReportPhotoResponse] = Field(default_factory=list)
    complaints: list[ComplaintSummaryResponse] = Field(default_factory=list)
    active_payment_blocking_complaint: bool = False

    class Config:
        from_attributes = True


class ComplaintCreateRequest(BaseModel):
    order_id: int = Field(..., gt=0)
    user_id: int = Field(..., gt=0)
    reason: str = Field(..., min_length=1, max_length=64)
    text: str = Field(..., min_length=1, max_length=2000)


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
    history: list[ComplaintHistoryResponse] = Field(default_factory=list)

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
    amount: str = Field(..., min_length=1, max_length=32)
    card_number: str = Field(..., min_length=12, max_length=32)
    card_holder_name: str = Field(..., min_length=2, max_length=100)


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


class ChatStartRequest(BaseModel):
    sender_role: str = Field(..., pattern="^(user|master)$")
    sender_id: int = Field(..., gt=0)
    conversation_type: str = Field(..., pattern="^(order|admin)$")
    order_id: int | None = Field(default=None, gt=0)


class AdminChatStartRequest(BaseModel):
    target_role: str = Field(..., pattern="^(user|master)$")
    target_account_id: int = Field(..., gt=0)


class ChatMessageCreateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    sender_role: str | None = Field(default=None, pattern="^(user|master|admin)$")
    sender_id: int | None = Field(default=None, gt=0)


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_role: str
    sender_account_id: int | None = None
    text: str
    is_own: bool = False
    created_at: str


class ChatConversationResponse(BaseModel):
    id: int
    conversation_type: str
    title: str
    subtitle: str | None = None
    order_id: int | None = None
    user_id: int | None = None
    master_id: int | None = None
    user_name: str | None = None
    user_phone: str | None = None
    master_name: str | None = None
    master_phone: str | None = None
    last_message: str | None = None
    last_message_at: str | None = None
    unread_count: int = 0
    updated_at: str
