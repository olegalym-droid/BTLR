import { useEffect, useState } from "react";
import { getStoredAuthUser, clearAuthData } from "../lib/auth";

export default function useMasterSession() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [openedPhoto, setOpenedPhoto] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");

  const loadStoredMaster = () => {
    const authUser = getStoredAuthUser();

    if (authUser?.id && authUser.role === "master") {
      return authUser;
    }

    return null;
  };

  const logoutMasterSession = ({ onLogout, resetters = [] } = {}) => {
    clearAuthData();
    setIsLoggedIn(false);
    setSuccessText("");
    setOpenedPhoto(null);
    setActiveSection("profile");

    if (Array.isArray(resetters)) {
      resetters.forEach((reset) => {
        if (typeof reset === "function") {
          reset();
        }
      });
    }

    if (onLogout) {
      onLogout();
    }
  };

  return {
    isLoggedIn,
    setIsLoggedIn,
    successText,
    setSuccessText,
    openedPhoto,
    setOpenedPhoto,
    activeSection,
    setActiveSection,
    loadStoredMaster,
    logoutMasterSession,
  };
}