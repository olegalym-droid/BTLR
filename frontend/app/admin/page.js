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
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <AdminAppView {...adminState} />
        </div>
      </div>
    </main>
  );
}