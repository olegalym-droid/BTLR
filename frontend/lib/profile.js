import { DEFAULT_PROFILE } from "./constants";
import { getStoredAuthUser } from "./auth";

const LEGACY_PROFILE_STORAGE_KEY = "resident_profile";
const PROFILE_STORAGE_PREFIX = "resident_profile_";

const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const cloneDefaultProfile = () => ({
  ...DEFAULT_PROFILE,
  addresses: [...DEFAULT_PROFILE.addresses],
});

const getProfileStorageKey = (userId, phone = "") => {
  if (!userId) {
    return null;
  }

  const phonePart = normalizePhone(phone);
  return phonePart
    ? `${PROFILE_STORAGE_PREFIX}${userId}_${phonePart}`
    : `${PROFILE_STORAGE_PREFIX}${userId}`;
};

const getLegacyProfileStorageKey = (userId) => {
  if (!userId) {
    return null;
  }

  return `${PROFILE_STORAGE_PREFIX}${userId}`;
};

const getCurrentUserProfileKey = () => {
  const authUser = getStoredAuthUser("user");
  return getProfileStorageKey(authUser?.id, authUser?.phone);
};

const parseProfile = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.error("Profile parse error:", error);
    return null;
  }
};

const canMigrateLegacyProfile = (legacyProfile, authUser) => {
  const legacyPhone = normalizePhone(legacyProfile?.phone);
  const authPhone = normalizePhone(authUser?.phone);

  return Boolean(legacyPhone && authPhone && legacyPhone === authPhone);
};

const normalizeProfile = (profile, authUser) => {
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
    ...cloneDefaultProfile(),
    ...(profile || {}),
    name: profile?.name || authUser?.fullName || "",
    phone: profile?.phone || authUser?.phone || "",
    addresses,
    primaryAddressIndex,
  };
};

export const getStoredProfile = () => {
  if (typeof window === "undefined") {
    return cloneDefaultProfile();
  }

  try {
    const authUser = getStoredAuthUser("user");
    if (!authUser?.id || authUser.role !== "user") {
      return cloneDefaultProfile();
    }

    const profileKey = getCurrentUserProfileKey();
    if (!profileKey) {
      return cloneDefaultProfile();
    }

    const savedProfile = parseProfile(window.localStorage.getItem(profileKey));

    if (savedProfile) {
      return normalizeProfile(savedProfile, authUser);
    }

    const legacyProfileKey = getLegacyProfileStorageKey(authUser.id);
    const legacyScopedProfile = parseProfile(
      window.localStorage.getItem(legacyProfileKey),
    );

    if (canMigrateLegacyProfile(legacyScopedProfile, authUser)) {
      const migratedProfile = normalizeProfile(legacyScopedProfile, authUser);
      window.localStorage.setItem(profileKey, JSON.stringify(migratedProfile));

      if (legacyProfileKey && legacyProfileKey !== profileKey) {
        window.localStorage.removeItem(legacyProfileKey);
      }

      return migratedProfile;
    }

    const legacyProfile = parseProfile(
      window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY),
    );

    if (canMigrateLegacyProfile(legacyProfile, authUser)) {
      const migratedProfile = normalizeProfile(legacyProfile, authUser);
      window.localStorage.setItem(profileKey, JSON.stringify(migratedProfile));
      window.localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
      return migratedProfile;
    }

    return normalizeProfile(null, authUser);
  } catch (error) {
    console.error("Ошибка чтения профиля:", error);
    return cloneDefaultProfile();
  }
};

export const saveStoredProfile = (profile) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const profileKey = getCurrentUserProfileKey();
    const authUser = getStoredAuthUser("user");

    if (!profileKey || !authUser?.id || authUser.role !== "user") {
      console.warn("Profile save skipped: user is not authenticated");
      return;
    }

    window.localStorage.setItem(
      profileKey,
      JSON.stringify(normalizeProfile(profile, authUser)),
    );
  } catch (error) {
    console.error("Ошибка сохранения профиля:", error);
  }
};

export const getPrimaryAddressFromProfile = (profile) => {
  if (!profile?.addresses?.length) {
    return "";
  }

  return (
    profile.addresses[profile.primaryAddressIndex] || profile.addresses[0] || ""
  );
};

export const formatPhoneInput = (value) => {
  let cleaned = String(value || "").replace(/[^\d+]/g, "");

  if (cleaned.includes("+")) {
    cleaned = `+${cleaned.replace(/\+/g, "")}`;
  }

  if (!cleaned.startsWith("+") && cleaned.length > 0) {
    cleaned = `+${cleaned}`;
  }

  return cleaned.slice(0, 16);
};

export const buildAddressString = ({ city, street, house, apartment }) => {
  const parts = [];

  if (String(city || "").trim()) {
    parts.push(`г. ${String(city).trim()}`);
  }

  if (String(street || "").trim()) {
    parts.push(`ул. ${String(street).trim()}`);
  }

  if (String(house || "").trim()) {
    parts.push(`д. ${String(house).trim()}`);
  }

  if (String(apartment || "").trim()) {
    parts.push(`кв. ${String(apartment).trim()}`);
  }

  return parts.join(", ");
};
