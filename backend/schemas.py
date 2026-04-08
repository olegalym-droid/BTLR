from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    role: str = Field(..., pattern="^(user|master)$")
    phone: str
    password: str
    full_name: str | None = None


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
    category: str
    service_name: str
    description: str
    address: str
    scheduled_at: str
    status: str
    master_name: str | None = None
    master_rating: float | None = None
    price: str | None = None
    photos: list[OrderPhotoResponse] = []

    class Config:
        from_attributes = True