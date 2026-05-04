"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminAppView from "../AdminAppView";
import StatePanel from "../StatePanel";
import useAdminCabinet from "../../hooks/useAdminCabinet";
import {
  ADMIN_TABS,
  getAdminTabPath,
  getCurrentSessionRole,
  getRolePath,
} from "../../lib/session";

const resolveAdminTab = (tab) => (ADMIN_TABS.includes(tab) ? tab : "masters");

export default function AdminPageShell({ initialTab = "masters" }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState("checking");
  const resolvedInitialTab = resolveAdminTab(initialTab);

  const adminState = useAdminCabinet({
    onLogout: () => {
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    },
  });

  const handleTabChange = useCallback(
    (tab) => {
      const nextTab = resolveAdminTab(tab);
      router.push(getAdminTabPath(nextTab));
    },
    [router],
  );

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
        <AdminAppView
          {...adminState}
          initialTab={resolvedInitialTab}
          onTabChange={handleTabChange}
        />
      </div>
    </main>
  );
}
