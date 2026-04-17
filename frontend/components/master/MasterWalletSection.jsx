import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/constants";

const DEFAULT_WITHDRAW_FORM = {
  amount: "",
  transferMethod: "card",
  cardNumber: "",
  iban: "",
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
  const digits = String(value || "").replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatCardHolderName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .slice(0, 26);
}

function formatIban(value) {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 34);

  return normalized.replace(/(.{4})(?=.{1,})/g, "$1 ").trim();
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

function detectCardInfo(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");

  let system = "Карта";
  let colorClass = "from-slate-900 via-slate-800 to-slate-700";
  let badgeClass = "border-white/20 text-white/70";
  let logoText = "CARD";

  if (/^4/.test(digits)) {
    system = "Visa";
    logoText = "VISA";
    colorClass = "from-blue-950 via-blue-800 to-blue-600";
  } else if (/^(5[1-5]|2[2-7])/.test(digits)) {
    system = "Mastercard";
    logoText = "MC";
    colorClass = "from-neutral-950 via-neutral-800 to-orange-600";
  } else if (/^3[47]/.test(digits)) {
    system = "Amex";
    logoText = "AMEX";
    colorClass = "from-emerald-950 via-emerald-800 to-teal-600";
  } else if (/^62/.test(digits)) {
    system = "UnionPay";
    logoText = "UP";
    colorClass = "from-indigo-950 via-indigo-800 to-red-600";
  }

  return {
    system,
    colorClass,
    badgeClass,
    logoText,
  };
}

function isValidLuhn(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");

  if (digits.length !== 16) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function maskPayoutTarget(value, transferMethod) {
  const raw = String(value || "");

  if (!raw) return "—";

  if (transferMethod === "iban") {
    const compact = raw.replace(/\s/g, "");
    if (compact.length <= 8) return compact;
    return `${compact.slice(0, 4)} **** **** ${compact.slice(-4)}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return digits;
  return `**** **** **** ${digits.slice(-4)}`;
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

  const isCardMethod = withdrawForm.transferMethod === "card";
  const isIbanMethod = withdrawForm.transferMethod === "iban";

  const cardInfo = useMemo(
    () => detectCardInfo(withdrawForm.cardNumber),
    [withdrawForm.cardNumber],
  );

  const cardValidationState = useMemo(() => {
    if (!isCardMethod) {
      return {
        isReady: false,
        isValid: false,
        message: "",
      };
    }

    if (!cardDigits.length) {
      return {
        isReady: false,
        isValid: false,
        message: "",
      };
    }

    if (cardDigits.length < 16) {
      return {
        isReady: false,
        isValid: false,
        message: "Введите 16 цифр карты",
      };
    }

    if (!isValidLuhn(cardDigits)) {
      return {
        isReady: true,
        isValid: false,
        message: "Карта выглядит некорректной",
      };
    }

    return {
      isReady: true,
      isValid: true,
      message: "Номер карты выглядит корректно",
    };
  }, [cardDigits, isCardMethod]);

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

  const handleTransferMethodChange = (method) => {
    setWalletSuccessText("");

    setWithdrawForm((prev) => ({
      ...prev,
      transferMethod: method,
      cardNumber: method === "card" ? prev.cardNumber : "",
      iban: method === "iban" ? prev.iban : "",
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

    if (isCardMethod) {
      if (cardDigits.length !== 16) {
        throw new Error("Номер карты должен содержать 16 цифр");
      }

      if (!isValidLuhn(cardDigits)) {
        throw new Error("Номер карты не прошёл проверку");
      }
    }

    if (isIbanMethod) {
      const ibanValue = withdrawForm.iban.replace(/\s/g, "");

      if (ibanValue.length < 15) {
        throw new Error("Введите корректный IBAN");
      }

      if (!/^KZ/i.test(ibanValue)) {
        throw new Error("IBAN должен начинаться с KZ");
      }
    }
  };

  const handleSubmitWithdrawal = async () => {
    try {
      validateWithdrawalForm();
      setIsWithdrawalSubmitting(true);
      setWalletSuccessText("");

      const payoutTarget = isCardMethod
        ? cardDigits
        : withdrawForm.iban.replace(/\s/g, "");

      const receiverMeta = [
        withdrawForm.cardHolderName.trim(),
        isCardMethod ? cardInfo.system : "IBAN",
        withdrawForm.transferMethod,
      ].join(" | ");

      const response = await fetch(
        `${API_BASE_URL}/masters/${masterProfile.id}/withdrawals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: String(enteredAmountValue),
            card_number: payoutTarget,
            card_holder_name: receiverMeta,
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
        <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4 xl:col-span-1">
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

        <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-5 xl:col-span-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black">
              Заявка на вывод средств
            </h2>
            <p className="text-sm text-gray-600">
              Заполните реквизиты для выплаты
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleTransferMethodChange("card")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                isCardMethod
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
            >
              Вывод на карту
            </button>

            <button
              type="button"
              onClick={() => handleTransferMethodChange("iban")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                isIbanMethod
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
            >
              Вывод по IBAN
            </button>
          </div>

          <div
            className={`rounded-3xl border border-gray-200 bg-gradient-to-br ${cardInfo.colorClass} p-5 text-white`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {isCardMethod ? cardInfo.system : "Bank Transfer"}
                </p>
                <p className="mt-6 text-2xl font-semibold tracking-[0.2em] break-all">
                  {isCardMethod
                    ? withdrawForm.cardNumber || "0000 0000 0000 0000"
                    : withdrawForm.iban || "KZ00 0000 0000 0000 0000"}
                </p>
              </div>

              <div
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${cardInfo.badgeClass}`}
              >
                {isCardMethod ? cardInfo.logoText : "IBAN"}
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
                <p className="mt-1 text-sm font-medium">
                  {isCardMethod ? cardInfo.system : "IBAN"}
                </p>
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

            {isCardMethod ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Тип карты
                </label>
                <div className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-black">
                  {cardInfo.system}
                </div>
                <p className="text-xs text-gray-500">
                  Платёжная система определяется автоматически.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Формат выплаты
                </label>
                <div className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-black">
                  Банковский перевод по IBAN
                </div>
              </div>
            )}

            {isCardMethod && (
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

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
                    Платёжная система: {cardInfo.system}
                  </span>
                </div>
              </div>
            )}

            {isIbanMethod && (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium text-black">IBAN</label>
                <input
                  type="text"
                  value={withdrawForm.iban}
                  onChange={(event) =>
                    handleWithdrawInputChange(
                      "iban",
                      formatIban(event.target.value),
                    )
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  placeholder="KZ00 0000 0000 0000 0000"
                />
                <p className="text-xs text-gray-500">
                  Для банковского перевода по счёту.
                </p>
              </div>
            )}

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

      <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4">
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
              const isIbanHistory = String(item.card_holder_name || "").includes(
                "| iban"
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
                        Реквизиты:{" "}
                        {maskPayoutTarget(
                          item.card_number,
                          isIbanHistory ? "iban" : "card",
                        )}
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