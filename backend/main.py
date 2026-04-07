from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
import random


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orders = []

masters = [
    {"id": "1", "name": "Алексей", "rating": 4.8},
    {"id": "2", "name": "Владимир", "rating": 4.7},
    {"id": "3", "name": "Сергей", "rating": 4.9},
]


class OrderCreate(BaseModel):
    category: str
    service_name: str
    description: str
    address: str
    scheduled_at: str


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/orders")
def get_orders():
    return orders


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    for order in orders:
        if order["id"] == order_id:
            return order
    raise HTTPException(status_code=404, detail="Order not found")


@app.post("/orders")
def create_order(order: OrderCreate):
    assigned_master = random.choice(masters)

    new_order = {
        "id": str(uuid4()),
        "category": order.category,
        "service_name": order.service_name,
        "description": order.description,
        "address": order.address,
        "scheduled_at": order.scheduled_at,
        "status": "assigned",
        "master_name": assigned_master["name"],
        "master_rating": assigned_master["rating"],
        "price": None,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    orders.append(new_order)
    return new_order


@app.put("/orders/{order_id}/status")
def update_order_status(order_id: str, status: str):
    allowed_statuses = [
        "searching",
        "assigned",
        "on_the_way",
        "on_site",
        "completed",
        "paid",
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid status",
                "allowed_statuses": allowed_statuses
            }
        )

    for order in orders:
        if order["id"] == order_id:
            order["status"] = status
            return order

    raise HTTPException(status_code=404, detail="Order not found")


@app.get("/masters")
def get_masters():
    return masters