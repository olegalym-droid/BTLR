"use client";

import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Wallet,
  Star,
  UserRound,
} from "lucide-react";
import { ORDER_STATUSES, formatPublicOrderCode } from "../lib/orders";

function getStatusStyles(status) {
  if (status === ORDER_STATUSES.SEARCHING) {
    return {
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      dot: "bg-gray-400",
    };
  }

  if (status === ORDER_STATUSES.PENDING_USER_CONFIRMATION) {
    return {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    };
  }

  if (status === ORDER_STATUSES.ASSIGNED) {
    return {
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
    };
  }

  if (status === ORDER_STATUSES.ON_THE_WAY) {
    return {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }

  if (status === ORDER_STATUSES.ON_SITE) {
    return {
      badge: "bg-violet-50 text-violet-700 border-violet-200",
      dot: "bg-violet-500",
    };
  }

  if (status === ORDER_STATUSES.COMPLETED) {
    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (status === ORDER_STATUSES.PAID) {
    return {
      badge: "bg-green-100 text-green-800 border-green-200",
      dot: "bg-green-600",
    };
  }

  return {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
}

function getDisplayPrice(order) {
  return order.price || order.client_price || "Не указана";
}

export default function OrderCard({ order, getStatusLabel, onClick }) {
  const statusStyles = getStatusStyles(order.status);
  const hasMaster =
    order.master_name ||
    order.master_rating !== null ||
    order.master_rating !== undefined;

  return (
    <button
      type="button"
      onClick={() => onClick(order)}
      className="block w-full rounded-[28px] border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusStyles.dot}`} />
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {formatPublicOrderCode(order.id)}
              </p>
            </div>

            <h3 className="mt-2 break-words text-xl font-bold text-[#25302c] [overflow-wrap:anywhere]">
              {order.service_name}
            </h3>

            <p className="mt-1 break-words text-sm text-gray-500 [overflow-wrap:anywhere]">
              {order.category}
            </p>
          </div>

          <div
            className={`inline-flex shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${statusStyles.badge}`}
          >
            {getStatusLabel(order.status)}
          </div>
        </div>

        <p className="line-clamp-2 break-words text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
          {order.description}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-[#fbfcfb] p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <MapPin size={14} />
              Адрес
            </div>
            <p className="mt-2 break-words text-sm text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
              {order.address}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-[#fbfcfb] p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <CalendarDays size={14} />
              Дата
            </div>
            <p className="mt-2 break-words text-sm text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
              {order.scheduled_at}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#dbe9d7] bg-[#f8fcf7] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Wallet size={14} />
                Цена
              </div>
              <p className="mt-2 break-words text-lg font-bold text-[#25302c] sm:text-xl [overflow-wrap:anywhere]">
                {getDisplayPrice(order)}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[#fbfcfb] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                <UserRound size={14} />
                Мастер
              </div>

              {hasMaster ? (
                <div className="mt-2 space-y-1">
                  <p className="break-words text-sm font-semibold text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
                    {order.master_name || "Назначен"}
                  </p>

                  {(order.master_rating !== null &&
                    order.master_rating !== undefined) && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star size={14} className="fill-current text-amber-400" />
                      {order.master_rating}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Пока не назначен
                </p>
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-end rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-semibold text-[#5e8d58]">
            Подробнее
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </button>
  );
}