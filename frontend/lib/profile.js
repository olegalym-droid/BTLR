import { DEFAULT_PROFILE } from "./constants";

const getProfileStorageKey = (userId) => {
  if (!userId) {
    return "resident_profile";
  }

  return `resident_profile_${userId}`;
};

export const getStoredProfile = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE;
  }

  try {
    const authUserRaw = localStorage.getItem("auth_user");
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
    const profileKey = getProfileStorageKey(authUser?.id);
    const savedProfile = localStorage.getItem(profileKey);

    const baseProfile = savedProfile
      ? {
          ...DEFAULT_PROFILE,
          ...JSON.parse(savedProfile),
        }
      : { ...DEFAULT_PROFILE };

    return {
      ...baseProfile,
      name: authUser?.fullName || baseProfile.name || "",
      phone: authUser?.phone || baseProfile.phone || "",
      addresses: Array.isArray(baseProfile.addresses)
        ? baseProfile.addresses
        : [],
      primaryAddressIndex:
        typeof baseProfile.primaryAddressIndex === "number"
          ? baseProfile.primaryAddressIndex
          : 0,
    };
  } catch (error) {
    console.error("Ошибка чтения профиля:", error);
    return DEFAULT_PROFILE;
  }
};

export const saveStoredProfile = (profile) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const authUserRaw = localStorage.getItem("auth_user");
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
    const profileKey = getProfileStorageKey(authUser?.id);

    localStorage.setItem(profileKey, JSON.stringify(profile));
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
  let cleaned = value.replace(/[^\d+]/g, "");

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

  if (city.trim()) {
    parts.push(`г. ${city.trim()}`);
  }

  if (street.trim()) {
    parts.push(`ул. ${street.trim()}`);
  }

  if (house.trim()) {
    parts.push(`д. ${house.trim()}`);
  }

  if (apartment.trim()) {
    parts.push(`кв. ${apartment.trim()}`);
  }

  return parts.join(", ");
};
