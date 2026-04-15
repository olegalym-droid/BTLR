import { useState } from "react";
import {
  USER_ACTIVE_ORDER_STATUSES,
  USER_DONE_ORDER_STATUSES,
} from "../lib/orders";
import useUserOrdersActions from "./useUserOrdersActions";
import useUserOrdersData from "./useUserOrdersData";

export default function useOrders() {
  const { orders, setOrders, loadOrders } = useUserOrdersData();

  const [orderCreated, setOrderCreated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { createOrder } = useUserOrdersActions({
    loadOrders,
    setOrderCreated,
  });

  const activeOrders = orders.filter((order) =>
    USER_ACTIVE_ORDER_STATUSES.includes(order.status),
  );

  const completedOrders = orders.filter((order) =>
    USER_DONE_ORDER_STATUSES.includes(order.status),
  );

  const updateSelectedOrder = (updatedOrder) => {
    setSelectedOrder({ ...updatedOrder });

    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...updatedOrder } : o)),
    );
  };

  return {
    orders,
    setOrders,
    orderCreated,
    setOrderCreated,
    selectedOrder,
    setSelectedOrder,
    loadOrders,
    createOrder,
    activeOrders,
    completedOrders,
    updateSelectedOrder,
  };
}