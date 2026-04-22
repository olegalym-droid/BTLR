import { useMemo, useState } from "react";

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решена" },
  { value: "rejected", label: "Отклонена" },
];

const PAYMENT_BLOCKING_STATUSES = ["new", "in_progress"];

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "—"
  );
}

function getStatusBadgeClass(status) {
  const base =
    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold";

  if (status === "resolved") {
    return `${base} border-green-300 bg-green-50 text-green-800`;
  }

  if (status === "rejected") {
    return `${base} border-red-300 bg-red-50 text-red-800`;
  }

  if (status === "in_progress") {
    return `${base} border-yellow-300 bg-yellow-50 text-yellow-800`;
  }

  return `${base} border-gray-300 bg-gray-100 text-gray-800`;
}

function getPaymentState(complaint) {
  const isBlocking = PAYMENT_BLOCKING_STATUSES.includes(complaint.status);

  if (isBlocking) {
    return {
      label: "Оплата заблокирована",
      className:
        "inline-flex rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800",
      description:
        "Пока жалоба активна, пользователь не сможет оплатить заказ.",
    };
  }

  return {
    label: "Оплата разрешена",
    className:
      "inline-flex rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800",
    description: "После закрытия спора оплату по заказу снова можно провести.",
  };
}

function formatMoney(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  const amount = digits ? Number(digits) : 0;
  return amount ? `${amount.toLocaleString("ru-RU")} ₸` : "—";
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
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-300 bg-gray-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        {label}
      </div>
      <div className="text-sm font-semibold text-black">{value || "—"}</div>
    </div>
  );
}

