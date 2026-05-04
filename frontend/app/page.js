"use client";

import { useEffect, useState } from "react";
import AuthGate from "../components/AuthGate";
import StatePanel from "../components/StatePanel";
import { adminLoginRequest } from "../lib/admin";
import {
  getCurrentSessionRole,
  getRolePath,
  saveAdminSession,
  setStoredActiveRole,
} from "../lib/session";

export default function Home() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const role = getCurrentSessionRole();

    if (role) {
      window.location.replace(getRolePath(role));
      return;
    }

    const timer = window.setTimeout(() => {
      setIsCheckingSession(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleUserOrMasterSuccess = (role) => {
    setStoredActiveRole(role);
  };

  const handleAdminSuccess = async (login, password) => {
    const authData = await adminLoginRequest({ login, password });
    saveAdminSession(authData.login, authData.access_token);
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-[#f3f5f1]">
        <StatePanel
          title="Проверяем вход"
          text="Сейчас откроем нужный кабинет, если сессия уже сохранена."
        />
      </main>
    );
  }

  return (
    <AuthGate
      onUserOrMasterSuccess={handleUserOrMasterSuccess}
      onAdminSuccess={handleAdminSuccess}
    />
  );
}
