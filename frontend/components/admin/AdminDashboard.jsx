import { useMemo, useState } from "react";
import AdminMastersSection from "./AdminMastersSection";
import AdminComplaintsSection from "./AdminComplaintsSection";
import AdminWithdrawalsSection from "./AdminWithdrawalsSection";
import { API_BASE_URL } from "../../lib/constants";
import { getAdminHeaders } from "../../lib/admin";

const ACCOUNT_ROLE_OPTIONS = [
  { value: "", label: "Все роли" },
  { value: "user", label: "Пользователи" },
  { value: "master", label: "Мастера" },
];

const VERIFICATION_STATUS_OPTIONS = [
  { value: "", label: "Любой статус" },
  { value: "pending", label: "pending" },
  { value: "approved", label: "approved" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "Все статусы заказов" },
  { value: "searching", label: "searching" },
  { value: "pending_user_confirmation", label: "pending_user_confirmation" },
  { value: "assigned", label: "assigned" },
  { value: "on_the_way", label: "on_the_way" },
  { value: "on_site", label: "on_site" },
  { value: "completed", label: "completed" },
  { value: "paid", label: "paid" },
];

const INPUT_CLASSNAME =
  "rounded-2xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-gray-500 focus:border-black";
const SELECT_CLASSNAME =
  "rounded-2xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-black";

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
}

