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
    () => activeOrders.filter((order) => order.status === ORDER_STATUSES.SEARCHING),
    [activeOrders],
  );

  const acceptedOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          order.status === ORDER_STATUSES.PENDING_USER_CONFIRMATION ||
          order.status === ORDER_STATUSES.ASSIGNED ||
          order.status === ORDER_STATUSES.ON_THE_WAY ||
          order.status === ORDER_STATUSES.ON_SITE,
      ),
    [activeOrders],
  );

  const doneOrders = useMemo(
    () =>
      completedOrders.filter((order) =>
        USER_DONE_ORDER_STATUSES.includes(order.status),
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
    if (ordersTab === "sent") return "У вас пока нет отправленных заявок";
    if (ordersTab === "accepted") return "У вас пока нет активных заказов";
    return "У вас пока нет завершённых заказов";
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-black">Мои заказы</h1>
        <p className="text-sm text-gray-700">
          История заявок и текущих заказов
        </p>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-1.5 shadow">
        <button
          type="button"
          onClick={() => {
            setOrdersTab("sent");
            setCurrentPage(1);
          }}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            ordersTab === "sent" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          Отправленные
        </button>

        <button
          type="button"
          onClick={() => {
            setOrdersTab("accepted");
            setCurrentPage(1);
          }}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            ordersTab === "accepted"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Активные
        </button>

        <button
          type="button"
          onClick={() => {
            setOrdersTab("done");
            setCurrentPage(1);
          }}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            ordersTab === "done" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          Завершённые
        </button>
      </div>

      {currentOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-700 shadow-sm">
          {getEmptyText()}
        </div>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-xl border px-4 py-2 text-sm text-black disabled:opacity-50"
              >
                Назад
              </button>

              <span className="text-sm text-gray-700">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
                className="rounded-xl border px-4 py-2 text-sm text-black disabled:opacity-50"
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