import { clearAuthData, getStoredAuthUser } from "./auth";

export const APP_ROLE_KEY = "app_selected_role";
export const APP_USER_TAB_KEY = "app_active_tab";
export const APP_MASTER_SECTION_KEY = "app_master_active_section";

export const USER_TABS = ["services", "orders", "chats", "profile"];
export const MASTER_SECTIONS = [
  "profile",
  "schedule",
  "orders",
  "wallet",
  "chats",
];
export const ADMIN_TABS = [
  "masters",
  "complaints",
  "withdrawals",
  "accounts",
  "chats",
];

const ROLE_PATHS = {
  user: "/user/services",
  master: "/master/profile",
  admin: "/admin/masters",
};

const isBrowser = () => typeof window !== "undefined";

const getStorageValue = (key, fallback = "") => {
  if (!isBrowser()) return fallback;

  return (
    window.sessionStorage.getItem(key) ||
    window.localStorage.getItem(key) ||
    fallback
  );
};

const saveSafeValue = (key, value) => {
  if (!isBrowser()) return;

  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};

const getSafeValue = (key, allowedValues, fallback) => {
  if (!isBrowser()) return fallback;

  const saved = window.localStorage.getItem(key);
  return allowedValues.includes(saved) ? saved : fallback;
};

export const getRolePath = (role) => ROLE_PATHS[role] || "/";

export const getUserTabPath = (tab) =>
  USER_TABS.includes(tab) ? `/user/${tab}` : "/user/services";

export const getMasterSectionPath = (section) =>
  MASTER_SECTIONS.includes(section)
    ? `/master/${section}`
    : "/master/profile";

export const getAdminTabPath = (tab) =>
  ADMIN_TABS.includes(tab) ? `/admin/${tab}` : "/admin/masters";

export const setStoredActiveRole = (role) => {
  saveSafeValue(APP_ROLE_KEY, ROLE_PATHS[role] ? role : "");
};

export const getStoredActiveRole = () => {
  if (!isBrowser()) return "";

  const role = window.localStorage.getItem(APP_ROLE_KEY) || "";
  return ROLE_PATHS[role] ? role : "";
};

export const getStoredUserTab = () =>
  getSafeValue(APP_USER_TAB_KEY, USER_TABS, "services");

export const saveStoredUserTab = (tab) => {
  saveSafeValue(APP_USER_TAB_KEY, USER_TABS.includes(tab) ? tab : "services");
};

export const clearStoredUserTab = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(APP_USER_TAB_KEY);
};

export const getStoredMasterSection = () =>
  getSafeValue(APP_MASTER_SECTION_KEY, MASTER_SECTIONS, "profile");

export const saveStoredMasterSection = (section) => {
  saveSafeValue(
    APP_MASTER_SECTION_KEY,
    MASTER_SECTIONS.includes(section) ? section : "profile",
  );
};

export const clearStoredMasterSection = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(APP_MASTER_SECTION_KEY);
};

export const getStoredAdminSession = () => ({
  login: getStorageValue("admin_login", ""),
  password: getStorageValue("admin_password", ""),
  token: getStorageValue("admin_token", ""),
});

export const hasStoredAdminSession = () => {
  const stored = getStoredAdminSession();
  return Boolean(stored.token || (stored.login && stored.password));
};

export const saveAdminSession = (adminLogin, adminToken) => {
  if (!isBrowser()) return;

  clearAuthData("user");
  clearAuthData("master");
  clearStoredUserTab();
  clearStoredMasterSection();
  setStoredActiveRole("admin");

  window.sessionStorage.setItem("admin_login", adminLogin);
  if (adminToken) {
    window.sessionStorage.setItem("admin_token", adminToken);
  } else {
    window.sessionStorage.removeItem("admin_token");
  }
  window.sessionStorage.removeItem("admin_password");
  window.localStorage.removeItem("admin_login");
  window.localStorage.removeItem("admin_token");
  window.localStorage.removeItem("admin_password");
};

export const clearAdminSession = () => {
  if (!isBrowser()) return;

  window.sessionStorage.removeItem("admin_login");
  window.sessionStorage.removeItem("admin_token");
  window.sessionStorage.removeItem("admin_password");
  window.localStorage.removeItem("admin_login");
  window.localStorage.removeItem("admin_token");
  window.localStorage.removeItem("admin_password");

  if (getStoredActiveRole() === "admin") {
    setStoredActiveRole("");
  }
};

export const getCurrentSessionRole = () => {
  if (!isBrowser()) return "";

  if (hasStoredAdminSession()) {
    return "admin";
  }

  const userAuth = getStoredAuthUser("user");
  const masterAuth = getStoredAuthUser("master");
  const storedRole = getStoredActiveRole();

  if (storedRole === "user" && userAuth?.id && userAuth.role === "user") {
    return "user";
  }

  if (
    storedRole === "master" &&
    masterAuth?.id &&
    masterAuth.role === "master"
  ) {
    return "master";
  }

  if (userAuth?.id && userAuth.role === "user") {
    return "user";
  }

  if (masterAuth?.id && masterAuth.role === "master") {
    return "master";
  }

  return "";
};

export const redirectToRole = (role) => {
  if (!isBrowser()) return;
  window.location.replace(getRolePath(role));
};
