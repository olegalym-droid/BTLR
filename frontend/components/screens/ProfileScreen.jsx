import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { getStoredAuthUser } from "../../lib/auth";

function getNotificationAccent(type, isRead) {
  if (isRead) {
    return {
      cardClass: "border-gray-200 bg-white",
      dotClass: "bg-gray-300",
      badgeClass: "bg-gray-100 text-gray-700",
    };
  }

  if (type === "master_offered_price") {
    return {
      cardClass: "border-amber-300 bg-amber-50",
      dotClass: "bg-amber-500",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }

  if (type === "master_response") {
    return {
      cardClass: "border-blue-300 bg-blue-50",
      dotClass: "bg-blue-500",
      badgeClass: "bg-blue-100 text-blue-800",
    };
  }

  if (type === "order_assigned") {
    return {
      cardClass: "border-green-300 bg-green-50",
      dotClass: "bg-green-500",
      badgeClass: "bg-green-100 text-green-800",
    };
  }

  if (type === "order_offer_rejected") {
    return {
      cardClass: "border-red-300 bg-red-50",
      dotClass: "bg-red-500",
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  return {
    cardClass: "border-black bg-gray-50",
    dotClass: "bg-black",
    badgeClass: "bg-black text-white",
  };
}

function getNotificationTypeLabel(type) {
  if (type === "master_offered_price") return "Новая цена";
  if (type === "master_response") return "Отклик";
  if (type === "order_assigned") return "Назначение";
  if (type === "order_offer_rejected") return "Отклонение";
  return "Уведомление";
}

export default function ProfileScreen({
  profile,
  setProfile,
  newAddressForm,
  setNewAddressForm,
  profileSaved,
  addAddress,
  removeAddress,
  setPrimaryAddress,
  saveProfile,
  handleLogout,
  formatPhoneInput,
  onOpenOrder,
}) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [liveBannerNotification, setLiveBannerNotification] = useState(null);

  const previousTopNotificationIdRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const bannerTimerRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const latestUnreadNotification = useMemo(
    () => notifications.find((item) => !item.is_read) || null,
    [notifications],
  );

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!notifications.length) {
      previousTopNotificationIdRef.current = null;
      previousUnreadCountRef.current = 0;
      return;
    }

    const topNotification = notifications[0];
    const currentUnreadCount = notifications.filter((item) => !item.is_read).length;

    const hadPreviousSnapshot =
      previousTopNotificationIdRef.current !== null ||
      previousUnreadCountRef.current > 0;

    const hasNewTopNotification =
      topNotification &&
      previousTopNotificationIdRef.current !== null &&
      topNotification.id !== previousTopNotificationIdRef.current &&
      !topNotification.is_read;

    const unreadCountIncreased =
      hadPreviousSnapshot &&
      currentUnreadCount > previousUnreadCountRef.current &&
      topNotification &&
      !topNotification.is_read;

    if (hasNewTopNotification || unreadCountIncreased) {
      setLiveBannerNotification(topNotification);

      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }

      bannerTimerRef.current = setTimeout(() => {
        setLiveBannerNotification(null);
      }, 6000);
    }

    previousTopNotificationIdRef.current = topNotification?.id || null;
    previousUnreadCountRef.current = currentUnreadCount;
  }, [notifications]);

  useEffect(() => {
    const authUser = getStoredAuthUser();

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

    const interval = setInterval(() => {
      loadNotifications({ silent: true });
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    const authUser = getStoredAuthUser();

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

      if (liveBannerNotification?.id === notificationId) {
        setLiveBannerNotification(null);
      }
    } catch (error) {
      console.error("Ошибка отметки уведомления:", error);
      alert(error.message || "Не удалось отметить уведомление");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.order_id && typeof onOpenOrder === "function") {
      onOpenOrder(notification.order_id);
    }
  };

  const handleOpenLatestUnread = () => {
    if (!latestUnreadNotification) {
      return;
    }

    handleNotificationClick(latestUnreadNotification);
  };

  const formatNotificationDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("ru-RU");
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
        <p className="text-sm text-gray-700">
          Контакты, адреса и уведомления по вашим заявкам
        </p>
      </div>

      {liveBannerNotification && (
        <div className="rounded-3xl border border-black bg-black p-4 text-white shadow">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                <p className="text-sm font-semibold">Новое уведомление</p>
              </div>

              <p className="mt-2 break-words text-base font-semibold [overflow-wrap:anywhere]">
                {liveBannerNotification.title}
              </p>

              <p className="mt-1 break-words text-sm text-white/80 [overflow-wrap:anywhere]">
                {liveBannerNotification.message}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              {liveBannerNotification.order_id && (
                <button
                  type="button"
                  onClick={() => handleNotificationClick(liveBannerNotification)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Открыть
                </button>
              )}

              <button
                type="button"
                onClick={() => setLiveBannerNotification(null)}
                className="rounded-2xl border border-white/30 px-4 py-3 text-sm font-medium text-white"
              >
                Скрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {unreadCount > 0 && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-red-500" />
                <p className="text-base font-semibold text-black">
                  У вас {unreadCount} непрочитанн
                  {unreadCount === 1 ? "ое уведомление" : unreadCount < 5 ? "ых уведомления" : "ых уведомлений"}
                </p>
              </div>

              {latestUnreadNotification && (
                <p className="mt-2 break-words text-sm text-gray-700 [overflow-wrap:anywhere]">
                  Последнее: {latestUnreadNotification.title}
                </p>
              )}
            </div>

            {latestUnreadNotification?.order_id && (
              <button
                type="button"
                onClick={handleOpenLatestUnread}
                className="shrink-0 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white"
              >
                Открыть заказ
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-black">Уведомления</h2>
            <p className="mt-1 text-sm text-gray-600">
              Здесь появляются отклики мастеров, выбор исполнителя и новые цены
            </p>
          </div>

          <div
            className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
              unreadCount > 0
                ? "bg-red-500 text-white"
                : "bg-black text-white"
            }`}
          >
            {unreadCount > 0 ? `${unreadCount} новых` : "Нет новых"}
          </div>
        </div>

        {isNotificationsLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Загрузка уведомлений...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            Пока уведомлений нет
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const accent = getNotificationAccent(
                notification.type,
                notification.is_read,
              );

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${accent.cardClass}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${accent.dotClass}`}
                        />

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${accent.badgeClass}`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>

                        {!notification.is_read && (
                          <span className="rounded-full bg-black px-2 py-1 text-xs font-medium text-white">
                            Новое
                          </span>
                        )}
                      </div>

                      <p className="break-words text-base font-semibold text-black [overflow-wrap:anywhere]">
                        {notification.title}
                      </p>

                      <p className="break-words text-sm leading-6 text-gray-700 [overflow-wrap:anywhere]">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                        {notification.order_id && (
                          <p>Заказ №{notification.order_id}</p>
                        )}

                        <p>{formatNotificationDate(notification.created_at)}</p>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notification.id);
                        }}
                        disabled={markingNotificationId === notification.id}
                        className="shrink-0 rounded-xl border border-black px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                      >
                        {markingNotificationId === notification.id
                          ? "Сохранение..."
                          : "Прочитано"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Имя</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-2xl border p-4 text-black"
            placeholder="Введите имя"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Телефон</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                phone: formatPhoneInput(e.target.value),
              }))
            }
            className="w-full rounded-2xl border p-4 text-black"
            placeholder="+7 777 123 45 67"
            inputMode="tel"
          />
          <p className="text-xs text-gray-500">
            Вводите номер в международном формате
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-black">Адреса</p>
            <p className="text-xs text-gray-500">
              Заполните адрес по частям, так он будет понятнее и удобнее
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={newAddressForm.city}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              className="w-full rounded-2xl border p-4 text-black"
              placeholder="Город"
              maxLength={50}
            />

            <input
              type="text"
              value={newAddressForm.street}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  street: e.target.value,
                }))
              }
              className="w-full rounded-2xl border p-4 text-black"
              placeholder="Улица"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newAddressForm.house}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    house: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border p-4 text-black"
                placeholder="Дом"
                maxLength={20}
              />

              <input
                type="text"
                value={newAddressForm.apartment}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    apartment: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border p-4 text-black"
                placeholder="Квартира"
                maxLength={20}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addAddress}
            className="w-full rounded-2xl border border-black px-4 py-3 text-sm font-medium text-black"
          >
            Добавить адрес
          </button>

          <div className="space-y-3">
            {profile.addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Адресов пока нет
              </div>
            ) : (
              profile.addresses.map((addressItem, index) => {
                const isPrimary = index === profile.primaryAddressIndex;

                return (
                  <div
                    key={`${addressItem}-${index}`}
                    className="space-y-3 rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm text-black [overflow-wrap:anywhere]">
                          {addressItem}
                        </p>
                        {isPrimary && (
                          <p className="mt-1 text-xs font-medium text-green-700">
                            Основной адрес
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryAddress(index)}
                            className="rounded-xl border border-black px-3 py-2 text-xs font-medium text-black"
                          >
                            Сделать основным
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeAddress(index)}
                          className="rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={saveProfile}
            className="w-full rounded-2xl bg-black px-4 py-4 text-sm font-medium text-white"
          >
            Сохранить профиль
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-sm font-medium text-black"
          >
            Выйти
          </button>
        </div>

        {profileSaved && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Профиль сохранён
          </div>
        )}
      </div>
    </div>
  );
}