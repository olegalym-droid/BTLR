import { useEffect, useState } from "react";
import { clearAuthData } from "../lib/auth";

const APP_ROLE_KEY = "app_selected_role";
const APP_TAB_KEY = "app_active_tab";

export default function useAppSession() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedRole) {
      localStorage.setItem(APP_ROLE_KEY, selectedRole);
    } else {
      localStorage.removeItem(APP_ROLE_KEY);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeTab) {
      localStorage.setItem(APP_TAB_KEY, activeTab);
    }
  }, [activeTab]);

  const logoutSession = () => {
    clearAuthData();
    localStorage.removeItem(APP_ROLE_KEY);
    localStorage.removeItem(APP_TAB_KEY);

    setIsAuthenticated(false);
    setSelectedRole(null);
    setActiveTab("services");
  };

  return {
    selectedRole,
    setSelectedRole,
    isAuthenticated,
    setIsAuthenticated,
    activeTab,
    setActiveTab,
    logoutSession,
  };
}
