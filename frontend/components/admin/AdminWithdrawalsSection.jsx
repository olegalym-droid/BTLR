function formatMoney(value) {
  const raw = String(value || "0").replace(/[^\d]/g, "");
  const amount = raw ? Number(raw) : 0;
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function getStatusLabel(status) {
  if (status === "pending") return "На рассмотрении";
  if (status === "approved") return "Одобрено";
  if (status === "rejected") return "Отклонено";
  return status;
}

function getStatusClasses(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function getCardSystemLabel(brand) {
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  return "Карта";
}

export default function AdminWithdrawalsSection({
  withdrawalRequests,
  updateWithdrawalStatus,
}) {
  if (!withdrawalRequests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        Нет заявок на вывод
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawalRequests.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-black">
                {formatMoney(item.amount)}
              </p>

              <p className="text-sm text-gray-600">
                Система: {getCardSystemLabel(item.card_brand)}
              </p>

              <p className="text-sm text-gray-600">
                Карта: {item.masked_card_number || "—"}
              </p>

              <p className="text-sm text-gray-600">
                Получатель: {item.card_holder_name}
              </p>

              <p className="text-xs text-gray-500">
                {formatDate(item.created_at)}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div
                className={`inline-flex rounded-full border px-3 py-2 text-sm font-medium ${getStatusClasses(
                  item.status,
                )}`}
              >
                {getStatusLabel(item.status)}
              </div>

              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateWithdrawalStatus(item.id, "approved")
                    }
                    className="rounded-xl bg-black px-3 py-2 text-xs font-medium text-white"
                  >
                    Одобрить
                  </button>

                  <button
                    onClick={() =>
                      updateWithdrawalStatus(item.id, "rejected")
                    }
                    className="rounded-xl border border-black px-3 py-2 text-xs font-medium text-black"
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}