import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../lib/constants";
import { getAuthHeaders, getStoredAuthUser } from "../lib/auth";
import { ClipboardList, MessageCircle, User, Wrench } from "lucide-react";
import { loadChatConversations } from "../lib/chats";

const NAV_ITEMS = [
  {
    key: "services",
    label: "Услуги",
    icon: Wrench,
  },
  {
    key: "orders",
    label: "Заказы",
    icon: ClipboardList,
  },
  {
    key: "chats",
    label: "Чаты",
    icon: MessageCircle,
  },
  {
    key: "profile",
    label: "Профиль",
    icon: User,
  },
];

const NAV_POLL_INTERVAL_MS = 15000;

export default function BottomNav({ activeTab, onTabChange }) {
  const [notifications, setNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  useEffect(() => {
    const authUser = getStoredAuthUser("user");

    if (!authUser?.id || authUser.role !== "user") {
      setNotifications([]);
      return;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          headers: getAuthHeaders("user"),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Не удалось загрузить уведомления");
        }

        if (!isMounted) {
          return;
        }

        setNotifications(Array.isArray(data) ? data : []);

        const conversations = await loadChatConversations({
          viewerRole: "user",
          accountId: authUser.id,
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
        console.error("Ошибка загрузки уведомлений в навигации:", error);

        if (!isMounted) {
          return;
        }

        setNotifications([]);
        setChatUnreadCount(0);
      }
    };

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, NAV_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="rounded-[28px] border border-gray-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          const showUnreadBadge = item.key === "profile" && unreadCount > 0;
          const showChatBadge = item.key === "chats" && chatUnreadCount > 0;
          const badgeValue = showChatBadge ? chatUnreadCount : unreadCount;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={`relative flex min-h-[78px] items-center justify-center gap-3 rounded-[20px] px-4 py-4 transition ${
                isActive
                  ? "bg-[#dff0da] text-[#5f9557]"
                  : "bg-white text-[#3b3f45] hover:bg-[#f7faf6]"
              }`}
            >
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isActive ? "bg-[#dff0da]" : "bg-[#f3f6f1]"
                }`}
              >
                <Icon size={22} strokeWidth={2} />

                {(showUnreadBadge || showChatBadge) && (
                  <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white shadow">
                    {badgeValue > 9 ? "9+" : badgeValue}
                  </span>
                )}
              </div>

              <span className="text-base font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
