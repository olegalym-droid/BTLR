import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  House,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  User,
  LogOut,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";
import { getStoredAuthUser } from "../../lib/auth";
import { formatPublicOrderCode } from "../../lib/orders";
import ChatModal from "../chat/ChatModal";

const NOTIFICATIONS_PREF_KEY = "user_notifications_enabled";

function getNotificationsStorageKey(userId) {
  return `${NOTIFICATIONS_PREF_KEY}_${userId}`;
}

function getNotificationTypeLabel(type) {
  if (type === "master_offered_price") return "Новая цена";
  if (type === "master_response") return "Отклик мастера";
  if (type === "order_assigned") return "Мастер выбран";
  if (type === "order_offer_rejected") return "Отклонённый отклик";
  return "Уведомление";
}

function getNotificationAccent(type, isRead) {
  if (isRead) {
    return {
      cardClass: "border-gray-200 bg-white",
      badgeClass: "bg-gray-100 text-gray-700",
      dotClass: "bg-gray-300",
    };
  }

  if (type === "master_offered_price") {
    return {
      cardClass: "border-amber-200 bg-amber-50",
      badgeClass: "bg-amber-100 text-amber-800",
      dotClass: "bg-amber-500",
    };
  }

  if (type === "master_response") {
    return {
      cardClass: "border-blue-200 bg-blue-50",
      badgeClass: "bg-blue-100 text-blue-800",
      dotClass: "bg-blue-500",
    };
  }

  if (type === "order_assigned") {
    return {
      cardClass: "border-green-200 bg-green-50",
      badgeClass: "bg-green-100 text-green-800",
      dotClass: "bg-green-500",
    };
  }

  if (type === "order_offer_rejected") {
    return {
      cardClass: "border-red-200 bg-red-50",
      badgeClass: "bg-red-100 text-red-800",
      dotClass: "bg-red-500",
    };
  }

  return {
    cardClass: "border-gray-300 bg-gray-50",
    badgeClass: "bg-black text-white",
    dotClass: "bg-black",
  };
}

function formatNotificationDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function AddressCard({
  index,
  address,
  isPrimary,
  setPrimaryAddress,
  removeAddress,
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f1f5ee] text-[#72a06d]">
        {isPrimary ? <House size={22} /> : <MapPin size={22} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold text-[#25302c]">
            {isPrimary ? "Основной адрес" : `Адрес ${index + 1}`}
          </p>

          {isPrimary && (
            <span className="rounded-full bg-[#eef6ea] px-3 py-1 text-xs font-semibold text-[#6f9a61]">
              Основной
            </span>
          )}
        </div>

        <p className="mt-1 break-words text-sm text-gray-600">{address}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isPrimary && (
          <button
            type="button"
            onClick={() => setPrimaryAddress(index)}
            className="rounded-xl border border-[#b9d3b6] bg-[#f8fcf7] px-3 py-2 text-sm font-medium text-[#6f9a61]"
          >
            Сделать основным
          </button>
        )}

        <button
          type="button"
          onClick={() => removeAddress(index)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  markingNotificationId,
  markNotificationAsRead,
  handleNotificationClick,
}) {
  const accent = getNotificationAccent(notification.type, notification.is_read);
  const orderCode = notification.order_id
    ? formatPublicOrderCode(notification.order_id)
    : "";

  return (
    <div
      className={`rounded-2xl border p-4 transition ${accent.cardClass} ${
        notification.order_id ? "cursor-pointer hover:shadow-sm" : ""
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${accent.dotClass}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${accent.badgeClass}`}
            >
              {getNotificationTypeLabel(notification.type)}
            </span>

            {!notification.is_read && (
              <span className="rounded-full bg-[#eef6ea] px-2.5 py-1 text-xs font-semibold text-[#6f9a61]">
                Новое
              </span>
            )}

            {orderCode && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                {orderCode}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-[#2b3531]">
            {notification.text}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>{formatNotificationDate(notification.created_at)}</span>
          </div>
        </div>

        {!notification.is_read && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              markNotificationAsRead(notification.id);
            }}
            disabled={markingNotificationId === notification.id}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
          >
            {markingNotificationId === notification.id ? "..." : "Прочитано"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileScreen({
  profile,
  newAddressForm,
  setNewAddressForm,
  profileSaved,
  addAddress,
  removeAddress,
  setPrimaryAddress,
  handleLogout,
  onOpenOrder,
}) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] =
    useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);

  const intervalRef = useRef(null);

  const authUser = useMemo(() => getStoredAuthUser("user"), []);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );
  const adminChatStartRequest = useMemo(
    () => ({
      conversationType: "admin",
    }),
    [],
  );

  useEffect(() => {
    if (!authUser?.id || typeof window === "undefined") {
      return;
    }

    const savedValue = window.localStorage.getItem(
      getNotificationsStorageKey(authUser.id),
    );

    if (savedValue === null) {
      setNotificationsEnabled(true);
      return;
    }

    setNotificationsEnabled(savedValue === "true");
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getNotificationsStorageKey(authUser.id),
      String(notificationsEnabled),
    );
  }, [authUser?.id, notificationsEnabled]);

  useEffect(() => {
    if (!authUser?.id || authUser.role !== "user") {
      setNotifications([]);
      return;
    }

    let isMounted = true;

    const loadNotifications = async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setIsNotificationsLoading(true);
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications?user_id=${authUser.id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Не удалось загрузить уведомления");
        }

        if (!isMounted) {
          return;
        }

        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки уведомлений:", error);

        if (!isMounted) {
          return;
        }

        setNotifications([]);
      } finally {
        if (isMounted && !silent) {
          setIsNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    intervalRef.current = setInterval(() => {
      loadNotifications({ silent: true });
    }, 5000);

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authUser?.id, authUser?.role]);

  const markNotificationAsRead = async (notificationId) => {
    if (!authUser?.id) {
      return;
    }

    try {
      setMarkingNotificationId(notificationId);

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read?user_id=${authUser.id}`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось отметить уведомление");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error) {
      console.error("Ошибка отметки уведомления:", error);
      alert(error.message || "Не удалось отметить уведомление");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.is_read);

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((item) =>
          fetch(
            `${API_BASE_URL}/notifications/${item.id}/read?user_id=${authUser.id}`,
            {
              method: "PUT",
            },
          ),
        ),
      );

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
    } catch (error) {
      console.error("Ошибка массовой отметки уведомлений:", error);
      alert("Не удалось отметить все уведомления");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?.is_read) {
      await markNotificationAsRead(notification.id);
    }

    if (notification?.order_id && typeof onOpenOrder === "function") {
      setIsNotificationsModalOpen(false);
      onOpenOrder(notification.order_id);
    }
  };

  const primaryAddress = profile.addresses?.[profile.primaryAddressIndex] || "";
  const displayName = profile.name || authUser?.fullName || "Не указано";
  const displayPhone = profile.phone || authUser?.phone || "Не указан";

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#25302c]">Профиль</h1>
          <p className="text-sm text-gray-500">
            Ваши контакты, адреса и уведомления
          </p>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f1f5ee] text-[#72a06d]">
                <Bell size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#25302c]">
                  Уведомления
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Здесь вы можете управлять уведомлениями и смотреть все события
                  по заказам
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-semibold text-[#6f9a61]"
            >
              Открыть уведомления
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-[#fbfcfb] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#25302c]">
                  Получение уведомлений
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Один общий переключатель для всех уведомлений по заказам
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className={`relative h-8 w-14 rounded-full transition ${
                  notificationsEnabled ? "bg-[#74a86c]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                    notificationsEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-[#d8e5d4] bg-[#fbfdfb] px-4 py-4">
            {isNotificationsLoading ? (
              <div className="flex items-center justify-between rounded-[22px] border border-gray-200 bg-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#eef6ea]" />
                  <div className="space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100" />
                  </div>
                </div>
                <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />
              </div>
            ) : unreadCount > 0 ? (
              <div className="flex flex-col gap-4 rounded-[22px] border border-[#cfe3c9] bg-gradient-to-r from-[#f4fbf2] to-[#fbfdfb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7f4e2] text-[#6f9a61] shadow-sm">
                    <Bell size={20} />
                    <span className="absolute -right-1 -top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white shadow">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#25302c] sm:text-base">
                      У вас {unreadCount} непрочитанн
                      {unreadCount === 1
                        ? "ое уведомление"
                        : unreadCount >= 2 && unreadCount <= 4
                          ? "ых уведомления"
                          : "ых уведомлений"}
                    </p>
                    <p className="mt-1 text-xs text-[#6d7b72] sm:text-sm">
                      Откройте список, чтобы посмотреть новые события по заказам
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNotificationsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7fb276] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6fa565] sm:shrink-0"
                >
                  Посмотреть
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[22px] border border-dashed border-[#d8e5d4] bg-[#fbfdfb] px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ea] text-[#6f9a61]">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#25302c]">
                    Пока уведомлений нет
                  </p>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Здесь будут появляться отклики мастеров и изменения по заказам
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f1f5ee] text-[#72a06d]">
                <MessageCircle size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#25302c]">
                  Чат с администратором
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Напишите администратору внутри приложения, без перехода в WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAdminChatOpen(true)}
              disabled={!authUser?.id}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#7fb276] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6fa565] disabled:opacity-60"
            >
              <MessageCircle size={18} />
              Открыть чат
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#25302c]">Данные аккаунта</h2>
          <p className="mt-1 text-sm text-gray-500">
            Имя, фамилия и телефон берутся из регистрации. В профиле отдельно
            хранятся только адреса для заказов.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-[#fbfcfb] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1f5ee] text-[#72a06d]">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Имя и фамилия
                  </p>
                  <p className="mt-1 break-words text-base font-semibold text-[#25302c]">
                    {displayName}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-[#fbfcfb] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1f5ee] text-[#72a06d]">
                  <Phone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Телефон
                  </p>
                  <p className="mt-1 break-words text-base font-semibold text-[#25302c]">
                    {displayPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#25302c]">Адреса</h2>
          <p className="mt-1 text-sm text-gray-500">
            Укажите адреса, чтобы мастерам было удобнее к вам добираться
          </p>

          <div className="mt-5 space-y-3">
            {profile.addresses.length > 0 ? (
              profile.addresses.map((item, index) => (
                <AddressCard
                  key={`${item}-${index}`}
                  index={index}
                  address={item}
                  isPrimary={index === profile.primaryAddressIndex}
                  setPrimaryAddress={setPrimaryAddress}
                  removeAddress={removeAddress}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d8e5d4] bg-[#fbfdfb] px-4 py-5 text-sm text-gray-500">
                Адресов пока нет
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-[#fbfcfb] p-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#76a16f]" />
              <p className="text-sm font-semibold text-[#25302c]">
                Добавить новый адрес
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={newAddressForm.city}
                onChange={(event) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-[#25302c] outline-none"
                placeholder="Город"
              />

              <input
                value={newAddressForm.street}
                onChange={(event) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    street: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-[#25302c] outline-none"
                placeholder="Улица"
              />

              <input
                value={newAddressForm.house}
                onChange={(event) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    house: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-[#25302c] outline-none"
                placeholder="Дом"
              />

              <input
                value={newAddressForm.apartment}
                onChange={(event) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    apartment: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-[#25302c] outline-none"
                placeholder="Квартира"
              />
            </div>

            <button
              type="button"
              onClick={addAddress}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#b9d3b6] bg-white px-4 py-4 text-base font-semibold text-[#6f9a61]"
            >
              <PlusCircle size={20} />
              Добавить адрес
            </button>

            {primaryAddress ? (
              <div className="rounded-2xl border border-[#d8e5d4] bg-[#f9fcf8] p-4 text-sm text-gray-600">
                <span className="font-semibold text-[#25302c]">
                  Текущий основной:
                </span>{" "}
                {primaryAddress}
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#25302c]"
            >
              <LogOut size={20} />
              Выйти из аккаунта
            </button>
          </div>

          {profileSaved && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
              <CheckCircle2 size={18} />
              Профиль сохранён
            </div>
          )}
        </div>
      </div>

      <ChatModal
        isOpen={isAdminChatOpen}
        onClose={() => setIsAdminChatOpen(false)}
        viewerRole="user"
        accountId={authUser?.id}
        startRequest={adminChatStartRequest}
        title="Чат с администратором"
      />

      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-2xl font-bold text-[#25302c]">
                  Уведомления
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Все события по вашим заказам в одном месте
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f7f4] text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-[#f8fbf7] px-4 py-3">
                    <p className="text-sm font-medium text-gray-500">
                      Получение уведомлений
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#25302c]">
                      {notificationsEnabled ? "Включено" : "Отключено"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8fbf7] px-4 py-3">
                    <p className="text-sm font-medium text-gray-500">
                      Непрочитанные
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#25302c]">
                      {unreadCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled((prev) => !prev)}
                    className={`relative h-8 w-14 rounded-full transition ${
                      notificationsEnabled ? "bg-[#74a86c]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                        notificationsEnabled ? "left-7" : "left-1"
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    disabled={unreadCount === 0}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#25302c] disabled:opacity-50"
                  >
                    Отметить все как прочитанные
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
              {isNotificationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="space-y-3">
                        <div className="h-4 w-28 animate-pulse rounded-full bg-gray-100" />
                        <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
                        <div className="h-3 w-3/4 animate-pulse rounded-full bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8e5d4] bg-[#fbfdfb] p-5 text-sm text-gray-500">
                  Пока уведомлений нет
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      markingNotificationId={markingNotificationId}
                      markNotificationAsRead={markNotificationAsRead}
                      handleNotificationClick={handleNotificationClick}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#25302c]"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
