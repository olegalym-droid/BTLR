import { useState } from "react";
import { getStoredAuth, clearAuthData } from "../lib/auth";

export default function useAppSession() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuth);
  const [activeTab, setActiveTab] = useState("services");

  const logoutSession = () => {
    clearAuthData();
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