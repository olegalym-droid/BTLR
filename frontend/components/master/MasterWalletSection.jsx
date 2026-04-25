import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Info,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

const DEFAULT_WITHDRAW_FORM = {
  amount: "",
  cardNumber: "",
  cardHolderName: "",
};

function formatMoney(value) {
  const raw = String(value || "0").replace(/[^\d]/g, "");
  const amount = raw ? Number(raw) : 0;
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

function parseMoney(value) {
  const raw = String(value || "").replace(/[^\d]/g, "");
  return raw ? Number(raw) : 0;
}

function formatMoneyInput(value) {
  const amount = parseMoney(value);
  return amount ? amount.toLocaleString("ru-RU") : "";
}

function formatCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatCardHolderName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .slice(0, 100);
}

function formatWithdrawalDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function getWithdrawalStatusLabel(status) {
  if (status === "pending") return "На рассмотрении";
  if (status === "approved") return "Одобрено";
  if (status === "rejected") return "Отклонено";
  return status;
}

function getWithdrawalStatusClasses(status) {
  if (status === "approved") {
    return "border-[#cfe6d2] bg-[#f1f8f1] text-[#407a45]";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-800";
}

function detectCardInfo(cardNumber, cardBrand = "") {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  const normalizedBrand = String(cardBrand || "").toLowerCase();

  let system = "Карта";
  let colorClass = "from-[#151c23] via-[#202a32] to-[#2d3a43]";
  let logoText = "CARD";

  if (normalizedBrand === "visa" || /^4/.test(digits)) {
    system = "Visa";
    logoText = "VISA";
    colorClass = "from-[#172554] via-[#1d4ed8] to-[#60a5fa]";
  } else if (
    normalizedBrand === "mastercard" ||
    /^(5[1-5]|22[2-9]|2[3-6]|27[01]|2720)/.test(digits)
  ) {
    system = "Mastercard";
    logoText = "MC";
    colorClass = "from-[#111827] via-[#374151] to-[#c2410c]";
  }

  return {
    system,
    colorClass,
    logoText,
  };
}

function isValidCardLength(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  return digits.length >= 12 && digits.length <= 19;
}

function maskCardForPreview(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");

  if (!digits) {
    return "0000 0000 0000 0000";
  }

  return formatCardNumber(digits);
}

function Field({ label, hint = "", children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#26312c]">{label}</span>
      {children}
      {hint && <p className="text-xs font-medium text-gray-500">{hint}</p>}
    </label>
  );
}

export default function MasterWalletSection({ masterProfile }) {
  const [walletBalance, setWalletBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawForm, setWithdrawForm] = useState(DEFAULT_WITHDRAW_FORM);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isWithdrawalSubmitting, setIsWithdrawalSubmitting] = useState(false);
  const [walletSuccessText, setWalletSuccessText] = useState("");

  const availableAmountValue = useMemo(
    () => parseMoney(walletBalance?.available_withdraw_amount),
    [walletBalance?.available_withdraw_amount],
  );

  const enteredAmountValue = useMemo(
    () => parseMoney(withdrawForm.amount),
    [withdrawForm.amount],
  );

  const cardDigits = useMemo(
    () => withdrawForm.cardNumber.replace(/\D/g, ""),
    [withdrawForm.cardNumber],
  );

  const cardInfo = useMemo(
    () => detectCardInfo(withdrawForm.cardNumber),
    [withdrawForm.cardNumber],
  );

  const cardValidationState = useMemo(() => {
    if (!cardDigits.length) {
      return {
        isReady: false,
        isValid: false,
        message: "",
      };
    }

    if (!isValidCardLength(cardDigits)) {
      return {
        isReady: true,
        isValid: false,
        message: "Введите корректный номер карты",
      };
    }

    return {
      isReady: true,
      isValid: true,
      message: "Номер карты выглядит корректно",
    };
  }, [cardDigits]);

  const loadWalletData = useCallback(async () => {
    if (!masterProfile?.id) {
      return;
    }

    try {
      setIsWalletLoading(true);

      const [balanceResponse, withdrawalsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/masters/${masterProfile.id}/balance`),
        fetch(`${API_BASE_URL}/masters/${masterProfile.id}/withdrawals`),
      ]);

      const balanceData = await balanceResponse.json();
      const withdrawalsData = await withdrawalsResponse.json();

      if (!balanceResponse.ok) {
        throw new Error(balanceData.detail || "Не удалось загрузить баланс");
      }

      if (!withdrawalsResponse.ok) {
        throw new Error(
          withdrawalsData.detail || "Не удалось загрузить историю выводов",
        );
      }

      setWalletBalance(balanceData || null);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.error("Ошибка загрузки кошелька:", error);
      alert(error.message || "Не удалось загрузить кошелёк");
    } finally {
      setIsWalletLoading(false);
    }
  }, [masterProfile?.id]);

  useEffect(() => {
    if (masterProfile?.id) {
      loadWalletData();
    }
  }, [loadWalletData, masterProfile?.id]);

  const handleWithdrawInputChange = (field, value) => {
    setWalletSuccessText("");

    setWithdrawForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateWithdrawalForm = () => {
    if (!masterProfile?.id) {
      throw new Error("Профиль мастера не загружен");
    }

    if (enteredAmountValue <= 0) {
      throw new Error("Укажите сумму вывода");
    }

    if (enteredAmountValue > availableAmountValue) {
      throw new Error("Сумма больше доступной для вывода");
    }

    if (!withdrawForm.cardHolderName.trim()) {
      throw new Error("Укажите имя владельца");
    }

    if (withdrawForm.cardHolderName.trim().split(" ").length < 2) {
      throw new Error("Введите имя и фамилию владельца");
    }

    if (!isValidCardLength(cardDigits)) {
      throw new Error("Введите корректный номер карты");
    }
  };

  const handleSubmitWithdrawal = async () => {
    try {
      validateWithdrawalForm();
      setIsWithdrawalSubmitting(true);
      setWalletSuccessText("");

      const response = await fetch(
        `${API_BASE_URL}/masters/${masterProfile.id}/withdrawals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: String(enteredAmountValue),
            card_number: cardDigits,
            card_holder_name: withdrawForm.cardHolderName.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось отправить заявку на вывод");
      }

      setWithdrawForm(DEFAULT_WITHDRAW_FORM);
      setWalletSuccessText("Заявка на вывод отправлена");
      await loadWalletData();
    } catch (error) {
      console.error("Ошибка вывода средств:", error);
      alert(error.message || "Не удалось отправить заявку на вывод");
    } finally {
      setIsWithdrawalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf4e8] px-4 py-2 text-sm font-semibold text-[#5f9557]">
              <Wallet size={17} />
              Кошелёк
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#151c23]">
              Баланс мастера
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Начисления за выполненные и оплаченные заказы.
            </p>
          </div>

          {isWalletLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-[#fbfdfb] p-5 text-sm font-semibold text-gray-600">
              Загрузка кошелька...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[28px] bg-gradient-to-br from-[#151c23] via-[#202a32] to-[#2d3a43] p-6 text-white shadow-sm">
                <p className="text-sm font-medium text-white/70">
                  Доступно к выводу
                </p>

                <p className="mt-4 text-4xl font-bold tracking-tight">
                  {formatMoney(walletBalance?.available_withdraw_amount)}
                </p>

                <div className="mt-8 flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>Кошелёк мастера</span>
                  <span>ID: {masterProfile?.id || "—"}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-[#d7ead6] bg-[#fbfdfb] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
                    <Banknote size={22} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-500">
                      Общий баланс
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#407a45]">
                      {formatMoney(walletBalance?.balance_amount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm font-semibold leading-6 text-blue-700">
                <div className="mb-2 flex items-center gap-2">
                  <Info size={18} />
                  Важно
                </div>
                После отправки заявки сумма резервируется. Финальный статус
                выставляет администратор.
              </div>
            </div>
          )}
        </aside>

        <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-[#151c23]">
              Заявка на вывод средств
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Укажите карту, система автоматически определит платёжную систему.
            </p>
          </div>

          <div
            className={`rounded-[28px] bg-gradient-to-br ${cardInfo.colorClass} p-6 text-white shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  Карта
                </p>

                <p className="mt-7 break-all text-2xl font-bold tracking-[0.24em] sm:text-3xl">
                  {maskCardForPreview(withdrawForm.cardNumber)}
                </p>
              </div>

              <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80">
                {cardInfo.logoText}
              </div>
            </div>

            <div className="mt-9 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-white/60">
                  Card holder
                </p>
                <p className="mt-1 text-sm font-bold">
                  {withdrawForm.cardHolderName || "IVAN IVANOV"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold uppercase text-white/60">
                  Type
                </p>
                <p className="mt-1 text-sm font-bold">{cardInfo.system}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field
              label="Сумма вывода"
              hint={`Доступно сейчас: ${formatMoney(
                walletBalance?.available_withdraw_amount,
              )}`}
            >
              <input
                type="text"
                inputMode="numeric"
                value={withdrawForm.amount}
                onChange={(event) =>
                  handleWithdrawInputChange(
                    "amount",
                    formatMoneyInput(event.target.value),
                  )
                }
                className="w-full min-h-[56px] rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                placeholder="Например 15 000"
              />
            </Field>

            <Field
              label="Платёжная система"
              hint="Определяется автоматически по номеру карты."
            >
              <div className="flex min-h-[56px] items-center justify-between rounded-2xl border border-gray-200 bg-[#fbfdfb] px-4 py-4 text-base font-bold text-[#151c23]">
                <span>{cardInfo.system}</span>
                <CreditCard size={20} className="text-[#5f9557]" />
              </div>
            </Field>

            <div className="lg:col-span-2">
              <Field label="Номер карты">
                <input
                  type="text"
                  inputMode="numeric"
                  value={withdrawForm.cardNumber}
                  onChange={(event) =>
                    handleWithdrawInputChange(
                      "cardNumber",
                      formatCardNumber(event.target.value),
                    )
                  }
                  className="w-full min-h-[56px] rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                  placeholder="0000 0000 0000 0000"
                />

                {cardValidationState.message && (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      cardValidationState.isValid
                        ? "text-[#407a45]"
                        : "text-red-500"
                    }`}
                  >
                    {cardValidationState.message}
                  </p>
                )}
              </Field>
            </div>

            <div className="lg:col-span-2">
              <Field
                label="Имя владельца"
                hint="Только латиница, как в банковском приложении или на карте."
              >
                <input
                  type="text"
                  value={withdrawForm.cardHolderName}
                  onChange={(event) =>
                    handleWithdrawInputChange(
                      "cardHolderName",
                      formatCardHolderName(event.target.value),
                    )
                  }
                  className="w-full min-h-[56px] rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                  placeholder="IVAN IVANOV"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-[#fbfdfb] px-4 py-4 text-sm font-semibold text-gray-600">
            <span>К выплате</span>
            <span className="text-lg font-bold text-[#151c23]">
              {formatMoney(enteredAmountValue)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmitWithdrawal}
            disabled={isWithdrawalSubmitting || isWalletLoading}
            className="mt-5 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5f9557] disabled:opacity-60"
          >
            <Send size={20} />
            {isWithdrawalSubmitting
              ? "Отправка заявки..."
              : "Отправить заявку на вывод"}
          </button>

          {walletSuccessText && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfe6d2] bg-[#f1f8f1] px-4 py-3 text-sm font-bold text-[#407a45]">
              <CheckCircle2 size={20} />
              {walletSuccessText}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#151c23]">
              История выводов
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Все отправленные заявки на вывод средств.
            </p>
          </div>

          <button
            type="button"
            onClick={loadWalletData}
            disabled={isWalletLoading}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#5f9557] transition hover:bg-[#f7faf6] disabled:opacity-60"
          >
            <RefreshCw
              size={20}
              className={isWalletLoading ? "animate-spin" : ""}
            />
            Обновить
          </button>
        </div>

        {isWalletLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
            Загрузка истории...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
            У вас пока нет заявок на вывод.
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((item) => {
              const historyCardInfo = detectCardInfo(
                item.card_number,
                item.card_brand,
              );

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:bg-[#fbfdfb]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-[#407a45]">
                        {formatMoney(item.amount)}
                      </p>

                      <div className="mt-3 space-y-1 text-sm font-semibold text-gray-600">
                        <p className="break-words [overflow-wrap:anywhere]">
                          Карта: {item.masked_card_number || item.card_number}
                        </p>
                        <p>Система: {historyCardInfo.system}</p>
                        <p className="break-words [overflow-wrap:anywhere]">
                          Получатель: {item.card_holder_name}
                        </p>
                        <p className="text-gray-400">
                          {formatWithdrawalDate(item.created_at)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getWithdrawalStatusClasses(
                        item.status,
                      )}`}
                    >
                      {getWithdrawalStatusLabel(item.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
