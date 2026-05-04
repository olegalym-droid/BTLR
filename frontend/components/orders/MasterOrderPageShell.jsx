"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CabinetHeader from "../CabinetHeader";
import StatePanel from "../StatePanel";
import MasterOrdersSection from "../master/MasterOrdersSection";
import useMasterCabinet from "../../hooks/useMasterCabinet";
import {
  getCurrentSessionRole,
  getRolePath,
  setStoredActiveRole,
} from "../../lib/session";

export default function MasterOrderPageShell({ orderId }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState("checking");

  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.replace("/");
  }, []);

  const masterState = useMasterCabinet({
    initialSection: "orders",
    onLogout: handleLogout,
  });

  const order = useMemo(
    () =>
      masterState.masterOrders.find(
        (item) => Number(item.id) === Number(orderId),
      ) || null,
    [masterState.masterOrders, orderId],
  );

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
          title="Открываем заказ"
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
          text="Для просмотра заказа нужна активная сессия мастера."
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
          title="Заказ временно не загрузился"
          text="Сессия мастера сохранена, но сервер не отдал данные кабинета."
          detail={masterState.startupError}
          actionLabel="Обновить"
          onAction={() => window.location.reload()}
        />
      </main>
    );
  }

  if (
    !masterState.isLoggedIn ||
    !masterState.masterProfile ||
    (masterState.isMasterOrdersLoading && !order)
  ) {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Загружаем заказ"
          text="Получаем профиль мастера и список заказов."
        />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Заказ не найден"
          text="Такого заказа нет в вашем кабинете. Возможно, он назначен другому мастеру или уже недоступен."
          actionLabel="К заказам"
          onAction={() => router.push("/master/orders")}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <CabinetHeader
          title={`Заказ #${order.id}`}
          subtitle="Статус, связь с клиентом, фото-отчет и спор по заказу."
          roleLabel="Мастер"
          accountName={
            masterState.masterProfile?.full_name ||
            masterState.masterProfile?.phone
          }
          activeLabel="Заказ"
          onLogout={masterState.logout}
        />

        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.push("/master/orders")}
            className="mb-4 inline-flex min-h-[46px] items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            Назад к заказам
          </button>

          <MasterOrdersSection
            title={order.service_name || `Заказ #${order.id}`}
            emptyText="Заказ не найден"
            masterProfile={masterState.masterProfile}
            masterOrders={[order]}
            isMasterOrdersLoading={masterState.isMasterOrdersLoading}
            loadMasterOrders={masterState.loadMasterOrders}
            handleMasterStatusChange={masterState.handleMasterStatusChange}
            reportPhotos={masterState.reportPhotos}
            setReportPhotos={masterState.setReportPhotos}
            reportTargetOrderId={masterState.reportTargetOrderId}
            setReportTargetOrderId={masterState.setReportTargetOrderId}
            handleUploadOrderReport={masterState.handleUploadOrderReport}
            isReportUploading={masterState.isReportUploading}
            onOpenPhoto={masterState.setOpenedPhoto}
          />
        </div>
      </div>
    </main>
  );
}
