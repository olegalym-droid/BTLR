"use client";

import { useEffect } from "react";
import MasterAppView from "../../components/MasterAppView";
import useMasterCabinet from "../../hooks/useMasterCabinet";
import { clearAuthData } from "../../lib/auth";

export default function MasterPage() {
  const masterState = useMasterCabinet({
    onLogout: () => {
      clearAuthData("master");
      window.location.href = "/";
    },
  });

  useEffect(() => {
    const authUser =
      typeof window !== "undefined"
        ? JSON.parse(
            window.localStorage.getItem("auth_user_master") ||
              window.sessionStorage.getItem("auth_user_master") ||
              "null",
          )
        : null;

    if (!authUser?.id || authUser.role !== "master") {
      window.location.href = "/";
    }
  }, []);

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