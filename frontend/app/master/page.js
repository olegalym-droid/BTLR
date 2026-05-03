"use client";

import { useCallback, useEffect, useState } from "react";
import MasterDashboard from "../../components/master/MasterDashboard";
import StatePanel from "../../components/StatePanel";
import useMasterCabinet from "../../hooks/useMasterCabinet";
import {
  getCurrentSessionRole,
  getRolePath,
  setStoredActiveRole,
} from "../../lib/session";

export default function MasterPage() {
  const [sessionStatus, setSessionStatus] = useState("checking");

  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.replace("/");
  }, []);

  const masterState = useMasterCabinet({
    onLogout: handleLogout,
  });

  useEffect(() => {
    const role = getCurrentSessionRole();
    let timer;

    if (role && role !== "master") {
      window.location.replace(getRolePath(role));
      return;
    }

    if (!role) {
      timer = window.setTimeout(() => {
        setSessionStatus("missing");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    setStoredActiveRole("master");
    timer = window.setTimeout(() => {
      setSessionStatus("ready");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (sessionStatus === "checking") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Открываем кабинет"
          text="Проверяем сохраненный вход мастера."
        />
      </main>
    );
  }

  if (sessionStatus === "missing") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Нужно войти"
          text="Для кабинета мастера нужна активная сессия."
          actionLabel="Перейти ко входу"
          onAction={() => window.location.replace("/")}
        />
      </main>
    );
  }

  if (masterState.startupError && !masterState.masterProfile) {
    return (
      <main className="min-h-screen bg-gray-100 text-gray-900">
        <StatePanel
          title="Кабинет временно не загрузился"
          text="Сессия мастера сохранена. Обычно это значит, что сервер не ответил или перезапускается."
          detail={masterState.startupError}
          actionLabel="Обновить"
          onAction={() => window.location.reload()}
        />
      </main>
    );
  }

  if (!masterState.isLoggedIn || !masterState.masterProfile) {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Загружаем кабинет"
          text="Получаем профиль, заказы и график мастера."
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <MasterDashboard {...masterState} />
        </div>
      </div>
    </main>
  );
}
