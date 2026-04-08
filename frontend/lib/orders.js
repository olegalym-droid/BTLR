import { getStoredAuthUser } from "./auth";

const API_BASE_URL = "http://127.0.0.1:8000";

export const getStatusLabel = (status) => {
  const statusMap = {
    searching: "Ищем мастера",
    assigned: "Мастер назначен",
    on_the_way: "Мастер едет",
    on_site: "Мастер на месте",
    completed: "Работа выполнена",
    paid: "Оплачено",
  };

  return statusMap[status] || status;
};

export const loadOrdersRequest = async () => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    return [];
  }

  const res = await fetch(`${API_BASE_URL}/orders?user_id=${authUser.id}`);

  if (!res.ok) {
    throw new Error("Не удалось загрузить заявки");
  }

  return res.json();
};

export const createOrderRequest = async ({
  category,
  serviceName,
  description,
  address,
  selectedDate,
  selectedTime,
  photos = [],
}) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const scheduledAt = `${selectedDate} ${selectedTime}`;
  const formData = new FormData();

  formData.append("user_id", String(authUser.id));
  formData.append("category", category);
  formData.append("service_name", serviceName);
  formData.append("description", description);
  formData.append("address", address);
  formData.append("scheduled_at", scheduledAt);

  if (Array.isArray(photos)) {
    photos.forEach((photo) => {
      if (photo instanceof File) {
        formData.append("photos", photo, photo.name);
      }
    });
  }


  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось создать заявку");
  }

  return data;
};

export const updateOrderStatusRequest = async ({ orderId, status }) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/status?status=${status}&user_id=${authUser.id}`,
    {
      method: "PUT",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось обновить статус");
  }

  return data;
};