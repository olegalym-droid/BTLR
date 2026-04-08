from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False, index=True)  # user | master
    phone = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)

    category = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    address = Column(String, nullable=False)
    scheduled_at = Column(String, nullable=False)

    status = Column(String, nullable=False, default="searching")
    master_name = Column(String, nullable=True)
    master_rating = Column(Float, nullable=True)
    price = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("Account", back_populates="orders")
    photos = relationship("OrderPhoto", back_populates="order", cascade="all, delete-orphan")


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="photos")