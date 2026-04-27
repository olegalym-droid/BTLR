import { API_BASE_URL } from "./constants";

const AUTH_FLAG_KEY = "isAuth";
const AUTH_USER_KEY = "auth_user";
const REMEMBER_LOGIN_KEY = "btlr_remember_login";
const REMEMBER_LOGIN_ROLE_KEY = "btlr_remember_login_role";
const REMEMBER_ADMIN_LOGIN_KEY = "btlr_remember_admin_login";
const LEGACY_PROFILE_STORAGE_KEY = "resident_profile";
const USER_PROFILE_STORAGE_PREFIX = "resident_profile_";

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

const createApiError = (message, options = {}) => {
  const error = new Error(message);
  error.status = options.status;
  error.isNetworkError = Boolean(options.isNetworkError);
  return error;
};

const readResponseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const getUserProfileStorageKey = (id, phone = "") => {
  const phonePart = normalizePhone(phone);
  return phonePart
    ? `${USER_PROFILE_STORAGE_PREFIX}${id}_${phonePart}`
    : `${USER_PROFILE_STORAGE_PREFIX}${id}`;
};

const getLegacyUserProfileStorageKey = (id) =>
  `${USER_PROFILE_STORAGE_PREFIX}${id}`;

const normalizeUserProfile = (profile, { fullName = "", phone = "" } = {}) => {
  const addresses = Array.isArray(profile?.addresses)
    ? profile.addresses.filter((item) => String(item || "").trim())
    : [];

  const rawPrimaryIndex =
    typeof profile?.primaryAddressIndex === "number"
      ? profile.primaryAddressIndex
      : 0;

  const primaryAddressIndex =
    addresses.length > 0
      ? Math.min(Math.max(rawPrimaryIndex, 0), addresses.length - 1)
      : 0;

  return {
    ...(profile || {}),
    name: profile?.name || fullName || "",
    phone: profile?.phone || phone || "",
    addresses,
    primaryAddressIndex,
  };
};

const canUseLegacyUserProfile = (legacyProfile, phone) => {
  const legacyPhone = normalizePhone(legacyProfile?.phone);
  const currentPhone = normalizePhone(phone);

  return Boolean(legacyPhone && currentPhone && legacyPhone === currentPhone);
};

const removeRoleSession = (role) => {
  if (typeof window === "undefined") {
    return;
  }

  const { authFlagKey, authUserKey } = getRoleStorageKeys(role);

  localStorage.removeItem(authFlagKey);
  localStorage.removeItem(authUserKey);
  sessionStorage.removeItem(authFlagKey);
  sessionStorage.removeItem(authUserKey);
};

const removeLegacySession = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_FLAG_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
};

const clearAdminSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("admin_login");
  localStorage.removeItem("admin_password");
  sessionStorage.removeItem("admin_login");
  sessionStorage.removeItem("admin_password");
};

const clearOtherSessionsForRole = (role) => {
  if (typeof window === "undefined") {
    return;
  }

  if (role === "user") {
    removeRoleSession("master");
    clearAdminSession();
  }

  if (role === "master") {
    removeRoleSession("user");
    clearAdminSession();
  }

  removeLegacySession();
};

const clearRoleSession = (role) => {
  if (typeof window === "undefined") {
    return;
  }

  removeRoleSession(role);
  removeLegacySession();

  if (role === "admin") {
    clearAdminSession();
  }
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

const updateStoredRoleAuthUser = (role, updates) => {
  if (typeof window === "undefined") {
    return;
  }

  const { authUserKey } = getRoleStorageKeys(role);

  [localStorage, sessionStorage].forEach((storage) => {
    const currentUser = readJson(storage.getItem(authUserKey), null);

    if (!currentUser) {
      return;
    }

    storage.setItem(
      authUserKey,
      JSON.stringify({
        ...currentUser,
        ...updates,
      }),
    );
  });
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

  const data = await readResponseJson(response);

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

  clearOtherSessionsForRole(role);

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
    const profileKey = getUserProfileStorageKey(id, phone);
    const existingProfileRaw = localStorage.getItem(profileKey);
    let profileToSave = readJson(existingProfileRaw, null);

    if (!profileToSave) {
      const legacyProfileKey = getLegacyUserProfileStorageKey(id);
      const legacyScopedProfile = readJson(
        localStorage.getItem(legacyProfileKey),
        null,
      );

      if (canUseLegacyUserProfile(legacyScopedProfile, phone)) {
        profileToSave = legacyScopedProfile;
        localStorage.removeItem(legacyProfileKey);
      }
    }

    if (!profileToSave) {
      const legacyGlobalProfile = readJson(
        localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY),
        null,
      );

      if (canUseLegacyUserProfile(legacyGlobalProfile, phone)) {
        profileToSave = legacyGlobalProfile;
        localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
      }
    }

    localStorage.setItem(
      profileKey,
      JSON.stringify(
        normalizeUserProfile(profileToSave, {
          fullName: full_name || "",
          phone: phone || "",
        }),
      ),
    );
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
  clearAdminSession();
  removeLegacySession();
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

const getAuthorizedMasterId = (masterId) => {
  const authMaster = getStoredAuthUser("master");
  const resolvedMasterId = masterId || authMaster?.id;

  if (!authMaster?.id || authMaster.role !== "master" || !resolvedMasterId) {
    throw new Error("Master is not authenticated");
  }

  if (authMaster?.id && Number(resolvedMasterId) !== Number(authMaster.id)) {
    throw new Error("Master session does not match this profile");
  }

  return resolvedMasterId;
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
  const resolvedMasterId = getAuthorizedMasterId(masterId);

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/masters/${resolvedMasterId}`);
  } catch (error) {
    throw createApiError(
      error.message || "Не удалось связаться с сервером",
      { isNetworkError: true },
    );
  }

  const data = await readResponseJson(response);

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
  const resolvedMasterId = getAuthorizedMasterId(masterId);

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const formData = new FormData();

  formData.append("full_name", fullName.trim());
  formData.append("about_me", aboutMe);
  if (String(experienceYears).trim() !== "") {
    formData.append("experience_years", String(experienceYears));
  }
  formData.append("work_city", workCity);

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/profile`,
    {
      method: "PUT",
      body: formData,
    },
  );

  const data = await readResponseJson(response);

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось обновить профиль мастера");
  }

  updateStoredRoleAuthUser("master", {
    fullName: data.full_name || "",
  });

  return data;
};

export const uploadMasterAvatarRequest = async ({ masterId, avatar }) => {
  const resolvedMasterId = getAuthorizedMasterId(masterId);

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
  const resolvedMasterId = getAuthorizedMasterId(masterId);

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
