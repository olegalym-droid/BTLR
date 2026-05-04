"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CabinetHeader from "../CabinetHeader";
import MasterDashboard from "./MasterDashboard";
import StatePanel from "../StatePanel";
import useMasterCabinet from "../../hooks/useMasterCabinet";
import {
  getCurrentSessionRole,
  getMasterSectionPath,
  getRolePath,
  MASTER_SECTIONS,
  setStoredActiveRole,
} from "../../lib/session";

const resolveMasterSection = (section) =>
  MASTER_SECTIONS.includes(section) ? section : "profile";

const MASTER_SECTION_LABELS = {
  profile: "Профиль",
  schedule: "График",
  orders: "Заказы",
  wallet: "Кошелек",
  chats: "Чаты",
};

export default function MasterPageShell({ initialSection = "profile" }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState(() => {
    const role = getCurrentSessionRole();

    if (role && role !== "master") {
      return "redirecting";
    }

    return role === "master" ? "ready" : "missing";
  });
  const resolvedInitialSection = resolveMasterSection(initialSection);

  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.replace("/");
  }, []);

  const masterState = useMasterCabinet({
    initialSection: resolvedInitialSection,
    onLogout: handleLogout,
  });
  const { setActiveSection } = masterState;

  const handleSectionChange = useCallback(
    (section) => {
      const nextSection = resolveMasterSection(section);

      setActiveSection(nextSection);
      router.push(getMasterSectionPath(nextSection));
    },
    [router, setActiveSection],
  );

  useEffect(() => {
    setActiveSection(resolvedInitialSection);
  }, [resolvedInitialSection, setActiveSection]);

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

  if (sessionStatus === "checking" || sessionStatus === "redirecting") {
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
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <CabinetHeader
          title="Кабинет мастера"
          subtitle="Профиль, график, заказы, кошелек и переписки с клиентами."
          roleLabel="Мастер"
          accountName={
            masterState.masterProfile?.full_name ||
            masterState.masterProfile?.phone
          }
          activeLabel={MASTER_SECTION_LABELS[masterState.activeSection]}
          onLogout={masterState.logout}
        />

        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <MasterDashboard
            {...masterState}
            setActiveSection={handleSectionChange}
          />
        </div>
      </div>
    </main>
  );
}
