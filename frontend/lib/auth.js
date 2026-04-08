const API_BASE_URL = "http://127.0.0.1:8000";

export const getStoredAuth = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const isAuth = localStorage.getItem("isAuth") === "true";
  const authUser = localStorage.getItem("auth_user");

  return isAuth && !!authUser;
};

export const registerRequest = async ({
  role,
  phone,
  password,
  fullName = "",
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      phone,
      password,
      full_name: fullName || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Ошибка регистрации");
  }

  return data;
};

export const loginRequest = async ({ role, phone, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      phone,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Ошибка входа");
  }

  return data;
};

export const saveAuthData = ({ id, role, phone, full_name }) => {
  localStorage.setItem("isAuth", "true");
  localStorage.setItem(
    "auth_user",
    JSON.stringify({
      id,
      role,
      phone,
      fullName: full_name || "",
    }),
  );

  localStorage.setItem(
    "resident_profile",
    JSON.stringify({
      name: full_name || "",
      phone: phone || "",
      addresses: [],
      primaryAddressIndex: 0,
    }),
  );
};

export const clearAuthData = () => {
  localStorage.removeItem("isAuth");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("resident_profile");
};

export const getStoredAuthUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Ошибка чтения auth_user:", error);
    return null;
  }
};