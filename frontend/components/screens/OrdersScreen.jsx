import { useMemo, useState } from "react";
import OrderCard from "../OrderCard";

const ITEMS_PER_PAGE = 3;

export default function OrdersScreen({
  activeOrders,
  completedOrders,
  getStatusLabel,
  setSelectedOrder,
}) {
  const [ordersTab, setOrdersTab] = useState("sent");
  const [currentPage, setCurrentPage] = useState(1);

  const sentOrders = useMemo(
    () => activeOrders.filter((order) => order.status === "searching"),
    [activeOrders],
  );

  const acceptedOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          order.status === "assigned" ||
          order.status === "on_the_way" ||
          order.status === "on_site",
      ),
    [activeOrders],
  );

  const doneOrders = useMemo(() => completedOrders, [completedOrders]);

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
    if (ordersTab === "sent") return "У вас нет отправленных заявок";
    if (ordersTab === "accepted") return "У вас нет принятых заказов";
    return "У вас нет выполненных заказов";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Мои заказы</h1>
        <p className="mt-1 text-sm text-gray-700">
          История заявок и текущих заказов
        </p>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-2 shadow">
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
          Принятые
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
          Выполненные
        </button>
      </div>

      {currentOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-400 bg-white p-4 text-gray-700">
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

          {currentOrders.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium ${
                      safeCurrentPage === page
                        ? "bg-black text-white"
                        : "border border-gray-300 bg-white text-black"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
