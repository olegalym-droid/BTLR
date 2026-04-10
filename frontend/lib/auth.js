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

  if (role === "user") {
    const profileKey = `resident_profile_${id}`;
    const existingProfileRaw = localStorage.getItem(profileKey);

    if (!existingProfileRaw) {
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

export const clearAuthData = () => {
  localStorage.removeItem("isAuth");
  localStorage.removeItem("auth_user");
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

export const loadMasterProfileRequest = async (masterId) => {
  const response = await fetch(`${API_BASE_URL}/masters/${masterId}`);
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
  workDistrict = "",
}) => {
  const formData = new FormData();

  formData.append("full_name", fullName);
  formData.append("about_me", aboutMe);
  formData.append(
    "experience_years",
    experienceYears === "" ? "" : String(experienceYears),
  );
  formData.append("work_city", workCity);
  formData.append("work_district", workDistrict);

  const response = await fetch(`${API_BASE_URL}/masters/${masterId}/profile`, {
    method: "PUT",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось обновить профиль мастера");
  }

  return data;
};

export const uploadMasterDocumentsRequest = async ({
  masterId,
  idCardFront,
  idCardBack,
  selfiePhoto,
}) => {
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
    `${API_BASE_URL}/masters/${masterId}/documents`,
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

export const approveMasterProfileRequest = async (masterId) => {
  const response = await fetch(`${API_BASE_URL}/masters/${masterId}/approve`, {
    method: "PUT",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось подтвердить профиль мастера");
  }

  return data;
};

export { API_BASE_URL };
