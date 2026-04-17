import { getStoredAuthUser } from "./auth";
import { API_BASE_URL } from "./constants";

export const ORDER_STATUSES = {
  SEARCHING: "searching",
  PENDING_USER_CONFIRMATION: "pending_user_confirmation",
  ASSIGNED: "assigned",
  ON_THE_WAY: "on_the_way",
  ON_SITE: "on_site",
  COMPLETED: "completed",
  PAID: "paid",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.SEARCHING]: "Ищем мастера",
  [ORDER_STATUSES.PENDING_USER_CONFIRMATION]: "Ожидает вашего решения",
  [ORDER_STATUSES.ASSIGNED]: "Мастер назначен",
  [ORDER_STATUSES.ON_THE_WAY]: "Мастер едет",
  [ORDER_STATUSES.ON_SITE]: "Мастер на месте",
  [ORDER_STATUSES.COMPLETED]: "Работа выполнена",
  [ORDER_STATUSES.PAID]: "Оплачено",
};

export const ORDER_PROGRESS_STEPS = [
  { key: ORDER_STATUSES.SEARCHING, label: "Поиск" },
  { key: ORDER_STATUSES.PENDING_USER_CONFIRMATION, label: "Выбор" },
  { key: ORDER_STATUSES.ASSIGNED, label: "Назначен" },
  { key: ORDER_STATUSES.ON_THE_WAY, label: "Едет" },
  { key: ORDER_STATUSES.ON_SITE, label: "На месте" },
  { key: ORDER_STATUSES.COMPLETED, label: "Готово" },
  { key: ORDER_STATUSES.PAID, label: "Оплачено" },
];

export const USER_ACTIVE_ORDER_STATUSES = [
  ORDER_STATUSES.SEARCHING,
  ORDER_STATUSES.PENDING_USER_CONFIRMATION,
  ORDER_STATUSES.ASSIGNED,
  ORDER_STATUSES.ON_THE_WAY,
  ORDER_STATUSES.ON_SITE,
];

export const USER_DONE_ORDER_STATUSES = [
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.PAID,
];

export const MASTER_ACTIVE_ORDER_STATUSES = [
  ORDER_STATUSES.ASSIGNED,
  ORDER_STATUSES.ON_THE_WAY,
  ORDER_STATUSES.ON_SITE,
];

export const MASTER_DONE_ORDER_STATUSES = [
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.PAID,
];

export const MIN_ORDER_PRICE = 100;
export const MAX_ORDER_PRICE = 10_000_000;
export const MIN_OFFER_PRICE = 100;
export const MAX_OFFER_PRICE = 10_000_000;

export const getStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const parsePriceToNumber = (value) => {
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

export const formatPriceInput = (value) => {
  const amount = parsePriceToNumber(value);
  return amount ? amount.toLocaleString("ru-RU") : "";
};

export const normalizePriceForRequest = (value) => {
  const amount = parsePriceToNumber(value);
  return amount ? String(amount) : "";
};

export const validatePriceRange = ({
  value,
  min,
  max,
  emptyMessage,
}) => {
  const amount = parsePriceToNumber(value);

  if (!amount) {
    throw new Error(emptyMessage);
  }

  if (amount < min) {
    throw new Error(`Минимальная цена — ${min} ₸`);
  }

  if (amount > max) {
    throw new Error(`Максимальная цена — ${max} ₸`);
  }

  return String(amount);
};

export const loadOrdersRequest = async () => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    return [];
  }

  const res = await fetch(`${API_BASE_URL}/orders?user_id=${authUser.id}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить заявки");
  }

  return data;
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

export const assignOrderToMasterRequest = async (
  orderId,
  masterId,
  offeredPrice = "",
) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const params = new URLSearchParams({
    master_id: String(resolvedMasterId),
  });

  const normalizedOfferedPrice = String(offeredPrice || "").trim();

  if (normalizedOfferedPrice) {
    const validatedPrice = validatePriceRange({
      value: normalizedOfferedPrice,
      min: MIN_OFFER_PRICE,
      max: MAX_OFFER_PRICE,
      emptyMessage: "Укажите цену отклика",
    });

    params.set("offered_price", validatedPrice);
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/assign?${params.toString()}`,
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

export const uploadOrderReportRequest = async ({
  orderId,
  masterId,
  photos = [],
}) => {
  const resolvedMasterId = masterId || getStoredAuthUser()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const validPhotos = Array.isArray(photos)
    ? photos.filter((photo) => photo instanceof File)
    : [];

  if (validPhotos.length === 0) {
    throw new Error("Выберите хотя бы одно фото отчёта");
  }

  const formData = new FormData();
  formData.append("master_id", String(resolvedMasterId));

  validPhotos.forEach((photo) => {
    formData.append("photos", photo, photo.name);
  });

  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/report`, {
    method: "PUT",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить фото-отчёт");
  }

  return data;
};

export const createOrderRequest = async ({
  category,
  serviceName,
  description,
  clientPrice,
  address,
  selectedDate,
  selectedTime,
  photos = [],
}) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const normalizedClientPrice = validatePriceRange({
    value: clientPrice,
    min: MIN_ORDER_PRICE,
    max: MAX_ORDER_PRICE,
    emptyMessage: "Укажите вашу цену",
  });

  const scheduledAt = `${selectedDate} ${selectedTime}`;
  const formData = new FormData();

  formData.append("user_id", String(authUser.id));
  formData.append("category", category);
  formData.append("service_name", serviceName);
  formData.append("description", description);
  formData.append("client_price", normalizedClientPrice);
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

export const confirmMasterForOrderRequest = async ({ orderId, offerId }) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/confirm-master?user_id=${authUser.id}&offer_id=${offerId}`,
    {
      method: "PUT",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось выбрать мастера");
  }

  return data;
};

export const rejectMasterForOrderRequest = async ({ orderId, offerId }) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/reject-master?user_id=${authUser.id}&offer_id=${offerId}`,
    {
      method: "PUT",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось отклонить мастера");
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

export const createComplaintRequest = async ({ orderId, text }) => {
  const authUser = getStoredAuthUser();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  if (!text || !text.trim()) {
    throw new Error("Опишите проблему");
  }

  const res = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      user_id: authUser.id,
      text: text.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось отправить жалобу");
  }

  return data;
};