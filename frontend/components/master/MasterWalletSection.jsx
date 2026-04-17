import { useEffect, useMemo, useState } from "react";
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
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function detectCardInfo(cardNumber, cardBrand = "") {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  const normalizedBrand = String(cardBrand || "").toLowerCase();

  let system = "Карта";
  let colorClass = "from-slate-900 via-slate-800 to-slate-700";
  let badgeClass = "border-white/20 text-white/70";
  let logoText = "CARD";

  if (normalizedBrand === "visa" || /^4/.test(digits)) {
    system = "Visa";
    logoText = "VISA";
    colorClass = "from-blue-950 via-blue-800 to-blue-600";
  } else if (
    normalizedBrand === "mastercard" ||
    /^(5[1-5]|22[2-9]|2[3-6]|27[01]|2720)/.test(digits)
  ) {
    system = "Mastercard";
    logoText = "MC";
    colorClass = "from-neutral-950 via-neutral-800 to-orange-600";
  }

  return {
    system,
    colorClass,
    badgeClass,
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

  const loadWalletData = async () => {
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
  };

  useEffect(() => {
    if (masterProfile?.id) {
      loadWalletData();
    }
  }, [masterProfile?.id]);

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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-4 rounded-3xl border border-gray-300 bg-white p-6 shadow xl:col-span-1">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black">Кошелёк</h2>
            <p className="text-sm text-gray-600">
              Начисления за выполненные и оплаченные заказы
            </p>
          </div>

          {isWalletLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Загрузка кошелька...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-black to-gray-800 p-5 text-white">
                <p className="text-sm text-white/70">Доступно к выводу</p>
                <p className="mt-3 text-3xl font-bold">
                  {formatMoney(walletBalance?.available_withdraw_amount)}
                </p>
                <div className="mt-6 flex items-center justify-between text-xs text-white/70">
                  <span>Кошелёк мастера</span>
                  <span>ID: {masterProfile?.id || "—"}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Общий баланс</p>
                <p className="mt-2 text-2xl font-bold text-black">
                  {formatMoney(walletBalance?.balance_amount)}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                После отправки заявки сумма резервируется. Финальный статус
                выставляет администратор.
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 rounded-3xl border border-gray-300 bg-white p-6 shadow xl:col-span-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black">
              Заявка на вывод средств
            </h2>
            <p className="text-sm text-gray-600">
              Укажи карту, система сама определит платёжную систему
            </p>
          </div>

          <div
            className={`rounded-3xl border border-gray-200 bg-gradient-to-br ${cardInfo.colorClass} p-5 text-white`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {cardInfo.system}
                </p>
                <p className="mt-6 break-all text-2xl font-semibold tracking-[0.2em]">
                  {maskCardForPreview(withdrawForm.cardNumber)}
                </p>
              </div>

              <div
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${cardInfo.badgeClass}`}
              >
                {cardInfo.logoText}
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] text-white/60">CARD HOLDER</p>
                <p className="mt-1 text-sm font-medium">
                  {withdrawForm.cardHolderName || "IVAN IVANOV"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-white/60">TYPE</p>
                <p className="mt-1 text-sm font-medium">{cardInfo.system}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Сумма вывода
              </label>
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
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                placeholder="Например 15 000"
              />
              <p className="text-xs text-gray-500">
                Доступно сейчас:{" "}
                {formatMoney(walletBalance?.available_withdraw_amount)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Платёжная система
              </label>
              <div className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-black">
                {cardInfo.system}
              </div>
              <p className="text-xs text-gray-500">
                Определяется автоматически по номеру карты.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-black">
                Номер карты
              </label>
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
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                placeholder="0000 0000 0000 0000"
              />

              {cardValidationState.message && (
                <p
                  className={`text-xs ${
                    cardValidationState.isValid
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {cardValidationState.message}
                </p>
              )}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-black">
                Имя владельца
              </label>
              <input
                type="text"
                value={withdrawForm.cardHolderName}
                onChange={(event) =>
                  handleWithdrawInputChange(
                    "cardHolderName",
                    formatCardHolderName(event.target.value),
                  )
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                placeholder="IVAN IVANOV"
              />
              <p className="text-xs text-gray-500">
                Только латиница, как в банковском приложении или на карте.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>К выплате</span>
              <span className="font-semibold text-black">
                {formatMoney(enteredAmountValue)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitWithdrawal}
            disabled={isWithdrawalSubmitting || isWalletLoading}
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {isWithdrawalSubmitting
              ? "Отправка заявки..."
              : "Отправить заявку на вывод"}
          </button>

          {walletSuccessText && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {walletSuccessText}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-300 bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-black">История выводов</h2>
            <p className="text-sm text-gray-600">
              Все отправленные заявки на вывод средств
            </p>
          </div>

          <button
            type="button"
            onClick={loadWalletData}
            className="rounded-xl border border-black px-4 py-2 text-sm font-medium text-black"
          >
            Обновить
          </button>
        </div>

        {isWalletLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Загрузка истории...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            У вас пока нет заявок на вывод
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
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black">
                        {formatMoney(item.amount)}
                      </p>
                      <p className="text-sm text-gray-600 break-all">
                        Карта: {item.masked_card_number || item.card_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Система: {historyCardInfo.system}
                      </p>
                      <p className="text-sm text-gray-600 break-all">
                        Получатель: {item.card_holder_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatWithdrawalDate(item.created_at)}
                      </p>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-3 py-2 text-sm font-medium ${getWithdrawalStatusClasses(
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
      </div>
    </div>
  );
}