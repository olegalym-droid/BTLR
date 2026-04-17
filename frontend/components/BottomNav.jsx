import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../lib/constants";
import { getStoredAuthUser } from "../lib/auth";

const NAV_ITEMS = [
  { key: "services", label: "Услуги", icon: "🛠️" },
  { key: "orders", label: "Заказы", icon: "📋" },
  { key: "profile", label: "Профиль", icon: "👤" },
];

export default function BottomNav({ activeTab, onTabChange }) {
  const [notifications, setNotifications] = useState([]);

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

    const loadNotifications = async () => {
      try {
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
        console.error("Ошибка загрузки уведомлений в навигации:", error);

        if (!isMounted) {
          return;
        }

        setNotifications([]);
      }
    };

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="rounded-3xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const showUnreadBadge = item.key === "profile" && unreadCount > 0;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={`relative flex min-h-[72px] flex-col items-center justify-center rounded-2xl px-3 py-3 transition ${
                isActive
                  ? "bg-black text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="relative">
                <span className="text-xl">{item.icon}</span>

                {showUnreadBadge && (
                  <span className="absolute -right-2 -top-2 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <span className="mt-1 text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}