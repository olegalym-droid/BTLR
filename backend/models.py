from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False, index=True)  # user | master
    phone = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)

    avatar_path = Column(String, nullable=True)
    face_photo_path = Column(String, nullable=True)
    about_me = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    work_city = Column(String, nullable=True)
    work_district = Column(String, nullable=True)
    verification_status = Column(String, nullable=False, default="pending")
    rating = Column(Float, nullable=False, default=0.0)
    completed_orders_count = Column(Integer, nullable=False, default=0)
    id_card_front_path = Column(String, nullable=True)
    id_card_back_path = Column(String, nullable=True)
    selfie_photo_path = Column(String, nullable=True)

    orders = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Order.user_id",
    )

    master_categories = relationship(
        "MasterCategory",
        back_populates="master",
        cascade="all, delete-orphan",
    )

    taken_orders = relationship(
        "Order",
        back_populates="master",
        foreign_keys="Order.master_id",
    )

    order_responses = relationship(
        "OrderResponseOffer",
        back_populates="master",
        cascade="all, delete-orphan",
        foreign_keys="OrderResponseOffer.master_id",
    )

    order_report_photos = relationship(
        "OrderReportPhoto",
        back_populates="master",
        cascade="all, delete-orphan",
        foreign_keys="OrderReportPhoto.master_id",
    )

    complaints = relationship(
        "Complaint",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Complaint.user_id",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Notification.user_id",
    )


class MasterCategory(Base):
    __tablename__ = "master_categories"

    id = Column(Integer, primary_key=True, index=True)
    master_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    category_name = Column(String, nullable=False)

    master = relationship("Account", back_populates="master_categories")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    master_id = Column(Integer, ForeignKey("accounts.id"), nullable=True, index=True)

    category = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    address = Column(String, nullable=False)
    scheduled_at = Column(String, nullable=False)

    status = Column(String, nullable=False, default="searching")
    master_name = Column(String, nullable=True)
    master_rating = Column(Float, nullable=True)
    price = Column(String, nullable=True)
    client_price = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship(
        "Account",
        back_populates="orders",
        foreign_keys=[user_id],
    )

    master = relationship(
        "Account",
        back_populates="taken_orders",
        foreign_keys=[master_id],
    )

    photos = relationship(
        "OrderPhoto",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    report_photos = relationship(
        "OrderReportPhoto",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    offers = relationship(
        "OrderResponseOffer",
        back_populates="order",
        cascade="all, delete-orphan",
        foreign_keys="OrderResponseOffer.order_id",
    )

    complaints = relationship(
        "Complaint",
        back_populates="order",
        cascade="all, delete-orphan",
        foreign_keys="Complaint.order_id",
    )

    notifications = relationship(
        "Notification",
        back_populates="order",
        cascade="all, delete-orphan",
        foreign_keys="Notification.order_id",
    )


class OrderResponseOffer(Base):
    __tablename__ = "order_response_offers"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    master_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="pending")
    offered_price = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="offers", foreign_keys=[order_id])
    master = relationship("Account", back_populates="order_responses", foreign_keys=[master_id])


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="photos")


class OrderReportPhoto(Base):
    __tablename__ = "order_report_photos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    master_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="report_photos")
    master = relationship(
        "Account",
        back_populates="order_report_photos",
        foreign_keys=[master_id],
    )


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(Integer, ForeignKey("orders.id"))
    master_id = Column(Integer, ForeignKey("accounts.id"))
    user_id = Column(Integer, ForeignKey("accounts.id"))

    rating = Column(Integer)  # 1–5
    comment = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    text = Column(String, nullable=False)
    status = Column(String, nullable=False, default="new")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="complaints", foreign_keys=[order_id])
    user = relationship("Account", back_populates="complaints", foreign_keys=[user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("Account", back_populates="notifications", foreign_keys=[user_id])
    order = relationship("Order", back_populates="notifications", foreign_keys=[order_id])

class MasterSchedule(Base):
    __tablename__ = "master_schedules"

    id = Column(Integer, primary_key=True, index=True)
    master_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)

    # день недели: 0 = понедельник, 6 = воскресенье
    weekday = Column(Integer, nullable=False)

    # время в формате "09:00"
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    master = relationship("Account")