import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Lock,
  MessageSquare,
  Settings,
  Shield,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "needs_details", label: "Нужны детали" },
  { value: "resolved", label: "Решена" },
  { value: "rejected", label: "Отклонена" },
];

const DECISION_OPTIONS = [
  {
    resolution: "client_favor",
    label: "В пользу клиента",
    impact: "Деньги мастеру не уйдут",
    status: "resolved",
    className: "bg-[#1f9d4c] text-white hover:bg-[#198941]",
  },
  {
    resolution: "master_favor",
    label: "В пользу мастера",
    impact: "Деньги станут доступны мастеру",
    status: "resolved",
    className: "bg-[#4f7f56] text-white hover:bg-[#416f48]",
  },
  {
    resolution: "needs_details",
    label: "Запросить детали",
    impact: "Оплата остаётся заблокирована",
    status: "needs_details",
    className: "bg-yellow-500 text-white hover:bg-yellow-600",
  },
  {
    resolution: "rejected",
    label: "Отклонить жалобу",
    impact: "Оплата снова доступна",
    status: "rejected",
    className: "bg-red-500 text-white hover:bg-red-600",
  },
];

const PAYMENT_BLOCKING_STATUSES = ["new", "in_progress", "needs_details"];
const PANEL_CLASSNAME =
  "rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6";
const FILTER_BUTTON_BASE =
  "min-h-[54px] rounded-[18px] px-4 py-3 text-sm font-bold transition";
const FILTER_BUTTON_ACTIVE =
  "bg-[#4f7f56] text-white shadow-[0_12px_28px_rgba(79,127,86,0.25)]";
const FILTER_BUTTON_IDLE =
  "border border-gray-200 bg-white text-[#374151] shadow-sm hover:bg-[#f8faf8]";

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "—"
  );
}

function getStatusBadgeClass(status) {
  const base =
    "inline-flex rounded-full border px-3 py-1 text-xs font-bold";

  if (status === "resolved") {
    return `${base} border-green-200 bg-green-50 text-[#4f7f56]`;
  }

  if (status === "rejected") {
    return `${base} border-red-200 bg-red-50 text-red-700`;
  }

  if (status === "in_progress") {
    return `${base} border-yellow-200 bg-yellow-50 text-yellow-700`;
  }

  if (status === "needs_details") {
    return `${base} border-orange-200 bg-orange-50 text-orange-700`;
  }

  return `${base} border-gray-200 bg-gray-50 text-gray-700`;
}

function getPaymentState(complaint) {
  const isBlocking =
    complaint.payment_blocked === undefined
      ? PAYMENT_BLOCKING_STATUSES.includes(complaint.status)
      : complaint.payment_blocked;

  if (isBlocking) {
    return {
      label: "Оплата заблокирована",
      badgeClassName:
        "inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700",
      bannerClassName:
        "border-orange-200 bg-orange-50 text-orange-800",
      iconClassName: "text-orange-600",
      description:
        "Пока жалоба активна, пользователь не сможет оплатить заказ.",
    };
  }

  return {
    label: "Оплата разрешена",
    badgeClassName:
      "inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-[#4f7f56]",
    bannerClassName: "border-green-200 bg-green-50 text-green-800",
    iconClassName: "text-[#4f7f56]",
    description: "После закрытия спора оплату по заказу снова можно провести.",
  };
}

