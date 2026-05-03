"use client";

import { useEffect, useState } from "react";
import AdminAppView from "../../components/AdminAppView";
import StatePanel from "../../components/StatePanel";
import useAdminCabinet from "../../hooks/useAdminCabinet";
import { getCurrentSessionRole, getRolePath } from "../../lib/session";

export default function AdminPage() {
  const [sessionStatus, setSessionStatus] = useState("checking");

  const adminState = useAdminCabinet({
    onLogout: () => {
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    },
  });

  useEffect(() => {
    const role = getCurrentSessionRole();

    if (role && role !== "admin") {
      window.location.replace(getRolePath(role));
      return;
    }

    const timer = window.setTimeout(() => {
      setSessionStatus("ready");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (sessionStatus === "checking" || adminState.isSessionChecking) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
        <StatePanel
          title="Открываем админку"
          text="Проверяем сохраненный вход администратора."
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <AdminAppView {...adminState} />
      </div>
    </main>
  );
}
