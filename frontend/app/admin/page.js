"use client";

import { useEffect } from "react";
import AdminAppView from "../../components/AdminAppView";
import useAdminCabinet from "../../hooks/useAdminCabinet";

export default function AdminPage() {
  const adminState = useAdminCabinet({
    onLogout: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const adminLogin =
      window.sessionStorage.getItem("admin_login") ||
      window.localStorage.getItem("admin_login");

    const adminPassword =
      window.sessionStorage.getItem("admin_password") ||
      window.localStorage.getItem("admin_password");

    if (!adminLogin || !adminPassword) {
      window.location.href = "/";
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <AdminAppView {...adminState} />
      </div>
    </main>
  );
}
