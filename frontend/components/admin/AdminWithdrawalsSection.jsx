import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

const PANEL_CLASSNAME =
  "rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6";
const ICON_LINE_CLASSNAME =
  "flex items-center gap-3 text-base font-semibold text-[#111827]";

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
    return "border-green-200 bg-green-50 text-[#4f7f56]";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function getCardSystemLabel(brand) {
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  return "Карта";
}

export default function AdminWithdrawalsSection({
  withdrawalRequests,
  isLoading,
  updateWithdrawalStatus,
}) {
  if (!withdrawalRequests.length) {
    return (
      <div className={`${PANEL_CLASSNAME} border-dashed text-sm font-semibold text-gray-500`}>
        Нет заявок на вывод
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawalRequests.map((item) => (
        <div key={item.id} className={PANEL_CLASSNAME}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-3xl font-bold text-[#4f7f56] sm:text-4xl">
                {formatMoney(item.amount)}
              </p>

              <div className="space-y-3">
                <p className={ICON_LINE_CLASSNAME}>
                  <CreditCard size={22} className="text-gray-500" />
                  Система: {getCardSystemLabel(item.card_brand)}
                </p>

                <p className={ICON_LINE_CLASSNAME}>
                  <WalletCards size={22} className="text-gray-500" />
                  Карта: {item.masked_card_number || "—"}
                </p>

                <p className={ICON_LINE_CLASSNAME}>
                  <UserRound size={22} className="text-gray-500" />
                  Получатель: {item.card_holder_name || "—"}
                </p>

                <p className={ICON_LINE_CLASSNAME}>
                  <CalendarDays size={22} className="text-gray-500" />
                  {formatDate(item.created_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div
                className={`inline-flex w-fit rounded-full border px-4 py-3 text-base font-bold ${getStatusClasses(
                  item.status,
                )}`}
              >
                {getStatusLabel(item.status)}
              </div>

              {item.status === "pending" && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateWithdrawalStatus(item.id, "approved", item)
                    }
                    className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] bg-[#4f7f56] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#416f48]"
                  >
                    <CheckCircle2 size={20} />
                    Одобрить
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateWithdrawalStatus(item.id, "rejected", item)
                    }
                    className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#111827] shadow-sm transition hover:bg-[#f8faf8]"
                  >
                    <XCircle size={20} />
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
