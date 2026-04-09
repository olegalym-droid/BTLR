import { useEffect, useState } from "react";
import { loadOrdersRequest, createOrderRequest } from "../lib/orders";

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [orderCreated, setOrderCreated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      const data = await loadOrdersRequest();
      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    }
  };

  useEffect(() => {
    const runLoadOrders = async () => {
      await loadOrders();
    };

    runLoadOrders();

    const interval = setInterval(() => {
      runLoadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const createOrder = async ({
    category,
    serviceName,
    description,
    address,
    selectedDate,
    selectedTime,
    photos,
    onSuccess,
  }) => {
    if (
      !category ||
      !serviceName ||
      !description ||
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

  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "paid",
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed" || order.status === "paid",
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
