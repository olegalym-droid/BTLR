import { useEffect, useState } from "react";
import {
  loadOrdersRequest,
  createOrderRequest,
  USER_ACTIVE_ORDER_STATUSES,
  USER_DONE_ORDER_STATUSES,
} from "../lib/orders";
import { getStoredAuthUser } from "../lib/auth";

export default function useOrders() {
  const [orders, setOrders] = useState(() => {
    const authUser = getStoredAuthUser();
    return authUser?.id && authUser.role === "user" ? [] : [];
  });

  const [orderCreated, setOrderCreated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    const authUser = getStoredAuthUser();

    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    try {
      const data = await loadOrdersRequest();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    let isMounted = true;

    const runLoadOrders = async () => {
      try {
        const data = await loadOrdersRequest();

        if (!isMounted) {
          return;
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Ошибка загрузки заявок:", error);
        setOrders([]);
      }
    };

    runLoadOrders();

    const interval = setInterval(() => {
      runLoadOrders();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const createOrder = async ({
    category,
    serviceName,
    description,
    clientPrice,
    address,
    selectedDate,
    selectedTime,
    photos,
    onSuccess,
  }) => {
    const authUser = getStoredAuthUser();

    if (!authUser?.id || authUser.role !== "user") {
      alert("Создавать заявки может только пользователь");
      return false;
    }

    if (
      !category ||
      !serviceName ||
      !description ||
      !clientPrice ||
      !address ||
      !selectedDate ||
      !selectedTime
    ) {
      alert("Пожалуйста, заполните все поля");
      return false;
    }

    try {
      await createOrderRequest({
        category,
        serviceName,
        description,
        clientPrice,
        address,
        selectedDate,
        selectedTime,
        photos,
      });

      await loadOrders();
      setOrderCreated(true);

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error("Ошибка создания заявки:", error);
      alert(error.message || "Не удалось создать заявку");
      return false;
    }
  };

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