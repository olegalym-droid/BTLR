"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CabinetHeader from "../CabinetHeader";
import OrderDetails from "../OrderDetails";
import StatePanel from "../StatePanel";
import { getStoredAuthUser } from "../../lib/auth";
import { getStatusLabel, loadUserOrderRequest } from "../../lib/orders";
import {
  getCurrentSessionRole,
  getRolePath,
  setStoredActiveRole,
} from "../../lib/session";

export default function UserOrderPageShell({ orderId }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [order, setOrder] = useState(null);
  const [errorText, setErrorText] = useState("");
  const authUser = getStoredAuthUser("user");

  useEffect(() => {
    const role = getCurrentSessionRole();

    if (role && role !== "user") {
      window.location.replace(getRolePath(role));
      return;
    }

    if (!authUser?.id || authUser.role !== "user") {
      const timer = window.setTimeout(() => {
        setSessionStatus("missing");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    let isMounted = true;
    setStoredActiveRole("user");

    loadUserOrderRequest(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
        setErrorText("");
        setSessionStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorText(error.message || "Не удалось загрузить заказ");
        setSessionStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, authUser?.role, orderId]);

  if (sessionStatus === "checking" || sessionStatus === "loading") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Открываем заказ"
          text="Загружаем данные заявки и историю статусов."
        />
      </main>
    );
  }

  if (sessionStatus === "missing") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Нужно войти"
          text="Для просмотра заказа нужна активная сессия пользователя."
          actionLabel="Перейти ко входу"
          onAction={() => window.location.replace("/")}
        />
      </main>
    );
  }

  if (sessionStatus === "error" || !order) {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Заказ не найден или недоступен"
          text="Такого заказа нет в вашем кабинете. Возможно, он принадлежит другому аккаунту или был удален."
          detail={errorText}
          actionLabel="К списку заказов"
          onAction={() => router.push("/user/orders")}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <CabinetHeader
          title={`Заказ #${order.id}`}
          subtitle="Детали заявки, статус, мастер, оплата, спор и чат."
          roleLabel="Пользователь"
          accountName={authUser?.fullName || authUser?.phone}
          activeLabel="Заказ"
          onLogout={() => window.location.replace("/")}
        />

        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <OrderDetails
            selectedOrder={order}
            getStatusLabel={getStatusLabel}
            onBack={() => router.push("/user/orders")}
            onStatusChange={(updatedOrder) => setOrder({ ...updatedOrder })}
          />
        </div>
      </div>
    </main>
  );
}
