"use client";

import { useCallback, useEffect, useState } from "react";
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

  const handleLogout = useCallback(() => {
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
  }, []);

  const masterState = useMasterCabinet({
    onLogout: handleLogout,
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

  if (canRender && masterState.startupError && !masterState.masterProfile) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-6 text-gray-900">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Кабинет временно не загрузился</h1>
            <p className="mt-3 text-sm text-gray-600">
              Сессия мастера сохранена. Обычно это значит, что backend не ответил
              или перезапускается. Обновите страницу, когда сервер снова будет
              доступен.
            </p>
            <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              {masterState.startupError}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Обновить
              </button>
              <button
                type="button"
                onClick={masterState.logout}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