function formatMoney(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  const amount = digits ? Number(digits) : 0;
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

function getRoleLabel(role) {
  if (role === "user") return "Пользователь";
  if (role === "master") return "Мастер";
  return role || "—";
}

function getOrderStatusBadge(status) {
  const base =
    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold";

  if (status === "paid") {
    return `${base} border-green-300 bg-green-50 text-green-800`;
  }

  if (status === "completed") {
    return `${base} border-blue-300 bg-blue-50 text-blue-800`;
  }

  if (
    status === "assigned" ||
    status === "on_the_way" ||
    status === "on_site"
  ) {
    return `${base} border-purple-300 bg-purple-50 text-purple-800`;
  }

  if (status === "pending_user_confirmation") {
    return `${base} border-yellow-300 bg-yellow-50 text-yellow-800`;
  }

  return `${base} border-gray-300 bg-gray-100 text-gray-800`;
}

function InfoCard({ title, value, hint = "" }) {
  return (
    <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        {title}
      </div>
      <div className="mt-2 text-lg font-bold text-black">{value || "—"}</div>
      {hint ? <div className="mt-1 text-xs text-gray-700">{hint}</div> : null}
    </div>
  );
}

export default function AdminDashboard({
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  isLoading,
  handleApproveMaster,
  updateComplaintStatus,
  updateWithdrawalStatus,
  logout,
}) {
  const [activeTab, setActiveTab] = useState("masters");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const accountStats = useMemo(() => {
    return selectedAccount?.stats || null;
  }, [selectedAccount]);

  const accountData = useMemo(() => {
    return selectedAccount?.account || null;
  }, [selectedAccount]);

  const accountOrders = useMemo(() => {
    return Array.isArray(selectedAccount?.orders) ? selectedAccount.orders : [];
  }, [selectedAccount]);

  const accountReviews = useMemo(() => {
    return Array.isArray(selectedAccount?.reviews)
      ? selectedAccount.reviews
      : [];
  }, [selectedAccount]);

  const accountComplaints = useMemo(() => {
    return Array.isArray(selectedAccount?.complaints)
      ? selectedAccount.complaints
      : [];
  }, [selectedAccount]);

  const accountWithdrawals = useMemo(() => {
    return Array.isArray(selectedAccount?.withdrawals)
      ? selectedAccount.withdrawals
      : [];
  }, [selectedAccount]);

  const accountSchedule = useMemo(() => {
    return Array.isArray(selectedAccount?.schedule)
      ? selectedAccount.schedule
      : [];
  }, [selectedAccount]);

  const runSearch = async () => {
    try {
      setIsSearchLoading(true);

      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      if (searchRole) {
        params.set("role", searchRole);
      }

      if (verificationStatus) {
        params.set("verification_status", verificationStatus);
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/accounts/search?${params.toString()}`,
        {
          headers: getAdminHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось выполнить поиск");
      }

      setSearchResults(Array.isArray(data.items) ? data.items : []);
      setSearchTotal(Number(data.total || 0));
    } catch (error) {
      console.error("Ошибка поиска аккаунтов:", error);
      alert(error.message || "Не удалось выполнить поиск");
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const loadAccountDetails = async ({
    accountId,
    status = orderStatusFilter,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
  }) => {
    try {
      setIsDetailsLoading(true);

      const params = new URLSearchParams();

      if (status) {
        params.set("order_status", status);
      }

      if (nextDateFrom) {
        params.set("date_from", nextDateFrom);
      }

      if (nextDateTo) {
        params.set("date_to", nextDateTo);
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/accounts/${accountId}?${params.toString()}`,
        {
          headers: getAdminHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось загрузить профиль аккаунта");
      }

      setSelectedAccount(data);
    } catch (error) {
      console.error("Ошибка загрузки профиля аккаунта:", error);
      alert(error.message || "Не удалось загрузить профиль аккаунта");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleOpenAccount = async (accountId) => {
    await loadAccountDetails({ accountId });
  };

  const handleApplyOrderFilters = async () => {
    if (!accountData?.id) {
      alert("Сначала выберите пользователя или мастера");
      return;
    }

    await loadAccountDetails({
      accountId: accountData.id,
      status: orderStatusFilter,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
    });
  };

  const handleResetOrderFilters = async () => {
    setOrderStatusFilter("");
    setDateFrom("");
    setDateTo("");

    if (!accountData?.id) {
      return;
    }

    await loadAccountDetails({
      accountId: accountData.id,
      status: "",
      nextDateFrom: "",
      nextDateTo: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-300 bg-white p-5 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-black">
            Панель администратора
          </h1>
          <p className="text-sm font-medium text-gray-700">
            Проверка мастеров, жалобы, выводы и поиск аккаунтов
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-2xl border border-gray-400 bg-white px-4 py-3 text-sm font-semibold text-black"
        >
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-gray-300 bg-white p-2 shadow lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveTab("masters")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "masters"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Мастера
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("complaints")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "complaints"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Жалобы
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("withdrawals")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "withdrawals"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Выводы
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "accounts"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Поиск аккаунтов
        </button>
      </div>

      {successText && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {successText}
        </div>
      )}

      {activeTab === "masters" && (
        <AdminMastersSection
          pendingMasters={pendingMasters}
          selectedMaster={selectedMaster}
          setSelectedMaster={setSelectedMaster}
          isLoading={isLoading}
          handleApproveMaster={handleApproveMaster}
        />
      )}

      {activeTab === "complaints" && (
        <AdminComplaintsSection
          complaints={complaints}
          isLoading={isLoading}
          updateComplaintStatus={updateComplaintStatus}
        />
      )}

      {activeTab === "withdrawals" && (
        <AdminWithdrawalsSection
          withdrawalRequests={withdrawalRequests}
          isLoading={isLoading}
          updateWithdrawalStatus={updateWithdrawalStatus}
        />
      )}

      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black">
                Поиск пользователя или мастера
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-700">
                Ищи по id, имени или номеру телефона
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ID, имя или телефон"
                className={INPUT_CLASSNAME}
              />

              <select
                value={searchRole}
                onChange={(event) => setSearchRole(event.target.value)}
                className={SELECT_CLASSNAME}
              >
                {ACCOUNT_ROLE_OPTIONS.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={verificationStatus}
                onChange={(event) => setVerificationStatus(event.target.value)}
                className={SELECT_CLASSNAME}
              >
                {VERIFICATION_STATUS_OPTIONS.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={runSearch}
                disabled={isSearchLoading}
                className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSearchLoading ? "Поиск..." : "Найти"}
              </button>
            </div>

            <div className="mt-4 text-sm font-semibold text-gray-800">
              Найдено: <span className="text-black">{searchTotal}</span>
            </div>

            <div className="mt-4 space-y-3">
              {searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-400 bg-gray-50 p-5 text-sm font-medium text-gray-700">
                  Здесь появятся найденные пользователи и мастера
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={`${item.role}-${item.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-300 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                          {getRoleLabel(item.role)}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          ID: {item.id}
                        </span>
                        {item.verification_status ? (
                          <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                            {item.verification_status}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-lg font-bold text-black">
                        {item.full_name || "Без имени"}
                      </div>

                      <div className="mt-1 text-sm font-medium text-gray-700">
                        Телефон: {item.phone || "—"}
                      </div>

                      {item.role === "master" && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                          <span>Рейтинг: {item.rating ?? 0}</span>
                          <span>•</span>
                          <span>
                            Завершено заказов:{" "}
                            {item.completed_orders_count ?? 0}
                          </span>
                          {Array.isArray(item.categories) &&
                          item.categories.length > 0 ? (
                            <>
                              <span>•</span>
                              <span>
                                Категории: {item.categories.join(", ")}
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAccount(item.id)}
                      className="rounded-2xl border border-black px-4 py-3 text-sm font-semibold text-black"
                    >
                      Открыть профиль
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-black">
                  Профиль и вся информация
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  Здесь видно профиль, заказы, отзывы, жалобы, выводы и график
                </p>
              </div>

              {accountData ? (
                <div className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
                  Открыт:{" "}
                  <span className="text-black">
                    {accountData.full_name || "Без имени"}
                  </span>{" "}
                  ({getRoleLabel(accountData.role)}, ID {accountData.id})
                </div>
              ) : null}
            </div>

            {!accountData ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-400 bg-gray-50 p-6 text-sm font-medium text-gray-700">
                Сначала выполни поиск и открой нужный аккаунт
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    title="Роль"
                    value={getRoleLabel(accountData.role)}
                  />
                  <InfoCard title="ID" value={String(accountData.id)} />
                  <InfoCard title="Телефон" value={accountData.phone || "—"} />
                  <InfoCard
                    title="Имя"
                    value={accountData.full_name || "Без имени"}
                  />

                  {accountData.role === "master" && (
                    <>
                      <InfoCard
                        title="Статус верификации"
                        value={accountData.verification_status || "—"}
                      />
                      <InfoCard
                        title="Рейтинг"
                        value={String(accountData.rating ?? 0)}
                      />
                      <InfoCard
                        title="Завершено заказов"
                        value={String(accountData.completed_orders_count ?? 0)}
                      />
                      <InfoCard
                        title="Баланс"
                        value={formatMoney(accountData.balance_amount)}
                        hint={`Доступно к выводу: ${formatMoney(
                          accountData.available_withdraw_amount,
                        )}`}
                      />
                    </>
                  )}
                </div>

                {accountData.role === "master" && (
                  <div className="rounded-2xl border border-gray-300 p-4">
                    <div className="text-sm font-bold text-black">
                      Информация мастера
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="text-xs font-semibold uppercase text-gray-700">
                          О себе
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-800">
                          {accountData.about_me || "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="text-xs font-semibold uppercase text-gray-700">
                          Город / опыт / категории
                        </div>
                        <div className="mt-2 space-y-1 text-sm font-medium text-gray-800">
                          <div>Город: {accountData.work_city || "—"}</div>
                          <div>
                            Опыт:{" "}
                            {accountData.experience_years === null ||
                            accountData.experience_years === undefined
                              ? "—"
                              : `${accountData.experience_years} лет`}
                          </div>
                          <div>
                            Категории:{" "}
                            {Array.isArray(accountData.categories) &&
                            accountData.categories.length > 0
                              ? accountData.categories.join(", ")
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-300 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-bold text-black">
                        Фильтр заказов
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-700">
                        Фильтрация идёт по дате создания заказа и по статусу
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-gray-800">
                      Загружено заказов:{" "}
                      <span className="text-black">
                        {accountStats?.orders_total ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <select
                      value={orderStatusFilter}
                      onChange={(event) =>
                        setOrderStatusFilter(event.target.value)
                      }
                      className={SELECT_CLASSNAME}
                    >
                      {ORDER_STATUS_OPTIONS.map((item) => (
                        <option key={item.value || "all"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className={INPUT_CLASSNAME}
                    />

                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className={INPUT_CLASSNAME}
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleApplyOrderFilters}
                        disabled={isDetailsLoading}
                        className="flex-1 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isDetailsLoading ? "Загрузка..." : "Применить"}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetOrderFilters}
                        disabled={isDetailsLoading}
                        className="rounded-2xl border border-gray-400 bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                      >
                        Сброс
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <InfoCard
                    title="Всего заказов"
                    value={String(accountStats?.orders_total ?? 0)}
                  />
                  <InfoCard
                    title="Отзывов"
                    value={String(accountStats?.reviews_total ?? 0)}
                  />
                  <InfoCard
                    title="Жалоб"
                    value={String(accountStats?.complaints_total ?? 0)}
                  />
                  <InfoCard
                    title="Выводов"
                    value={String(accountStats?.withdrawals_total ?? 0)}
                  />
                </div>

                <div className="rounded-2xl border border-gray-300 p-4">
                  <div className="text-sm font-bold text-black">Заказы</div>

                  <div className="mt-4 space-y-3">
                    {accountOrders.length === 0 ? (
                      <div className="rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                        Заказы не найдены по выбранным фильтрам
                      </div>
                    ) : (
                      accountOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-gray-300 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-bold text-black">
                                  Заказ #{order.id}
                                </span>
                                <span
                                  className={getOrderStatusBadge(order.status)}
                                >
                                  {order.status}
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-sm font-medium text-gray-800">
                                <div>
                                  <span className="font-bold text-black">
                                    Услуга:
                                  </span>{" "}
                                  {order.service_name}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Категория:
                                  </span>{" "}
                                  {order.category}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Адрес:
                                  </span>{" "}
                                  {order.address}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Запланировано:
                                  </span>{" "}
                                  {order.scheduled_at || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Цена:
                                  </span>{" "}
                                  {order.price
                                    ? formatMoney(order.price)
                                    : order.client_price
                                      ? formatMoney(order.client_price)
                                      : "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Мастер:
                                  </span>{" "}
                                  {order.master_name || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Телефон мастера:
                                  </span>{" "}
                                  {order.master_phone || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-black">
                                    Телефон пользователя:
                                  </span>{" "}
                                  {order.user_phone || "—"}
                                </div>
                              </div>

                              <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm font-medium text-gray-800">
                                {order.description || "Без описания"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-gray-300 p-4">
                    <div className="text-sm font-bold text-black">Отзывы</div>

                    <div className="mt-4 space-y-3">
                      {accountReviews.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                          Отзывов нет
                        </div>
                      ) : (
                        accountReviews.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-gray-300 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-bold text-black">
                                Заказ #{item.order_id}
                              </div>
                              <div className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                                {item.rating}/5
                              </div>
                            </div>

                            <div className="mt-2 text-sm font-medium text-gray-800">
                              {item.comment || "Без комментария"}
                            </div>

                            <div className="mt-2 text-xs font-medium text-gray-700">
                              {formatDateTime(item.created_at)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-300 p-4">
                    <div className="text-sm font-bold text-black">Жалобы</div>

                    <div className="mt-4 space-y-3">
                      {accountComplaints.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                          Жалоб нет
                        </div>
                      ) : (
                        accountComplaints.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-gray-300 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-bold text-black">
                                Жалоба #{item.id}
                              </div>
                              <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                                {item.status}
                              </span>
                              <span className="text-xs font-medium text-gray-700">
                                Заказ #{item.order_id}
                              </span>
                            </div>

                            <div className="mt-2 text-sm font-medium text-gray-800">
                              {item.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {accountData.role === "master" && (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-gray-300 p-4">
                      <div className="text-sm font-bold text-black">
                        Заявки на вывод
                      </div>

                      <div className="mt-4 space-y-3">
                        {accountWithdrawals.length === 0 ? (
                          <div className="rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                            Заявок на вывод нет
                          </div>
                        ) : (
                          accountWithdrawals.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-gray-300 p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-bold text-black">
                                  Вывод #{item.id}
                                </div>
                                <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                                  {item.status}
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-sm font-medium text-gray-800">
                                <div>Сумма: {formatMoney(item.amount)}</div>
                                <div>
                                  Карта: {item.masked_card_number || "—"}
                                </div>
                                <div>
                                  Бренд карты:{" "}
                                  {item.card_brand
                                    ? item.card_brand.toUpperCase()
                                    : "—"}
                                </div>
                                <div>
                                  Владелец: {item.card_holder_name || "—"}
                                </div>
                                <div>
                                  Дата: {formatDateTime(item.created_at)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-300 p-4">
                      <div className="text-sm font-bold text-black">
                        График мастера
                      </div>

                      <div className="mt-4 space-y-3">
                        {accountSchedule.length === 0 ? (
                          <div className="rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                            График не заполнен
                          </div>
                        ) : (
                          accountSchedule.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-gray-300 p-4 text-sm font-medium text-gray-800"
                            >
                              <div>
                                День недели:{" "}
                                <span className="font-bold text-black">
                                  {item.weekday}
                                </span>
                              </div>
                              <div>
                                Время:{" "}
                                <span className="font-bold text-black">
                                  {item.start_time} — {item.end_time}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
