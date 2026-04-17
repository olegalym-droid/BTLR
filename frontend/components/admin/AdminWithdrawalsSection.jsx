export default function AdminWithdrawalsSection({
  withdrawalRequests,
  isLoading,
  updateWithdrawalStatus,
}) {
  const formatMoney = (value) => {
    const raw = String(value || "0").replace(/[^\d]/g, "");
    const amount = raw ? Number(raw) : 0;

    return `${amount.toLocaleString("ru-RU")} ₸`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("ru-RU");
  };

  const getStatusLabel = (status) => {
    if (status === "pending") return "На рассмотрении";
    if (status === "approved") return "Одобрено";
    if (status === "rejected") return "Отклонено";
    return status;
  };

  const getStatusClasses = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-black">Заявки на вывод</h2>
        <p className="text-sm text-gray-600">
          Здесь администратор может одобрять или отклонять вывод средств мастеров
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Загрузка заявок...
        </div>
      ) : withdrawalRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Пока нет заявок на вывод
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawalRequests.map((item) => {
            const isPending = item.status === "pending";

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 p-4 space-y-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-black">
                      {formatMoney(item.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Мастер ID: {item.master_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Карта: {item.card_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Получатель: {item.card_holder_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div
                    className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${getStatusClasses(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </div>
                </div>

                {isPending && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => updateWithdrawalStatus(item.id, "approved")}
                      disabled={isLoading}
                      className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Одобрить
                    </button>

                    <button
                      type="button"
                      onClick={() => updateWithdrawalStatus(item.id, "rejected")}
                      disabled={isLoading}
                      className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}