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


class OrderCreateRequest(BaseModel):
    user_id: int
    category: str
    service_name: str
    description: str
    address: str
    scheduled_at: str


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
    price: str | None = None
    reviewed: bool = False
    photos: list[OrderPhotoResponse] = []

    class Config:
        from_attributes = True


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

    master_categories: list[MasterCategoryResponse] = []

    class Config:
        from_attributes = True