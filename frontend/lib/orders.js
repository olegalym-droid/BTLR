import { getStoredAuthUser } from "./auth";

const API_BASE_URL = "http://127.0.0.1:8000";

export const getStatusLabel = (status) => {
  const statusMap = {
    searching: "Ищем мастера",
    pending_user_confirmation: "Ожидает вашего решения",
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

export const loadAvailableOrdersRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/available?master_id=${resolvedMasterId}`,
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить доступные заказы");
  }

  return data;
};

export const loadMasterOrdersRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/master?master_id=${resolvedMasterId}`,
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить заказы мастера");
  }

  return data;
};

export const assignOrderToMasterRequest = async (orderId, masterId) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/assign?master_id=${resolvedMasterId}`,
    {
      method: "PUT",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось взять заказ");
  }

  return data;
};

export const updateOrderStatusByMasterRequest = async ({
  orderId,
  status,
  masterId,
}) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/master-status?status=${status}&master_id=${resolvedMasterId}`,
    {
      method: "PUT",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось обновить статус заказа");
  }

  return data;
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

export const createReviewRequest = async ({
  orderId,
  rating,
  comment = "",
}) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const params = new URLSearchParams({
    order_id: String(orderId),
    rating: String(rating),
    user_id: String(authUser.id),
    comment,
  });

  const res = await fetch(`${API_BASE_URL}/reviews?${params.toString()}`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось отправить отзыв");
  }

  return data;
};
