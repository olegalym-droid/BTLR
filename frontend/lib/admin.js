import { API_BASE_URL } from "./constants";

export const getAdminHeaders = (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const storedLogin =
    adminLoginArg || localStorage.getItem("admin_login") || "";
  const storedPassword =
    adminPasswordArg || localStorage.getItem("admin_password") || "";

  return {
    "X-Admin-Login": storedLogin,
    "X-Admin-Password": storedPassword,
  };
};

export const adminLoginRequest = async ({ login, password }) => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Ошибка входа администратора");
  }

  return data;
};

export const loadPendingMastersRequest = async (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const response = await fetch(`${API_BASE_URL}/admin/masters/pending`, {
    headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить мастеров");
  }

  return Array.isArray(data) ? data : [];
};

export const loadComplaintsRequest = async (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const response = await fetch(`${API_BASE_URL}/admin/complaints`, {
    headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить жалобы");
  }

  return Array.isArray(data) ? data : [];
};

export const approveMasterRequest = async (masterId) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/masters/${masterId}/approve`,
    {
      method: "PUT",
      headers: getAdminHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось одобрить мастера");
  }

  return data;
};

export const updateComplaintStatusRequest = async ({
  complaintId,
  status,
}) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/complaints/${complaintId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ status }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось обновить статус жалобы");
  }

  return data;
};

export const loadAdminOrderRequest = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
    headers: getAdminHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить заказ");
  }

  return data;
};