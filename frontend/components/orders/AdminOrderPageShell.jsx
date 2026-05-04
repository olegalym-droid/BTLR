"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CabinetHeader from "../CabinetHeader";
import StatePanel from "../StatePanel";
import AdminLogin from "../admin/AdminLogin";
import { API_BASE_URL } from "../../lib/constants";
import { loadAdminOrderRequest } from "../../lib/admin";
import { getStatusLabel, formatPublicOrderCode } from "../../lib/orders";
import useAdminCabinet from "../../hooks/useAdminCabinet";
import { getCurrentSessionRole, getRolePath } from "../../lib/session";

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-[#fbfcfb] p-4">
      <div className="text-xs font-bold uppercase text-gray-400">{label}</div>
      <div className="mt-2 break-words text-sm font-bold text-[#111827] [overflow-wrap:anywhere]">
        {value || "—"}
      </div>
    </div>
  );
}

function PhotoGrid({ title, photos = [] }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={`${API_BASE_URL}/${photo.file_path}`}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-[20px] border border-gray-200 bg-gray-100"
          >
            <img
              src={`${API_BASE_URL}/${photo.file_path}`}
              alt={title}
              className="h-44 w-full object-cover"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

export default function AdminOrderPageShell({ orderId }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [order, setOrder] = useState(null);
  const [errorText, setErrorText] = useState("");

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

  useEffect(() => {
    if (sessionStatus !== "ready" || !adminState.isLoggedIn) {
      return;
    }

    let isMounted = true;

    loadAdminOrderRequest(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
        setErrorText("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorText(error.message || "Не удалось загрузить заказ");
      });

    return () => {
      isMounted = false;
    };
  }, [adminState.isLoggedIn, orderId, sessionStatus]);

  if (sessionStatus === "checking" || adminState.isSessionChecking) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
        <StatePanel
          title="Открываем заказ"
          text="Проверяем сохраненный вход администратора."
        />
      </main>
    );
  }

  if (!adminState.isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
        <AdminLogin
          login={adminState.login}
          setLogin={adminState.setLogin}
          password={adminState.password}
          setPassword={adminState.setPassword}
          handleLogin={adminState.handleLogin}
          isLoading={adminState.isLoading}
          onBack={() => window.location.replace("/")}
        />
      </main>
    );
  }

  if (errorText || !order) {
    return (
      <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
        <StatePanel
          title={errorText ? "Заказ не найден" : "Загружаем заказ"}
          text={
            errorText
              ? "Проверьте номер заказа. Если он удален или недоступен, вернитесь в админку."
              : "Получаем данные заказа."
          }
          detail={errorText}
          actionLabel={errorText ? "К админке" : ""}
          onAction={() => router.push("/admin/masters")}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#111827]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <CabinetHeader
          title={`Заказ #${order.id}`}
          subtitle="Административный просмотр заказа, участников, цены, фото и жалоб."
          roleLabel="Администратор"
          accountName={adminState.login || "Администратор"}
          activeLabel="Заказ"
          onLogout={adminState.logout}
        />

        <button
          type="button"
          onClick={() => router.push("/admin/accounts")}
          className="my-4 inline-flex min-h-[46px] items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          Назад в админку
        </button>

        <section className="space-y-6 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <div className="inline-flex rounded-full border border-[#d9ead8] bg-[#f0f7ef] px-3 py-1.5 text-xs font-bold text-[#4f7f56]">
              {formatPublicOrderCode(order.id)}
            </div>
            <h1 className="mt-3 break-words text-3xl font-bold text-[#111827] [overflow-wrap:anywhere]">
              {order.service_name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              {order.category} · {getStatusLabel(order.status)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Пользователь" value={order.user_phone} />
            <InfoCard label="Мастер" value={order.master_name} />
            <InfoCard label="Телефон мастера" value={order.master_phone} />
            <InfoCard label="Статус выплаты" value={order.payout_status} />
            <InfoCard label="Адрес" value={order.address} />
            <InfoCard label="Дата" value={order.scheduled_at} />
            <InfoCard label="Цена клиента" value={order.client_price} />
            <InfoCard label="Цена мастера" value={order.price} />
          </div>

          <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
            <div className="text-sm font-bold text-[#111827]">Описание</div>
            <p className="mt-3 break-words text-sm font-semibold leading-6 text-gray-700 [overflow-wrap:anywhere]">
              {order.description || "Без описания"}
            </p>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <PhotoGrid title="Фото заявки" photos={order.photos} />
          <PhotoGrid title="Фото-отчет" photos={order.report_photos} />
        </div>
      </div>
    </main>
  );
}
