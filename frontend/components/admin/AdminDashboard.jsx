import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Clock3,
  LogOut,
  MessageCircle,
  RefreshCw,
  Search,
  Shield,
  UserRound,
  WalletCards,
} from "lucide-react";
import AdminMastersSection from "./AdminMastersSection";
import AdminComplaintsSection from "./AdminComplaintsSection";
import AdminWithdrawalsSection from "./AdminWithdrawalsSection";
import ChatCenter from "../chat/ChatCenter";
import { API_BASE_URL } from "../../lib/constants";
import { getAdminHeaders } from "../../lib/admin";
import { loadChatConversations } from "../../lib/chats";

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
  "min-h-[56px] rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#111827] shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#4f7f56] focus:ring-4 focus:ring-[#e8f2e8]";
const SELECT_CLASSNAME =
  "min-h-[56px] rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#111827] shadow-sm outline-none transition focus:border-[#4f7f56] focus:ring-4 focus:ring-[#e8f2e8]";

const PANEL_CLASSNAME =
  "rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6";
const PRIMARY_BUTTON_CLASSNAME =
  "min-h-[56px] rounded-[18px] bg-[#4f7f56] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#416f48] disabled:opacity-60";
const SECONDARY_BUTTON_CLASSNAME =
  "inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#374151] shadow-sm transition hover:bg-[#f8faf8] disabled:opacity-60";

const TAB_ITEMS = [
  { id: "masters", label: "Мастера", icon: UserRound },
  { id: "complaints", label: "Жалобы", icon: Shield },
  { id: "withdrawals", label: "Выводы", icon: WalletCards },
  { id: "accounts", label: "Поиск аккаунтов", icon: Search },
  { id: "chats", label: "Чаты", icon: MessageCircle },
];
const ACTIVE_COMPLAINT_STATUSES = ["new", "in_progress", "needs_details"];
const ADMIN_CHAT_POLL_INTERVAL_MS = 12000;

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

function formatCount(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("ru-RU");
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

  return `${base} border-gray-200 bg-[#fbfcfb] text-gray-700`;
}

function InfoCard({ title, value, hint = "" }) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase text-gray-500">
        {title}
      </div>
      <div className="mt-2 break-words text-lg font-bold text-[#111827] [overflow-wrap:anywhere]">
        {value || "—"}
      </div>
      {hint ? (
        <div className="mt-1 text-xs font-semibold text-gray-500">{hint}</div>
      ) : null}
    </div>
  );
}

