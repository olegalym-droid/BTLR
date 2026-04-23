import { API_BASE_URL } from "./constants";

const AUTH_FLAG_KEY = "isAuth";
const AUTH_USER_KEY = "auth_user";
const REMEMBER_LOGIN_KEY = "btlr_remember_login";
const REMEMBER_LOGIN_ROLE_KEY = "btlr_remember_login_role";
const REMEMBER_ADMIN_LOGIN_KEY = "btlr_remember_admin_login";

const getRoleStorageKeys = (role) => {
  const normalizedRole = String(role || "").trim();

  if (!normalizedRole) {
    return {
      authFlagKey: AUTH_FLAG_KEY,
      authUserKey: AUTH_USER_KEY,
    };
  }

  return {
    authFlagKey: `${AUTH_FLAG_KEY}_${normalizedRole}`,
    authUserKey: `${AUTH_USER_KEY}_${normalizedRole}`,
  };
};

const readJson = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Ошибка чтения JSON:", error);
    return fallback;
  }
};

const clearRoleSession = (role) => {
  if (typeof window === "undefined") {
    return;
  }

  const { authFlagKey, authUserKey } = getRoleStorageKeys(role);

  localStorage.removeItem(authFlagKey);
  localStorage.removeItem(authUserKey);
  sessionStorage.removeItem(authFlagKey);
  sessionStorage.removeItem(authUserKey);
};

const getStoredRoleAuthUser = (role) => {
  if (typeof window === "undefined") {
    return null;
  }

  const { authUserKey } = getRoleStorageKeys(role);

  const localRaw = localStorage.getItem(authUserKey);
  if (localRaw) {
    return readJson(localRaw, null);
  }

  const sessionRaw = sessionStorage.getItem(authUserKey);
  if (sessionRaw) {
    return readJson(sessionRaw, null);
  }

  return null;
};

export const getStoredAuth = (role = "") => {
  if (typeof window === "undefined") {
    return false;
  }

  const { authFlagKey, authUserKey } = getRoleStorageKeys(role);

  const localIsAuth = localStorage.getItem(authFlagKey) === "true";
  const localAuthUser = localStorage.getItem(authUserKey);

  const sessionIsAuth = sessionStorage.getItem(authFlagKey) === "true";
  const sessionAuthUser = sessionStorage.getItem(authUserKey);

  return (localIsAuth && !!localAuthUser) || (sessionIsAuth && !!sessionAuthUser);
};

