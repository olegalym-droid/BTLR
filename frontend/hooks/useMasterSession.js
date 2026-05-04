import { useCallback, useState } from "react";
import { getStoredAuthUser, clearAuthData } from "../lib/auth";
import {
  clearStoredMasterSection,
  getStoredMasterSection,
  MASTER_SECTIONS,
  saveStoredMasterSection,
} from "../lib/session";

const resolveInitialSection = (section) =>
  MASTER_SECTIONS.includes(section) ? section : getStoredMasterSection();

export default function useMasterSession(initialSection) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const authUser = getStoredAuthUser("master");
    return Boolean(authUser?.id && authUser.role === "master");
  });
  const [successText, setSuccessText] = useState("");
  const [openedPhoto, setOpenedPhoto] = useState(null);
  const [activeSectionState, setActiveSectionState] = useState(
    () => resolveInitialSection(initialSection),
  );

  const setActiveSection = useCallback((section) => {
    setActiveSectionState((prev) => {
      const nextSection =
        typeof section === "function" ? section(prev) : section;

      saveStoredMasterSection(nextSection);
      return nextSection;
    });
  }, []);

  const loadStoredMaster = useCallback(() => {
    const authUser = getStoredAuthUser("master");

    if (authUser?.id && authUser.role === "master") {
      return authUser;
    }

    return null;
  }, []);

  const logoutMasterSession = useCallback(({ onLogout, resetters = [] } = {}) => {
    clearAuthData("master");
    setIsLoggedIn(false);
    setSuccessText("");
    setOpenedPhoto(null);
    clearStoredMasterSection();
    setActiveSectionState("profile");

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
  }, []);

  return {
    isLoggedIn,
    setIsLoggedIn,
    successText,
    setSuccessText,
    openedPhoto,
    setOpenedPhoto,
    activeSection: activeSectionState,
    setActiveSection,
    loadStoredMaster,
    logoutMasterSession,
  };
}
