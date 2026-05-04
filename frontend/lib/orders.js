import { getAuthHeaders, getStoredAuthUser } from "./auth";
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

export const COMPLAINT_REASONS = [
  { value: "master_no_show", label: "Мастер не приехал" },
  { value: "late_arrival", label: "Мастер опоздал" },
  { value: "poor_quality", label: "Плохое качество работы" },
  { value: "rude_behavior", label: "Грубое поведение" },
  { value: "price_changed", label: "Цена изменилась" },
  { value: "property_damage", label: "Повреждение имущества" },
  { value: "other", label: "Другое" },
];

export const PAYMENT_BLOCKING_COMPLAINT_STATUSES = [
  "new",
  "in_progress",
  "needs_details",
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

export const formatPublicOrderCode = (orderId) => {
  const raw = Number(orderId);

  if (!Number.isFinite(raw) || raw <= 0) {
    return "BT-UNKNOWN";
  }

  const mixed = raw * 7919 + 12345;
  const base36 = mixed.toString(36).toUpperCase().padStart(6, "0");

  return `BT-${base36.slice(0, 6)}`;
};

const getStoredUserAuth = () => getStoredAuthUser("user");
const getStoredMasterAuth = () => getStoredAuthUser("master");

export const loadOrdersRequest = async () => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    return [];
  }

  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders("user"),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить заявки");
  }

  return data;
};

export const loadUserOrderRequest = async (orderId) => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}`,
    {
      headers: getAuthHeaders("user"),
    },
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить заказ");
  }

  return data;
};

export const loadAvailableOrdersRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(`${API_BASE_URL}/orders/available`, {
    headers: getAuthHeaders("master"),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось загрузить доступные заказы");
  }

  return data;
};

export const loadMasterOrdersRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(`${API_BASE_URL}/orders/master`, {
    headers: getAuthHeaders("master"),
  });

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
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const params = new URLSearchParams();

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
      headers: getAuthHeaders("master"),
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
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/master-status?status=${status}`,
    {
      method: "PUT",
      headers: getAuthHeaders("master"),
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
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

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

  validPhotos.forEach((photo) => {
    formData.append("photos", photo, photo.name);
  });

  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/report`, {
    method: "PUT",
    headers: getAuthHeaders("master"),
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
  const authUser = getStoredUserAuth();

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
    headers: getAuthHeaders("user"),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось создать заявку");
  }

  return data;
};

export const updateOrderStatusRequest = async ({ orderId, status }) => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const res = await fetch(
    `${API_BASE_URL}/orders/${orderId}/status?status=${status}`,
    {
      method: "PUT",
      headers: getAuthHeaders("user"),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось обновить статус");
  }

  return data;
};

export const confirmMasterForOrderRequest = async ({ orderId, offerId }) => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/confirm-master?offer_id=${offerId}`,
    {
      method: "PUT",
      headers: getAuthHeaders("user"),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось выбрать мастера");
  }

  return data;
};

export const rejectMasterForOrderRequest = async ({ orderId, offerId }) => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/reject-master?offer_id=${offerId}`,
    {
      method: "PUT",
      headers: getAuthHeaders("user"),
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
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  const params = new URLSearchParams({
    order_id: String(orderId),
    rating: String(rating),
    comment,
  });

  const res = await fetch(`${API_BASE_URL}/reviews?${params.toString()}`, {
    method: "POST",
    headers: getAuthHeaders("user"),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось отправить отзыв");
  }

  return data;
};

export const createComplaintRequest = async ({ orderId, reason, text }) => {
  const authUser = getStoredUserAuth();

  if (!authUser?.id) {
    throw new Error("Пользователь не авторизован");
  }

  if (!reason) {
    throw new Error("Выберите причину жалобы");
  }

  if (!text || !text.trim()) {
    throw new Error("Опишите проблему");
  }

  const res = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders("user"),
    },
    body: JSON.stringify({
      order_id: orderId,
      reason,
      text: text.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Не удалось отправить жалобу");
  }

  return data;
};