function DetailPanel({ title, subtitle = "", children }) {
  return (
    <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
      <div className="text-sm font-bold text-[#111827]">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-xs font-semibold text-gray-500">
          {subtitle}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function OverviewStatCard({ title, value, hint, icon: Icon, tone = "green" }) {
  const toneClassName =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "yellow"
        ? "bg-yellow-50 text-yellow-700"
        : tone === "blue"
          ? "bg-blue-50 text-blue-700"
          : "bg-[#edf4ed] text-[#4f7f56]";

  return (
    <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`flex size-12 items-center justify-center rounded-[16px] ${toneClassName}`}
      >
        <Icon size={24} />
      </div>
      <div className="mt-4 text-3xl font-bold text-[#111827]">
        {formatCount(value)}
      </div>
      <div className="mt-1 text-sm font-bold text-[#111827]">{title}</div>
      <div className="mt-1 text-xs font-semibold text-gray-500">{hint}</div>
    </div>
  );
}

function ActivityLogPanel({ logs }) {
  const items = Array.isArray(logs) ? logs.slice(0, 8) : [];

  return (
    <div className={PANEL_CLASSNAME}>
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#edf4ed] text-[#4f7f56]">
          <Activity size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Журнал действий</h2>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            Последние решения администратора
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-gray-300 bg-[#fbfcfb] p-4 text-sm font-semibold text-gray-500">
            Действий пока нет
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[18px] border border-gray-200 bg-[#fbfcfb] p-4"
            >
              <div className="text-sm font-bold text-[#111827]">
                {item.action}
              </div>
              {item.details ? (
                <div className="mt-1 text-xs font-semibold text-gray-600">
                  {item.details}
                </div>
              ) : null}
              <div className="mt-2 text-xs font-semibold text-gray-500">
                {formatDateTime(item.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({
  adminOverview,
  adminActionLogs,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  isLoading,
  handleApproveMaster,
  loadAdminActionLogs,
  loadAdminOverview,
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
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatStartTarget, setChatStartTarget] = useState(null);

  const overview = useMemo(() => {
    const activeComplaintFallback = (Array.isArray(complaints)
      ? complaints
      : []
    ).filter((item) => ACTIVE_COMPLAINT_STATUSES.includes(item.status)).length;
    const pendingWithdrawalFallback = (Array.isArray(withdrawalRequests)
      ? withdrawalRequests
      : []
    ).filter((item) => item.status === "pending").length;

    return {
      pending_masters: Number(
        adminOverview?.pending_masters ?? pendingMasters?.length ?? 0,
      ),
      active_complaints: Number(
        adminOverview?.active_complaints ?? activeComplaintFallback,
      ),
      pending_withdrawals: Number(
        adminOverview?.pending_withdrawals ?? pendingWithdrawalFallback,
      ),
      active_orders: Number(adminOverview?.active_orders ?? 0),
      orders_searching: Number(adminOverview?.orders_searching ?? 0),
      orders_in_work: Number(adminOverview?.orders_in_work ?? 0),
      orders_completed_unpaid: Number(
        adminOverview?.orders_completed_unpaid ?? 0,
      ),
    };
  }, [adminOverview, complaints, pendingMasters, withdrawalRequests]);

  const tabBadgeMap = useMemo(
    () => ({
      masters: overview.pending_masters,
      complaints: overview.active_complaints,
      withdrawals: overview.pending_withdrawals,
      chats: chatUnreadCount,
    }),
    [chatUnreadCount, overview],
  );

  const quickActions = useMemo(
    () => [
      {
        id: "masters",
        label: "Новые мастера",
        hint: "проверить документы",
        value: overview.pending_masters,
        icon: UserRound,
      },
      {
        id: "complaints",
        label: "Активные споры",
        hint: "решить жалобы и деньги",
        value: overview.active_complaints,
        icon: AlertTriangle,
      },
      {
        id: "withdrawals",
        label: "Заявки на вывод",
        hint: "одобрить или отклонить",
        value: overview.pending_withdrawals,
        icon: WalletCards,
      },
      {
        id: "accounts",
        label: "Поиск аккаунта",
        hint: "пользователь, мастер, заказ",
        value: overview.active_orders,
        icon: Search,
      },
    ],
    [overview],
  );

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

  useEffect(() => {
    let isMounted = true;

    const loadUnreadChats = async () => {
      try {
        const conversations = await loadChatConversations({
          viewerRole: "admin",
        });

        if (!isMounted) {
          return;
        }

        setChatUnreadCount(
          conversations.reduce(
            (sum, item) => sum + Number(item.unread_count || 0),
            0,
          ),
        );
      } catch (error) {
        console.error("Ошибка загрузки непрочитанных чатов админа:", error);

        if (isMounted) {
          setChatUnreadCount(0);
        }
      }
    };

    loadUnreadChats();
    const intervalId = window.setInterval(
      loadUnreadChats,
      ADMIN_CHAT_POLL_INTERVAL_MS,
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

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

  const confirmAdminAction = (message) => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.confirm(message);
  };

  const handleRefreshAdminCenter = async () => {
    try {
      await Promise.all([
        loadAdminOverview ? loadAdminOverview() : Promise.resolve(),
        loadAdminActionLogs ? loadAdminActionLogs() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Ошибка обновления админского пульта:", error);
      alert(error.message || "Не удалось обновить админский пульт");
    }
  };

  const handleConfirmedApproveMaster = async (masterId, masterName = "") => {
    const namePart = masterName ? ` "${masterName}"` : "";

    if (!confirmAdminAction(`Одобрить мастера${namePart}?`)) {
      return;
    }

    await handleApproveMaster(masterId);
  };

  const handleConfirmedComplaintStatus = async (
    complaintId,
    statusOrPayload,
  ) => {
    if (!confirmAdminAction(`Изменить статус жалобы #${complaintId}?`)) {
      return null;
    }

    return updateComplaintStatus(complaintId, statusOrPayload);
  };

  const handleConfirmedWithdrawalStatus = async (
    withdrawalId,
    status,
    item = null,
  ) => {
    const actionText =
      status === "approved" ? "одобрить вывод" : "отклонить вывод";
    const amountText = item?.amount ? ` на ${formatMoney(item.amount)}` : "";

    if (
      !confirmAdminAction(
        `Подтвердить действие: ${actionText} #${withdrawalId}${amountText}?`,
      )
    ) {
      return null;
    }

    return updateWithdrawalStatus(withdrawalId, status);
  };

  const handleOpenChatTarget = (targetRole, targetAccountId) => {
    if (!targetAccountId) {
      return;
    }

    setChatStartTarget({
      targetRole,
      targetAccountId,
      key: `${targetRole}-${targetAccountId}-${Date.now()}`,
    });
    setActiveTab("chats");
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">
            Панель администратора
          </h1>
          <p className="text-base font-medium text-gray-500 sm:text-lg">
            Проверка мастеров, жалобы, выводы и поиск аккаунтов
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#4f7f56] shadow-sm transition hover:bg-[#f8faf8]"
        >
          <LogOut size={20} />
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={PANEL_CLASSNAME}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">
                Рабочий центр
              </h2>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Быстрый срез по проверкам, спорам, выводам и активным заказам
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshAdminCenter}
              disabled={isLoading}
              className={SECONDARY_BUTTON_CLASSNAME}
            >
              <RefreshCw size={18} />
              Обновить
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStatCard
              title="Новые мастера"
              value={overview.pending_masters}
              hint="ожидают проверки"
              icon={UserRound}
            />
            <OverviewStatCard
              title="Жалобы"
              value={overview.active_complaints}
              hint="активные споры"
              icon={AlertTriangle}
              tone="red"
            />
            <OverviewStatCard
              title="Выводы"
              value={overview.pending_withdrawals}
              hint="на рассмотрении"
              icon={Clock3}
              tone="yellow"
            />
            <OverviewStatCard
              title="Заказы"
              value={overview.active_orders}
              hint="сейчас в работе"
              icon={ClipboardList}
              tone="blue"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="flex min-h-[86px] items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-[#fbfcfb] p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-white"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#4f7f56]">
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#111827]">
                        {item.label}
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold text-gray-500">
                        {item.hint}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#4f7f56] px-3 py-1 text-xs font-bold text-white">
                    {formatCount(item.value)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoCard
              title="Ищут мастера"
              value={formatCount(overview.orders_searching)}
            />
            <InfoCard
              title="В работе"
              value={formatCount(overview.orders_in_work)}
            />
            <InfoCard
              title="Завершены без оплаты"
              value={formatCount(overview.orders_completed_unpaid)}
            />
          </div>
        </div>

        <ActivityLogPanel logs={adminActionLogs} />
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-[28px] border border-gray-200 bg-white p-2 shadow-[0_14px_42px_rgba(15,23,42,0.07)] sm:grid-cols-2 lg:grid-cols-5">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeValue = tabBadgeMap[item.id] || 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex min-h-[62px] items-center justify-center gap-3 rounded-[20px] px-4 py-3 text-sm font-bold transition sm:text-base ${
                isActive
                  ? "bg-[#4f7f56] text-white shadow-[0_12px_28px_rgba(79,127,86,0.28)]"
                  : "text-gray-500 hover:bg-[#f8faf8] hover:text-[#111827]"
              }`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
              {badgeValue > 0 ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#edf4ed] text-[#4f7f56]"
                  }`}
                >
                  {formatCount(badgeValue)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {successText && (
        <div className="rounded-[20px] border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800 shadow-sm">
          {successText}
        </div>
      )}

      {activeTab === "masters" && (
        <AdminMastersSection
          pendingMasters={pendingMasters}
          selectedMaster={selectedMaster}
          setSelectedMaster={setSelectedMaster}
          isLoading={isLoading}
          handleApproveMaster={handleConfirmedApproveMaster}
        />
      )}

      {activeTab === "complaints" && (
        <AdminComplaintsSection
          complaints={complaints}
          isLoading={isLoading}
          updateComplaintStatus={handleConfirmedComplaintStatus}
          onOpenChatTarget={handleOpenChatTarget}
        />
      )}

      {activeTab === "withdrawals" && (
        <AdminWithdrawalsSection
          withdrawalRequests={withdrawalRequests}
          isLoading={isLoading}
          updateWithdrawalStatus={handleConfirmedWithdrawalStatus}
        />
      )}

      {activeTab === "chats" && (
        <ChatCenter viewerRole="admin" initialTarget={chatStartTarget} />
      )}

      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className={PANEL_CLASSNAME}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-[#111827]">
                Поиск пользователя или мастера
              </h2>
              <p className="mt-2 text-sm font-semibold text-gray-500">
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
                className={PRIMARY_BUTTON_CLASSNAME}
              >
                {isSearchLoading ? "Поиск..." : "Найти"}
              </button>
            </div>

            <div className="mt-4 text-sm font-bold text-gray-600">
              Найдено: <span className="text-[#111827]">{searchTotal}</span>
            </div>

            <div className="mt-4 space-y-3">
              {searchResults.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-gray-300 bg-[#fbfcfb] p-5 text-sm font-semibold text-gray-500">
                  Здесь появятся найденные пользователи и мастера
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={`${item.role}-${item.id}`}
                    className="flex flex-col gap-4 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#edf4ed] text-[#4f7f56]">
                        <UserRound size={30} />
                      </div>

                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#4f7f56] px-3 py-1 text-xs font-bold text-white">
                          {getRoleLabel(item.role)}
                        </span>
                        <span className="text-sm font-bold text-gray-600">
                          ID: {item.id}
                        </span>
                        {item.verification_status ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-[#4f7f56]">
                            {item.verification_status}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 break-words text-lg font-bold text-[#111827]">
                        {item.full_name || "Без имени"}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-gray-500">
                        Телефон: {item.phone || "—"}
                      </div>

                      {item.role === "master" && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
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
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAccount(item.id)}
                      className={SECONDARY_BUTTON_CLASSNAME}
                    >
                      Открыть профиль
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={PANEL_CLASSNAME}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#111827]">
                  Профиль и вся информация
                </h2>
                <p className="mt-2 text-sm font-semibold text-gray-500">
                  Здесь видно профиль, заказы, отзывы, жалобы, выводы и график
                </p>
              </div>

              {accountData ? (
                <div className="rounded-[18px] border border-gray-200 bg-[#fbfcfb] px-4 py-3 text-sm font-bold text-gray-600 shadow-sm">
                  Открыт:{" "}
                  <span className="text-[#111827]">
                    {accountData.full_name || "Без имени"}
                  </span>{" "}
                  ({getRoleLabel(accountData.role)}, ID {accountData.id})
                </div>
              ) : null}
            </div>

            {!accountData ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-gray-300 bg-[#fbfcfb] p-6 text-sm font-semibold text-gray-500">
                Сначала выполни поиск и открой нужный аккаунт
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <DetailPanel
                    title="Аккаунт"
                    subtitle="Данные, которые берутся из регистрации"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoCard
                        title="Роль"
                        value={getRoleLabel(accountData.role)}
                      />
                      <InfoCard title="ID" value={String(accountData.id)} />
                      <InfoCard
                        title="Телефон"
                        value={accountData.phone || "—"}
                      />
                      <InfoCard
                        title="Имя"
                        value={accountData.full_name || "Без имени"}
                      />
                    </div>
                  </DetailPanel>

                  {accountData.role === "master" ? (
                    <DetailPanel
                      title="Публичный профиль мастера"
                      subtitle="То, что клиент видит при выборе мастера"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoCard
                          title="Статус"
                          value={accountData.verification_status || "—"}
                        />
                        <InfoCard
                          title="Рейтинг"
                          value={String(accountData.rating ?? 0)}
                        />
                        <InfoCard
                          title="Завершено заказов"
                          value={String(
                            accountData.completed_orders_count ?? 0,
                          )}
                        />
                        <InfoCard
                          title="Город"
                          value={accountData.work_city || "—"}
                        />
                        <InfoCard
                          title="Опыт"
                          value={
                            accountData.experience_years === null ||
                            accountData.experience_years === undefined
                              ? "—"
                              : `${accountData.experience_years} лет`
                          }
                        />
                        <InfoCard
                          title="Документы"
                          value={`${
                            [
                              accountData.id_card_front_path,
                              accountData.id_card_back_path,
                              accountData.selfie_photo_path,
                            ].filter(Boolean).length
                          }/3`}
                          hint="Удостоверение и селфи"
                        />
                      </div>

                      <div className="mt-3 rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase text-gray-500">
                          О себе
                        </div>
                        <div className="mt-2 break-words text-sm font-semibold text-[#111827] [overflow-wrap:anywhere]">
                          {accountData.about_me || "—"}
                        </div>
                      </div>

                      <div className="mt-3 rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase text-gray-500">
                          Категории
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[#111827]">
                          {Array.isArray(accountData.categories) &&
                          accountData.categories.length > 0
                            ? accountData.categories.join(", ")
                            : "—"}
                        </div>
                      </div>
                    </DetailPanel>
                  ) : (
                    <DetailPanel
                      title="Профиль пользователя"
                      subtitle="Аккаунтные данные не смешиваются с адресами"
                    >
                      <div className="rounded-[18px] border border-gray-200 bg-white p-4 text-sm font-semibold leading-6 text-gray-700 shadow-sm">
                        Адреса пользователя используются в заказах и видны ниже в
                        карточках заказов. Имя и телефон здесь только для
                        проверки аккаунта.
                      </div>
                    </DetailPanel>
                  )}
                </div>

                {accountData.role === "master" && (
                  <DetailPanel
                    title="Баланс мастера"
                    subtitle="Разделение денег без смешивания с публичным профилем"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <InfoCard
                        title="Всего"
                        value={formatMoney(accountData.balance_amount)}
                      />
                      <InfoCard
                        title="Доступно к выводу"
                        value={formatMoney(
                          accountData.available_withdraw_amount,
                        )}
                      />
                      <InfoCard
                        title="Заморожено"
                        value={formatMoney(accountData.frozen_balance_amount)}
                        hint="Активные заказы, споры и удержания"
                      />
                    </div>
                  </DetailPanel>
                )}

                <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#111827]">
                        Фильтр заказов
                      </div>
                      <div className="mt-1 text-xs font-semibold text-gray-500">
                        Фильтрация идёт по дате создания заказа и по статусу
                      </div>
                    </div>

                    <div className="text-xs font-bold text-gray-600">
                      Загружено заказов:{" "}
                      <span className="text-[#111827]">
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
                        className={`${PRIMARY_BUTTON_CLASSNAME} flex-1`}
                      >
                        {isDetailsLoading ? "Загрузка..." : "Применить"}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetOrderFilters}
                        disabled={isDetailsLoading}
                        className={SECONDARY_BUTTON_CLASSNAME}
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

                <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                  <div className="text-sm font-bold text-[#111827]">Заказы</div>

                  <div className="mt-4 space-y-3">
                    {accountOrders.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                        Заказы не найдены по выбранным фильтрам
                      </div>
                    ) : (
                      accountOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-bold text-[#111827]">
                                  Заказ #{order.id}
                                </span>
                                <span
                                  className={getOrderStatusBadge(order.status)}
                                >
                                  {order.status}
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-sm font-semibold text-gray-700">
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Услуга:
                                  </span>{" "}
                                  {order.service_name}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Категория:
                                  </span>{" "}
                                  {order.category}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Адрес:
                                  </span>{" "}
                                  {order.address}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Запланировано:
                                  </span>{" "}
                                  {order.scheduled_at || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Цена:
                                  </span>{" "}
                                  {order.price
                                    ? formatMoney(order.price)
                                    : order.client_price
                                      ? formatMoney(order.client_price)
                                      : "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Мастер:
                                  </span>{" "}
                                  {order.master_name || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Телефон мастера:
                                  </span>{" "}
                                  {order.master_phone || "—"}
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827]">
                                    Телефон пользователя:
                                  </span>{" "}
                                  {order.user_phone || "—"}
                                </div>
                              </div>

                              <div className="mt-3 rounded-[18px] border border-gray-200 bg-[#fbfcfb] p-3 text-sm font-semibold text-gray-700">
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
                  <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                    <div className="text-sm font-bold text-[#111827]">Отзывы</div>

                    <div className="mt-4 space-y-3">
                      {accountReviews.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                          Отзывов нет
                        </div>
                      ) : (
                        accountReviews.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-bold text-[#111827]">
                                Заказ #{item.order_id}
                              </div>
                              <div className="rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-white">
                                {item.rating}/5
                              </div>
                            </div>

                            <div className="mt-2 text-sm font-semibold text-gray-700">
                              {item.comment || "Без комментария"}
                            </div>

                            <div className="mt-2 text-xs font-semibold text-gray-500">
                              {formatDateTime(item.created_at)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                    <div className="text-sm font-bold text-[#111827]">Жалобы</div>

                    <div className="mt-4 space-y-3">
                      {accountComplaints.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                          Жалоб нет
                        </div>
                      ) : (
                        accountComplaints.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-bold text-[#111827]">
                                Жалоба #{item.id}
                              </div>
                              <span className="rounded-full border border-gray-200 bg-[#fbfcfb] px-3 py-1 text-xs font-bold text-gray-600">
                                {item.status_label || item.status}
                              </span>
                              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-[#4f7f56]">
                                {item.reason_label || "Другое"}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">
                                Заказ #{item.order_id}
                              </span>
                            </div>

                            <div className="mt-2 text-sm font-semibold text-gray-700">
                              {item.text}
                            </div>

                            {(item.resolution_label || item.admin_comment) && (
                              <div className="mt-3 rounded-[16px] border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
                                {item.resolution_label && (
                                  <div>Решение: {item.resolution_label}</div>
                                )}
                                {item.admin_comment && (
                                  <div className="mt-1">
                                    {item.admin_comment}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {accountData.role === "master" && (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                      <div className="text-sm font-bold text-[#111827]">
                        Заявки на вывод
                      </div>

                      <div className="mt-4 space-y-3">
                        {accountWithdrawals.length === 0 ? (
                          <div className="rounded-[18px] border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                            Заявок на вывод нет
                          </div>
                        ) : (
                          accountWithdrawals.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-bold text-[#111827]">
                                  Вывод #{item.id}
                                </div>
                                <span className="rounded-full border border-gray-200 bg-[#fbfcfb] px-3 py-1 text-xs font-bold text-gray-600">
                                  {item.status}
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-sm font-semibold text-gray-700">
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

                    <div className="rounded-[22px] border border-gray-200 bg-[#fbfcfb] p-4">
                      <div className="text-sm font-bold text-[#111827]">
                        График мастера
                      </div>

                      <div className="mt-4 space-y-3">
                        {accountSchedule.length === 0 ? (
                          <div className="rounded-[18px] border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                            График не заполнен
                          </div>
                        ) : (
                          accountSchedule.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[18px] border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 shadow-sm"
                            >
                              <div>
                                День недели:{" "}
                                <span className="font-bold text-[#111827]">
                                  {item.weekday}
                                </span>
                              </div>
                              <div>
                                Время:{" "}
                                <span className="font-bold text-[#111827]">
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
