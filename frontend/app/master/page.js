"use client";

import { useEffect, useState } from "react";
import MasterAppView from "../../components/MasterAppView";
import useMasterCabinet from "../../hooks/useMasterCabinet";
import { clearAuthData } from "../../lib/auth";

function readMasterAuthUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem("auth_user_master") ||
    window.sessionStorage.getItem("auth_user_master");

  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function MasterPage() {
  const [canRender, setCanRender] = useState(false);

  const masterState = useMasterCabinet({
    onLogout: () => {
      if (typeof window === "undefined") return;

      clearAuthData("master");

      const keys = [
        "isAuth",
        "auth_user",
        "isAuth_master",
        "auth_user_master",
        "app_selected_role",
        "app_active_tab",
      ];

      keys.forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });

      window.location.replace("/");
    },
  });

  useEffect(() => {
    const authUser = readMasterAuthUser();

    if (!authUser?.id || authUser.role !== "master") {
      window.location.replace("/");
      return;
    }

    const timer = setTimeout(() => {
      setCanRender(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  if (!canRender || !masterState.isLoggedIn || !masterState.masterProfile) {
    return <main className="min-h-screen bg-gray-100" />;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <MasterAppView {...masterState} />
        </div>
      </div>
    </main>
  );
}