export default function AdminComplaintsSection({
  complaints,
  isLoading,
  updateComplaintStatus,
}) {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all");
  const [openedComplaintId, setOpenedComplaintId] = useState(null);
  const [processingComplaintId, setProcessingComplaintId] = useState(null);

  const counts = useMemo(() => {
    const source = Array.isArray(complaints) ? complaints : [];

    return {
      all: source.length,
      new: source.filter((item) => item.status === "new").length,
      in_progress: source.filter((item) => item.status === "in_progress")
        .length,
      resolved: source.filter((item) => item.status === "resolved").length,
      rejected: source.filter((item) => item.status === "rejected").length,
      blocking: source.filter((item) =>
        PAYMENT_BLOCKING_STATUSES.includes(item.status),
      ).length,
      openPayment: source.filter(
        (item) => !PAYMENT_BLOCKING_STATUSES.includes(item.status),
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
        PAYMENT_BLOCKING_STATUSES.includes(item.status),
      );
    }

    if (selectedPaymentMode === "open") {
      items = items.filter(
        (item) => !PAYMENT_BLOCKING_STATUSES.includes(item.status),
      );
    }

    return items;
  }, [complaints, selectedStatus, selectedPaymentMode]);

  const handleQuickStatusUpdate = async (complaintId, status) => {
    try {
      setProcessingComplaintId(complaintId);
      await updateComplaintStatus(complaintId, status);
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-black">Жалобы и споры</h2>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Активные жалобы блокируют оплату заказа до решения администратора
            </p>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
            Всего жалоб: <span className="text-black">{counts.all}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedStatus === "all"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            Все ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("new")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedStatus === "new"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            Новые ({counts.new})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("in_progress")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedStatus === "in_progress"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            В работе ({counts.in_progress})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("resolved")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedStatus === "resolved"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            Решены ({counts.resolved})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("rejected")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedStatus === "rejected"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            Отклонены ({counts.rejected})
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedPaymentMode("blocking")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedPaymentMode === "blocking"
                ? "bg-orange-500 text-white"
                : "border border-orange-300 bg-orange-50 text-orange-800"
            }`}
          >
            Только блокирующие оплату ({counts.blocking})
          </button>

          <button
            type="button"
            onClick={() => setSelectedPaymentMode("open")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedPaymentMode === "open"
                ? "bg-green-600 text-white"
                : "border border-green-300 bg-green-50 text-green-800"
            }`}
          >
            Только не блокирующие ({counts.openPayment})
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentMode("all")}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            Сбросить фильтр по оплате
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-300 bg-white p-6 text-sm font-medium text-gray-700 shadow">
            Загрузка жалоб...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-400 bg-white p-6 text-sm font-medium text-gray-700 shadow">
            Жалоб по выбранным фильтрам нет
          </div>
        ) : (
          filteredComplaints.map((complaint) => {
            const isOpened = openedComplaintId === complaint.id;
            const isProcessing = processingComplaintId === complaint.id;
            const paymentState = getPaymentState(complaint);

            return (
              <div
                key={complaint.id}
                className="rounded-3xl border border-gray-300 bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-black">
                        Жалоба #{complaint.id}
                      </span>

                      <span className={getStatusBadgeClass(complaint.status)}>
                        {getStatusLabel(complaint.status)}
                      </span>

                      <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        Заказ #{complaint.order_id}
                      </span>

                      <span className={paymentState.className}>
                        {paymentState.label}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl border border-gray-300 bg-orange-50 p-4">
                      <div className="text-sm font-bold text-orange-900">
                        Финансовый статус спора
                      </div>
                      <div className="mt-1 text-sm font-medium text-orange-800">
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

                    <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Текст жалобы
                      </div>
                      <div className="mt-2 text-sm font-medium leading-6 text-gray-900">
                        {complaint.text}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-[260px]">
                    <button
                      type="button"
                      onClick={() => toggleComplaint(complaint.id)}
                      className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-black"
                    >
                      {isOpened ? "Скрыть управление" : "Открыть управление"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isProcessing || complaint.status === "in_progress"
                      }
                      onClick={() =>
                        handleQuickStatusUpdate(complaint.id, "in_progress")
                      }
                      className="rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Взять в работу
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || complaint.status === "resolved"}
                      onClick={() =>
                        handleQuickStatusUpdate(complaint.id, "resolved")
                      }
                      className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Решить спор
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || complaint.status === "rejected"}
                      onClick={() =>
                        handleQuickStatusUpdate(complaint.id, "rejected")
                      }
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Отклонить жалобу
                    </button>
                  </div>
                </div>

                {isOpened && (
                  <div className="mt-5 rounded-2xl border border-gray-300 bg-gray-50 p-4">
                    <div className="text-sm font-bold text-black">
                      Управление спором
                    </div>

                    <div className="mt-2 text-sm font-medium text-gray-700">
                      Пока жалоба имеет статус{" "}
                      <span className="font-bold text-black">Новая</span> или{" "}
                      <span className="font-bold text-black">В работе</span>,
                      оплата по заказу заблокирована. После статусов{" "}
                      <span className="font-bold text-black">Решена</span> или{" "}
                      <span className="font-bold text-black">Отклонена</span>{" "}
                      оплата снова становится доступной.
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {STATUS_OPTIONS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          disabled={
                            isProcessing || complaint.status === item.value
                          }
                          onClick={() =>
                            handleQuickStatusUpdate(complaint.id, item.value)
                          }
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            complaint.status === item.value
                              ? "bg-black text-white"
                              : "border border-gray-300 bg-white text-black"
                          } disabled:opacity-60`}
                        >
                          {isProcessing && complaint.status !== item.value
                            ? "Обновление..."
                            : item.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4">
                        <div className="text-sm font-bold text-orange-900">
                          Когда статус new / in_progress
                        </div>
                        <div className="mt-1 text-sm font-medium text-orange-800">
                          Пользователь не сможет оплатить заказ. Деньги не
                          попадут на баланс мастера.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-green-300 bg-green-50 p-4">
                        <div className="text-sm font-bold text-green-900">
                          Когда статус resolved / rejected
                        </div>
                        <div className="mt-1 text-sm font-medium text-green-800">
                          Блокировка оплаты снимается, и заказ можно будет
                          оплатить.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs font-medium text-gray-700">
                      Следующий сильный шаг — добавить комментарий
                      администратора и чат по конкретной жалобе.
                    </div>
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
