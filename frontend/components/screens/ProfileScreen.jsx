import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { getStoredAuthUser } from "../../lib/auth";

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

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

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

      <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-black">Уведомления</h2>
            <p className="mt-1 text-sm text-gray-600">
              Здесь появляются отклики мастеров и предложения по цене
            </p>
          </div>

          <div className="shrink-0 rounded-full bg-black px-3 py-2 text-sm font-semibold text-white">
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
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`rounded-2xl border p-4 cursor-pointer ${
                  notification.is_read
                    ? "border-gray-200 bg-white"
                    : "border-black bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-base font-semibold text-black [overflow-wrap:anywhere]">
                        {notification.title}
                      </p>

                      {!notification.is_read && (
                        <span className="rounded-full bg-black px-2 py-1 text-xs font-medium text-white">
                          Новое
                        </span>
                      )}
                    </div>

                    <p className="break-words text-sm leading-6 text-gray-700 [overflow-wrap:anywhere]">
                      {notification.message}
                    </p>

                    {notification.order_id && (
                      <p className="text-xs text-gray-500">
                        Заказ №{notification.order_id}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      {formatNotificationDate(notification.created_at)}
                    </p>
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
                        : "Отметить прочитанным"}
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                    className="rounded-2xl border border-gray-200 p-4 space-y-3"
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