function formatMoney(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  const amount = digits ? Number(digits) : 0;
  return amount ? `${amount.toLocaleString("ru-RU")} ₸` : "—";
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function getOrderStatusLabel(status) {
  const map = {
    searching: "Ищем мастера",
    pending_user_confirmation: "Ожидает выбора мастера",
    assigned: "Мастер назначен",
    on_the_way: "Мастер едет",
    on_site: "Мастер на месте",
    completed: "Работа завершена",
    paid: "Оплачено",
  };

  return map[status] || status || "—";
}

function InfoRow({ label, value }) {
  return (
    <div className="flex min-h-[76px] flex-col justify-center gap-1 rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase text-gray-500">{label}</div>
      <div className="break-words text-sm font-bold text-[#111827]">
        {value || "—"}
      </div>
    </div>
  );
}

export default function AdminComplaintsSection({
  complaints,
  isLoading,
  updateComplaintStatus,
  onOpenChatTarget,
}) {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all");
  const [openedComplaintId, setOpenedComplaintId] = useState(null);
  const [processingComplaintId, setProcessingComplaintId] = useState(null);
  const [adminComments, setAdminComments] = useState({});

  const counts = useMemo(() => {
    const source = Array.isArray(complaints) ? complaints : [];

    return {
      all: source.length,
      new: source.filter((item) => item.status === "new").length,
      in_progress: source.filter((item) => item.status === "in_progress")
        .length,
      needs_details: source.filter((item) => item.status === "needs_details")
        .length,
      resolved: source.filter((item) => item.status === "resolved").length,
      rejected: source.filter((item) => item.status === "rejected").length,
      blocking: source.filter((item) =>
        item.payment_blocked === undefined
          ? PAYMENT_BLOCKING_STATUSES.includes(item.status)
          : item.payment_blocked,
      ).length,
      openPayment: source.filter(
        (item) =>
          !(item.payment_blocked === undefined
            ? PAYMENT_BLOCKING_STATUSES.includes(item.status)
            : item.payment_blocked),
      ).length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let items = Array.isArray(complaints) ? [...complaints] : [];

    if (selectedStatus !== "all") {
      items = items.filter((item) => item.status === selectedStatus);
    }

    if (selectedPaymentMode === "blocking") {
      items = items.filter((item) =>
        item.payment_blocked === undefined
          ? PAYMENT_BLOCKING_STATUSES.includes(item.status)
          : item.payment_blocked,
      );
    }

    if (selectedPaymentMode === "open") {
      items = items.filter(
        (item) =>
          !(item.payment_blocked === undefined
            ? PAYMENT_BLOCKING_STATUSES.includes(item.status)
            : item.payment_blocked),
      );
    }

    return items;
  }, [complaints, selectedStatus, selectedPaymentMode]);

  const handleQuickStatusUpdate = async (complaintId, statusOrPayload) => {
    try {
      setProcessingComplaintId(complaintId);
      await updateComplaintStatus(complaintId, statusOrPayload);
    } catch (error) {
      console.error("Ошибка обновления жалобы:", error);
    } finally {
      setProcessingComplaintId(null);
    }
  };

  const toggleComplaint = (complaintId) => {
    setOpenedComplaintId((current) =>
      current === complaintId ? null : complaintId,
    );
  };

  const getAdminCommentValue = (complaint) =>
    adminComments[complaint.id] ?? complaint.admin_comment ?? "";

  const updateAdminCommentValue = (complaintId, value) => {
    setAdminComments((current) => ({
      ...current,
      [complaintId]: value,
    }));
  };

  const handleDecision = async (complaint, decision) => {
    await handleQuickStatusUpdate(complaint.id, {
      status: decision.status,
      resolution: decision.resolution,
      adminComment: getAdminCommentValue(complaint),
    });
  };

  return (
    <div className="space-y-6">
      <div className={PANEL_CLASSNAME}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">
              Жалобы и споры
            </h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Активные жалобы блокируют оплату заказа до решения администратора
            </p>
          </div>

          <div className="w-fit rounded-[18px] border border-gray-200 bg-[#fbfcfb] px-5 py-3 text-sm font-bold text-gray-600 shadow-sm">
            Всего жалоб: <span className="text-[#111827]">{counts.all}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "all"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            Все ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("new")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "new"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            Новые ({counts.new})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("in_progress")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "in_progress"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            В работе ({counts.in_progress})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("resolved")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "resolved"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            Решены ({counts.resolved})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("needs_details")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "needs_details"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            Детали ({counts.needs_details})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("rejected")}
            className={`${FILTER_BUTTON_BASE} ${
              selectedStatus === "rejected"
                ? FILTER_BUTTON_ACTIVE
                : FILTER_BUTTON_IDLE
            }`}
          >
            Отклонены ({counts.rejected})
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedPaymentMode("blocking")}
            className={`inline-flex min-h-[60px] items-center justify-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
              selectedPaymentMode === "blocking"
                ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                : "border-orange-200 bg-white text-orange-700 shadow-sm hover:bg-orange-50"
            }`}
          >
            <Lock size={20} />
            Только блокирующие оплату ({counts.blocking})
          </button>

          <button
            type="button"
            onClick={() => setSelectedPaymentMode("open")}
            className={`inline-flex min-h-[60px] items-center justify-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
              selectedPaymentMode === "open"
                ? "border-green-300 bg-green-50 text-[#4f7f56] shadow-sm"
                : "border-green-200 bg-white text-[#4f7f56] shadow-sm hover:bg-green-50"
            }`}
          >
            <CheckCircle2 size={20} />
            Только не блокирующие ({counts.openPayment})
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSelectedPaymentMode("all")}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-500 shadow-sm transition hover:bg-[#f8faf8]"
          >
            <Filter size={18} />
            Сбросить фильтр по оплате
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className={`${PANEL_CLASSNAME} text-sm font-semibold text-gray-500`}>
            Загрузка жалоб...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className={`${PANEL_CLASSNAME} border-dashed text-sm font-semibold text-gray-500`}>
            Жалоб по выбранным фильтрам нет
          </div>
        ) : (
          filteredComplaints.map((complaint) => {
            const isOpened = openedComplaintId === complaint.id;
            const isProcessing = processingComplaintId === complaint.id;
            const paymentState = getPaymentState(complaint);

            return (
              <div key={complaint.id} className={PANEL_CLASSNAME}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-[#111827]">
                        Жалоба #{complaint.id}
                      </span>

                      <span className={getStatusBadgeClass(complaint.status)}>
                        {getStatusLabel(complaint.status)}
                      </span>

                      <span className="rounded-full border border-gray-200 bg-[#fbfcfb] px-3 py-1 text-xs font-bold text-gray-600">
                        Заказ #{complaint.order_id}
                      </span>

                      <span className={paymentState.badgeClassName}>
                        {paymentState.label}
                      </span>
                    </div>

                    <div
                      className={`mt-4 rounded-[20px] border p-4 ${paymentState.bannerClassName}`}
                    >
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Shield size={20} className={paymentState.iconClassName} />
                        Финансовый статус спора
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {paymentState.description}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoRow
                        label="Пользователь"
                        value={complaint.user_name || `ID ${complaint.user_id}`}
                      />
                      <InfoRow
                        label="ID пользователя"
                        value={String(complaint.user_id)}
                      />
                      <InfoRow
                        label="Причина"
                        value={complaint.reason_label || "Другое"}
                      />
                      <InfoRow
                        label="Мастер"
                        value={complaint.order?.master_name || "Не назначен"}
                      />
                      <InfoRow
                        label="Услуга"
                        value={complaint.order?.service_name || "—"}
                      />
                      <InfoRow
                        label="Категория"
                        value={complaint.order?.category || "—"}
                      />
                      <InfoRow
                        label="Статус заказа"
                        value={getOrderStatusLabel(complaint.order?.status)}
                      />
                      <InfoRow
                        label="Статус оплаты"
                        value={
                          complaint.order?.payment_blocked
                            ? "Оплата заблокирована"
                            : complaint.order?.payment_status === "paid"
                              ? "Оплачено"
                              : "Оплата доступна"
                        }
                      />
                      <InfoRow
                        label="Выплата мастеру"
                        value={
                          complaint.order?.payout_status === "frozen"
                            ? "Заморожена"
                            : complaint.order?.payout_status === "available"
                              ? "Доступна к выводу"
                              : complaint.order?.payout_status ===
                                  "refunded_to_client"
                                ? "Возврат клиенту"
                                : "Не начислена"
                        }
                      />
                      <InfoRow
                        label="Дата спора"
                        value={formatDateTime(complaint.created_at)}
                      />
                      <InfoRow
                        label="Итоговая цена"
                        value={
                          complaint.order?.price
                            ? formatMoney(complaint.order.price)
                            : complaint.order?.client_price
                              ? formatMoney(complaint.order.client_price)
                              : "—"
                        }
                      />
                    </div>

                    {(complaint.resolution_label ||
                      complaint.admin_comment) && (
                      <div className="mt-4 rounded-[20px] border border-green-200 bg-green-50 p-4">
                        {complaint.resolution_label && (
                          <div className="text-sm font-bold text-green-900">
                            Решение: {complaint.resolution_label}
                          </div>
                        )}
                        {complaint.admin_comment && (
                          <div className="mt-2 text-sm font-semibold text-green-800">
                            {complaint.admin_comment}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-bold uppercase text-gray-500">
                        Текст жалобы
                      </div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-[#111827]">
                        {complaint.text}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 lg:w-[290px]">
                    <button
                      type="button"
                      onClick={() => toggleComplaint(complaint.id)}
                      className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-[#f8faf8]"
                    >
                      <Settings size={20} />
                      {isOpened ? "Скрыть управление" : "Открыть управление"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenChatTarget?.("user", complaint.user_id)
                      }
                      className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-[#f8faf8]"
                    >
                      <MessageSquare size={20} />
                      Чат с клиентом
                    </button>

                    {complaint.order?.master_id ? (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenChatTarget?.(
                            "master",
                            complaint.order.master_id,
                          )
                        }
                        className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-[#f8faf8]"
                      >
                        <MessageSquare size={20} />
                        Чат с мастером
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={
                        isProcessing || complaint.status === "in_progress"
                      }
                      onClick={() =>
                        handleQuickStatusUpdate(complaint.id, "in_progress")
                      }
                      className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] bg-yellow-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600 disabled:opacity-60"
                    >
                      <Shield size={20} />
                      Взять в работу
                    </button>

                    <button
                      type="button"
                      disabled={
                        isProcessing || complaint.status === "needs_details"
                      }
                      onClick={() =>
                        handleQuickStatusUpdate(complaint.id, "needs_details")
                      }
                      className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      <MessageSquare size={20} />
                      Запросить детали
                    </button>
                  </div>
                </div>

                {isOpened && (
                  <div className="mt-6 rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-5">
                    <div className="text-sm font-bold text-[#111827]">
                      Управление спором
                    </div>

                    <div className="mt-2 text-sm font-semibold leading-6 text-gray-500">
                      Пока жалоба имеет статус{" "}
                      <span className="font-bold text-[#111827]">Новая</span>{" "}
                      или{" "}
                      <span className="font-bold text-[#111827]">
                        В работе
                      </span>
                      {" "}или{" "}
                      <span className="font-bold text-[#111827]">
                        Нужны детали
                      </span>
                      , оплата по заказу заблокирована. После статусов{" "}
                      <span className="font-bold text-[#111827]">Решена</span>{" "}
                      или{" "}
                      <span className="font-bold text-[#111827]">
                        Отклонена
                      </span>{" "}
                      оплата снова становится доступной.
                    </div>

                    <div className="mt-4 space-y-2">
                      <label
                        htmlFor={`admin-comment-${complaint.id}`}
                        className="text-xs font-bold uppercase text-gray-500"
                      >
                        Комментарий администратора
                      </label>
                      <textarea
                        id={`admin-comment-${complaint.id}`}
                        value={getAdminCommentValue(complaint)}
                        onChange={(event) =>
                          updateAdminCommentValue(
                            complaint.id,
                            event.target.value,
                          )
                        }
                        placeholder="Коротко объясните решение или что нужно уточнить"
                        className="min-h-[110px] w-full rounded-[20px] border border-gray-200 bg-white p-4 text-sm font-semibold text-[#111827] outline-none transition placeholder:text-gray-400 focus:border-[#4f7f56] focus:ring-4 focus:ring-[#e8f2e8]"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {STATUS_OPTIONS.filter(
                        (item) =>
                          item.value === "new" ||
                          item.value === "in_progress" ||
                          item.value === "needs_details",
                      ).map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          disabled={
                            isProcessing || complaint.status === item.value
                          }
                          onClick={() =>
                            handleQuickStatusUpdate(complaint.id, item.value)
                          }
                          className={`${FILTER_BUTTON_BASE} ${
                            complaint.status === item.value
                              ? FILTER_BUTTON_ACTIVE
                              : FILTER_BUTTON_IDLE
                          } disabled:opacity-60`}
                        >
                          {isProcessing && complaint.status !== item.value
                            ? "Обновление..."
                            : item.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {DECISION_OPTIONS.map((decision) => (
                        <button
                          key={decision.resolution}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDecision(complaint, decision)}
                          className={`inline-flex min-h-[72px] flex-col items-center justify-center rounded-[18px] px-4 py-3 text-sm font-bold shadow-sm transition disabled:opacity-60 ${decision.className}`}
                        >
                          <span>
                            {isProcessing ? "Обновление..." : decision.label}
                          </span>
                          <span className="mt-1 text-xs font-semibold opacity-80">
                            {decision.impact}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="rounded-[20px] border border-orange-200 bg-orange-50 p-4">
                        <div className="text-sm font-bold text-orange-900">
                          Когда статус new / in_progress / needs_details
                        </div>
                        <div className="mt-1 text-sm font-semibold text-orange-800">
                          Пользователь не сможет оплатить заказ. Деньги не
                          попадут на баланс мастера.
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-green-200 bg-green-50 p-4">
                        <div className="text-sm font-bold text-green-900">
                          Когда статус resolved / rejected
                        </div>
                        <div className="mt-1 text-sm font-semibold text-green-800">
                          Блокировка оплаты снимается, и заказ можно будет
                          оплатить.
                        </div>
                      </div>
                    </div>

                    {Array.isArray(complaint.history) &&
                      complaint.history.length > 0 && (
                        <div className="mt-4 rounded-[20px] border border-gray-200 bg-white p-4">
                          <div className="text-xs font-bold uppercase text-gray-500">
                            История спора
                          </div>
                          <div className="mt-3 space-y-2">
                            {complaint.history.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-gray-100 bg-[#fbfcfb] p-3 text-xs font-semibold text-gray-600"
                              >
                                <span className="text-[#111827]">
                                  {item.status_label || item.status}
                                </span>{" "}
                                · {formatDateTime(item.created_at)}
                                {item.resolution_label
                                  ? ` · ${item.resolution_label}`
                                  : ""}
                                {item.comment ? ` · ${item.comment}` : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