export const registerRequest = async ({
  role,
  phone,
  password,
  fullName = "",
  categories = [],
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
      categories: role === "master" ? categories : [],
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

export const saveAuthData = (
  { id, role, phone, full_name },
  rememberMe = true,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const { authFlagKey, authUserKey } = getRoleStorageKeys(role);

  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  const normalizedUser = {
    id,
    role,
    phone,
    fullName: full_name || "",
  };

  otherStorage.removeItem(authFlagKey);
  otherStorage.removeItem(authUserKey);

  targetStorage.setItem(authFlagKey, "true");
  targetStorage.setItem(authUserKey, JSON.stringify(normalizedUser));

  if (role === "user") {
    const profileKey = `resident_profile_${id}`;
    const existingProfileRaw = localStorage.getItem(profileKey);

    let shouldResetProfile = false;

    if (!existingProfileRaw) {
      shouldResetProfile = true;
    } else {
      try {
        const existingProfile = JSON.parse(existingProfileRaw);

        const savedPhone = String(existingProfile?.phone || "").trim();
        const currentPhone = String(phone || "").trim();

        if (savedPhone !== currentPhone) {
          shouldResetProfile = true;
        }
      } catch (error) {
        shouldResetProfile = true;
      }
    }

    if (shouldResetProfile) {
      localStorage.setItem(
        profileKey,
        JSON.stringify({
          name: full_name || "",
          phone: phone || "",
          addresses: [],
          primaryAddressIndex: 0,
        }),
      );
    }
  }
};

export const clearAuthData = (role = "") => {
  if (typeof window === "undefined") {
    return;
  }

  if (role) {
    clearRoleSession(role);
    return;
  }

  clearRoleSession("user");
  clearRoleSession("master");
  clearRoleSession("admin");

  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_FLAG_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredAuthUser = (role = "") => {
  if (typeof window === "undefined") {
    return null;
  }

  if (role) {
    return getStoredRoleAuthUser(role);
  }

  return (
    getStoredRoleAuthUser("user") ||
    getStoredRoleAuthUser("master") ||
    getStoredRoleAuthUser("admin") ||
    (() => {
      const localRaw = localStorage.getItem(AUTH_USER_KEY);
      if (localRaw) {
        return readJson(localRaw, null);
      }

      const sessionRaw = sessionStorage.getItem(AUTH_USER_KEY);
      if (sessionRaw) {
        return readJson(sessionRaw, null);
      }

      return null;
    })()
  );
};

export const saveRememberedLogin = ({
  role,
  phone = "",
  adminLogin = "",
  rememberMe = false,
}) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!rememberMe) {
    localStorage.removeItem(REMEMBER_LOGIN_KEY);
    localStorage.removeItem(REMEMBER_LOGIN_ROLE_KEY);
    localStorage.removeItem(REMEMBER_ADMIN_LOGIN_KEY);
    return;
  }

  if (role === "admin") {
    localStorage.setItem(REMEMBER_LOGIN_ROLE_KEY, "admin");
    localStorage.setItem(REMEMBER_ADMIN_LOGIN_KEY, adminLogin.trim());
    localStorage.removeItem(REMEMBER_LOGIN_KEY);
    return;
  }

  localStorage.setItem(REMEMBER_LOGIN_ROLE_KEY, role);
  localStorage.setItem(REMEMBER_LOGIN_KEY, phone.trim());
  localStorage.removeItem(REMEMBER_ADMIN_LOGIN_KEY);
};

export const getRememberedLogin = () => {
  if (typeof window === "undefined") {
    return {
      role: "",
      phone: "",
      adminLogin: "",
    };
  }

  return {
    role: localStorage.getItem(REMEMBER_LOGIN_ROLE_KEY) || "",
    phone: localStorage.getItem(REMEMBER_LOGIN_KEY) || "",
    adminLogin: localStorage.getItem(REMEMBER_ADMIN_LOGIN_KEY) || "",
  };
};

export const clearRememberedLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(REMEMBER_LOGIN_KEY);
  localStorage.removeItem(REMEMBER_LOGIN_ROLE_KEY);
  localStorage.removeItem(REMEMBER_ADMIN_LOGIN_KEY);
};

export const loadMasterProfileRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredAuthUser("master")?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const response = await fetch(`${API_BASE_URL}/masters/${resolvedMasterId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить профиль мастера");
  }

  return data;
};

export const updateMasterProfileRequest = async ({
  masterId,
  fullName,
  aboutMe = "",
  experienceYears = "",
  workCity = "",
}) => {
  const resolvedMasterId = masterId || getStoredAuthUser("master")?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const formData = new FormData();

  formData.append("full_name", fullName.trim());
  formData.append("about_me", aboutMe);
  formData.append(
    "experience_years",
    experienceYears === "" ? "" : String(experienceYears),
  );
  formData.append("work_city", workCity);

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/profile`,
    {
      method: "PUT",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось обновить профиль мастера");
  }

  return data;
};

export const uploadMasterAvatarRequest = async ({ masterId, avatar }) => {
  const resolvedMasterId = masterId || getStoredAuthUser("master")?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const formData = new FormData();

  if (avatar instanceof File) {
    formData.append("avatar", avatar);
  }

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/avatar`,
    {
      method: "PUT",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить аватарку");
  }

  return data;
};

export const uploadMasterDocumentsRequest = async ({
  masterId,
  idCardFront,
  idCardBack,
  selfiePhoto,
}) => {
  const resolvedMasterId = masterId || getStoredAuthUser("master")?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const formData = new FormData();

  if (idCardFront instanceof File) {
    formData.append("id_card_front", idCardFront);
  }

  if (idCardBack instanceof File) {
    formData.append("id_card_back", idCardBack);
  }

  if (selfiePhoto instanceof File) {
    formData.append("selfie_photo", selfiePhoto);
  }

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/documents`,
    {
      method: "PUT",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить документы");
  }

  return data;
};

export { API_BASE_URL };