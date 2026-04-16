import { useEffect, useMemo, useState } from "react";
import MasterProfileSection from "./MasterProfileSection";
import MasterAvailableOrdersSection from "./MasterAvailableOrdersSection";
import MasterOrdersSection from "./MasterOrdersSection";
import { API_BASE_URL } from "../../lib/constants";
import {
  MASTER_ACTIVE_ORDER_STATUSES,
  MASTER_DONE_ORDER_STATUSES,
} from "../../lib/orders";
import {
  WEEKDAY_OPTIONS,
  getWeekdayLabel,
} from "../../lib/masterSchedule";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const value = String(index).padStart(2, "0");
  return {
    value: `${value}:00`,
    label: `${value}:00`,
  };
});

const DEFAULT_WITHDRAW_FORM = {
  amount: "",
  cardNumber: "",
  cardHolderName: "",
};

export default function MasterDashboard({
  masterProfile,
  fullName,
  setFullName,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  workDistrict,
  setWorkDistrict,
  handleSaveMasterProfile,
  successText,
  logout,
  avatarFile,
  setAvatarFile,
  handleUploadAvatar,
  isAvatarLoading,
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  hasUploadedAllDocuments,
  isDocumentsLoading,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  reportPhotos,
  setReportPhotos,
  reportTargetOrderId,
  setReportTargetOrderId,
  handleUploadOrderReport,
  isReportUploading,
  openedPhoto,
  setOpenedPhoto,
  activeSection,
  setActiveSection,
  scheduleItems,
  setScheduleItems,
  scheduleForm,
  setScheduleForm,
  isScheduleLoading,
  isScheduleSaving,
  handleAddScheduleItem,
  handleSaveMasterSchedule,
  removeScheduleItem,
}) {
  const [ordersTab, setOrdersTab] = useState("search");

  const [walletBalance, setWalletBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawForm, setWithdrawForm] = useState(DEFAULT_WITHDRAW_FORM);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isWithdrawalSubmitting, setIsWithdrawalSubmitting] = useState(false);
  const [walletSuccessText, setWalletSuccessText] = useState("");

  const currentOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_ACTIVE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

  const completedOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_DONE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

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

  useEffect(() => {
    if (activeSection === "wallet" && masterProfile?.id) {
      loadWalletData();
    }
  }, [activeSection]);

  const formatMoney = (value) => {
    const raw = String(value || "0").replace(/[^\d]/g, "");
    const amount = raw ? Number(raw) : 0;

    return `${amount.toLocaleString("ru-RU")} ₸`;
  };

  const formatWithdrawalDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("ru-RU");
  };

  const getWithdrawalStatusLabel = (status) => {
    if (status === "pending") return "На рассмотрении";
    if (status === "approved") return "Одобрено";
    if (status === "rejected") return "Отклонено";
    return status;
  };

  const handleWithdrawInputChange = (field, value) => {
    setWithdrawForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitWithdrawal = async () => {
    if (!masterProfile?.id) {
      alert("Профиль мастера не загружен");
      return;
    }

    try {
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
            amount: withdrawForm.amount,
            card_number: withdrawForm.cardNumber,
            card_holder_name: withdrawForm.cardHolderName,
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
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-4 rounded-2xl border border-gray-300 bg-white p-2 shadow">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "profile"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Профиль
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("schedule")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "schedule"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            График
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("orders")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "orders"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Заказы
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("wallet")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "wallet"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Кошелёк
          </button>
        </div>

        {activeSection === "profile" && (
          <MasterProfileSection
            masterProfile={masterProfile}
            fullName={fullName}
            setFullName={setFullName}
            aboutMe={aboutMe}
            setAboutMe={setAboutMe}
            experienceYears={experienceYears}
            setExperienceYears={setExperienceYears}
            workCity={workCity}
            setWorkCity={setWorkCity}
            workDistrict={workDistrict}
            setWorkDistrict={setWorkDistrict}
            handleSaveMasterProfile={handleSaveMasterProfile}
            successText={successText}
            logout={logout}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleUploadAvatar={handleUploadAvatar}
            isAvatarLoading={isAvatarLoading}
            idCardFront={idCardFront}
            setIdCardFront={setIdCardFront}
            idCardBack={idCardBack}
            setIdCardBack={setIdCardBack}
            selfiePhoto={selfiePhoto}
            setSelfiePhoto={setSelfiePhoto}
            handleUploadDocuments={handleUploadDocuments}
            hasUploadedAllDocuments={hasUploadedAllDocuments}
            isDocumentsLoading={isDocumentsLoading}
          />
        )}

        {activeSection === "schedule" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-black">
                  График работы
                </h2>
                <p className="text-sm text-gray-600">
                  Укажите, в какие дни и часы вы обычно принимаете заказы
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    День недели
                  </label>
                  <select
                    value={scheduleForm.weekday}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        weekday: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  >
                    {WEEKDAY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">С</label>
                  <select
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  >
                    {HOUR_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">До</label>
                  <select
                    value={scheduleForm.endTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        endTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  >
                    {HOUR_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddScheduleItem}
                  className="w-full rounded-2xl border border-black px-4 py-3 text-sm font-medium text-black"
                >
                  Добавить слот
                </button>

                <button
                  type="button"
                  onClick={handleSaveMasterSchedule}
                  disabled={isScheduleSaving}
                  className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isScheduleSaving ? "Сохранение..." : "Сохранить график"}
                </button>
              </div>

              {isScheduleLoading ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Загрузка графика...
                </div>
              ) : scheduleItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  У вас пока нет добавленных рабочих слотов
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-black">
                          {getWeekdayLabel(item.weekday)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.start_time} — {item.end_time}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeScheduleItem(item)}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {successText && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {successText}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "orders" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-2 shadow">
              <button
                type="button"
                onClick={() => setOrdersTab("search")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "search"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Поиск заказов
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("active")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "active"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Активные
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("completed")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "completed"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Выполненные
              </button>
            </div>

            {ordersTab === "search" && (
              <MasterAvailableOrdersSection
                masterProfile={masterProfile}
                availableOrders={availableOrders}
                isAvailableLoading={isAvailableLoading}
                loadAvailableOrders={loadAvailableOrders}
                handleTakeOrder={handleTakeOrder}
                setAvailableOrders={setAvailableOrders}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "active" && (
              <MasterOrdersSection
                title="Активные заказы"
                emptyText="У вас нет активных заказов"
                masterProfile={masterProfile}
                masterOrders={currentOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                reportPhotos={reportPhotos}
                setReportPhotos={setReportPhotos}
                reportTargetOrderId={reportTargetOrderId}
                setReportTargetOrderId={setReportTargetOrderId}
                handleUploadOrderReport={handleUploadOrderReport}
                isReportUploading={isReportUploading}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "completed" && (
              <MasterOrdersSection
                title="Выполненные заказы"
                emptyText="У вас нет выполненных заказов"
                masterProfile={masterProfile}
                masterOrders={completedOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                reportPhotos={reportPhotos}
                setReportPhotos={setReportPhotos}
                reportTargetOrderId={reportTargetOrderId}
                setReportTargetOrderId={setReportTargetOrderId}
                handleUploadOrderReport={handleUploadOrderReport}
                isReportUploading={isReportUploading}
                onOpenPhoto={setOpenedPhoto}
              />
            )}
          </div>
        )}

        {activeSection === "wallet" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-black">Кошелёк</h2>
                  <p className="text-sm text-gray-600">
                    Здесь отображаются начисления и доступная сумма для вывода
                  </p>
                </div>

                {isWalletLoading ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    Загрузка кошелька...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Общий баланс</p>
                      <p className="mt-2 text-2xl font-bold text-black">
                        {formatMoney(walletBalance?.balance_amount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Доступно к выводу</p>
                      <p className="mt-2 text-2xl font-bold text-black">
                        {formatMoney(walletBalance?.available_withdraw_amount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-black">Вывод средств</h2>
                  <p className="text-sm text-gray-600">
                    Отправьте заявку на вывод денег на карту
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={withdrawForm.amount}
                    onChange={(event) =>
                      handleWithdrawInputChange("amount", event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                    placeholder="Сумма, например 15000"
                  />

                  <input
                    type="text"
                    value={withdrawForm.cardNumber}
                    onChange={(event) =>
                      handleWithdrawInputChange("cardNumber", event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                    placeholder="Номер карты"
                  />

                  <input
                    type="text"
                    value={withdrawForm.cardHolderName}
                    onChange={(event) =>
                      handleWithdrawInputChange(
                        "cardHolderName",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                    placeholder="Имя владельца карты"
                  />

                  <button
                    type="button"
                    onClick={handleSubmitWithdrawal}
                    disabled={isWithdrawalSubmitting}
                    className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {isWithdrawalSubmitting
                      ? "Отправка..."
                      : "Отправить заявку на вывод"}
                  </button>
                </div>

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
                  <h2 className="text-2xl font-bold text-black">
                    История выводов
                  </h2>
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
                  {withdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-black">
                            {formatMoney(item.amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Карта: {item.card_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            Получатель: {item.card_holder_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatWithdrawalDate(item.created_at)}
                          </p>
                        </div>

                        <div className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-black">
                          {getWithdrawalStatusLabel(item.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </>
  );
}