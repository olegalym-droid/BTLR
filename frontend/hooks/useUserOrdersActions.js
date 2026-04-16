import { createOrderRequest } from "../lib/orders";

export default function useUserOrdersActions({
  loadOrders,
  setOrderCreated,
}) {
  const createOrder = async ({
    category,
    serviceName,
    description,
    clientPrice,
    address,
    selectedDate,
    selectedTime,
    photos = [],
    onSuccess,
  }) => {
    if (!category) {
      alert("Выберите категорию");
      return false;
    }

    if (!serviceName) {
      alert("Выберите услугу");
      return false;
    }

    if (!description.trim()) {
      alert("Опишите задачу");
      return false;
    }

    if (!clientPrice.trim()) {
      alert("Укажите вашу цену");
      return false;
    }

    if (!address.trim()) {
      alert("Укажите адрес");
      return false;
    }

    if (!selectedDate) {
      alert("Выберите дату");
      return false;
    }

    if (!selectedTime) {
      alert("Выберите время");
      return false;
    }

    try {
      await createOrderRequest({
        category,
        serviceName,
        description: description.trim(),
        clientPrice: clientPrice.trim(),
        address: address.trim(),
        selectedDate,
        selectedTime,
        photos,
      });

      await loadOrders();
      setOrderCreated(true);

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error("Ошибка создания заявки:", error);
      alert(error.message || "Не удалось отправить заявку");
      return false;
    }
  };

  return {
    createOrder,
  };
}