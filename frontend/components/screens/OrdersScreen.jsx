import { useMemo, useState } from "react";
import OrderCard from "../OrderCard";
import {
  ORDER_STATUSES,
  USER_DONE_ORDER_STATUSES,
} from "../../lib/orders";

const ITEMS_PER_PAGE = 5;

export default function OrdersScreen({
  activeOrders,
  completedOrders,
  getStatusLabel,
  setSelectedOrder,
}) {
  const [ordersTab, setOrdersTab] = useState("sent");
  const [currentPage, setCurrentPage] = useState(1);

  const sentOrders = useMemo(
    () => activeOrders.filter((o) => o.status === ORDER_STATUSES.SEARCHING),
    [activeOrders],
  );

  const acceptedOrders = useMemo(
    () =>
      activeOrders.filter((o) =>
        [
          ORDER_STATUSES.PENDING_USER_CONFIRMATION,
          ORDER_STATUSES.ASSIGNED,
          ORDER_STATUSES.ON_THE_WAY,
          ORDER_STATUSES.ON_SITE,
        ].includes(o.status),
      ),
    [activeOrders],
  );

  const doneOrders = useMemo(
    () =>
      completedOrders.filter((o) =>
        USER_DONE_ORDER_STATUSES.includes(o.status),
      ),
    [completedOrders],
  );

  const currentOrders = useMemo(() => {
    if (ordersTab === "sent") return sentOrders;
    if (ordersTab === "accepted") return acceptedOrders;
    return doneOrders;
  }, [ordersTab, sentOrders, acceptedOrders, doneOrders]);

  const totalPages = Math.ceil(currentOrders.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(
    () =>
      currentOrders.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE,
      ),
    [currentOrders, safeCurrentPage],
  );

  const getEmptyText = () => {
    if (ordersTab === "sent") return "Нет отправленных заявок";
    if (ordersTab === "accepted") return "Нет активных заказов";
    return "Нет завершённых заказов";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#25302c]">Мои заказы</h1>
        <p className="text-gray-500">
          История и текущие заявки
        </p>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 shadow-sm border">
        {[
          { key: "sent", label: "Отправленные" },
          { key: "accepted", label: "Активные" },
          { key: "done", label: "Завершённые" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setOrdersTab(tab.key);
              setCurrentPage(1);
            }}
            className={`rounded-xl py-3 text-sm font-medium transition ${
              ordersTab === tab.key
                ? "bg-[#e6f3e2] text-[#4f7d4f]"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* EMPTY */}
      {currentOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">
          {getEmptyText()}
        </div>
      ) : (
        <>
          {/* LIST */}
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusLabel={getStatusLabel}
                onClick={setSelectedOrder}
              />
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                disabled={safeCurrentPage === 1}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
              >
                Назад
              </button>

              <span className="text-sm text-gray-600">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
              >
                Далее
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}