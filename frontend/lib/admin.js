import { API_BASE_URL } from "./constants";

const getStoredAdminValue = (key, fallback = "") => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) {
    return sessionValue;
  }

  return window.localStorage.getItem(key) || fallback;
};

export const getAdminHeaders = (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const storedLogin =
    adminLoginArg ?? getStoredAdminValue("admin_login", "");
  const storedPassword =
    adminPasswordArg ?? getStoredAdminValue("admin_password", "");

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

export const loadAdminOverviewRequest = async (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const response = await fetch(`${API_BASE_URL}/admin/overview`, {
    headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить сводку админки");
  }

  return data && typeof data === "object" ? data : {};
};

export const loadAdminActionLogsRequest = async (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const response = await fetch(`${API_BASE_URL}/admin/action-logs`, {
    headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить журнал админки");
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

export const loadWithdrawalRequestsRequest = async (
  adminLoginArg = null,
  adminPasswordArg = null,
) => {
  const response = await fetch(`${API_BASE_URL}/admin/withdrawals`, {
    headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить заявки на вывод");
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
  resolution = "",
  adminComment = "",
}) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/complaints/${complaintId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({
        status,
        resolution,
        admin_comment: adminComment,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось обновить статус жалобы");
  }

  return data;
};

export const updateWithdrawalStatusRequest = async ({
  withdrawalId,
  status,
}) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/withdrawals/${withdrawalId}/status`,
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
    throw new Error(
      data.detail || "Не удалось обновить статус заявки на вывод",
    );
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
