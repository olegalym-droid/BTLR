import { useMemo, useState } from "react";
import { getStatusLabel } from "../../lib/orders";
import MasterOrderPhotos from "./MasterOrderPhotos";

const ITEMS_PER_PAGE = 3;

export default function MasterAvailableOrdersSection({
  masterProfile,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  onOpenPhoto,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(availableOrders.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(
    () =>
      availableOrders.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE,
      ),
    [availableOrders, safeCurrentPage],
  );

  return (
    <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-black">Доступные заказы</h2>

        <button
          type="button"
          onClick={() => loadAvailableOrders(masterProfile?.id)}
          className="rounded-xl border border-black bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Обновить
        </button>
      </div>

      {isAvailableLoading && (
        <p className="text-sm text-black">Загрузка доступных заказов...</p>
      )}

      {!isAvailableLoading && availableOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-400 p-4 text-sm text-gray-700">
          Сейчас доступных заказов нет
        </div>
      )}

      <div className="space-y-4">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-gray-300 bg-white p-5 space-y-4 overflow-hidden"
          >
            <div className="space-y-3 min-w-0">
              <p className="text-2xl font-bold leading-tight text-black break-words [overflow-wrap:anywhere]">
                {order.service_name}
              </p>

              <div>
                <span className="inline-flex rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900">
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <p className="text-lg text-gray-800 break-words [overflow-wrap:anywhere]">
                {order.category}
              </p>
            </div>

            <p className="text-lg leading-relaxed text-gray-800 break-words [overflow-wrap:anywhere]">
              {order.description}
            </p>

            <MasterOrderPhotos
              photos={order.photos}
              onOpenPhoto={onOpenPhoto}
            />

            <p className="text-lg leading-relaxed text-gray-900 break-words [overflow-wrap:anywhere]">
              <span className="font-semibold text-black">Адрес:</span>{" "}
              {order.address}
            </p>

            <p className="text-lg text-gray-900">
              <span className="font-semibold text-black">Дата:</span>{" "}
              {order.scheduled_at}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTakeOrder(order.id)}
                className="w-full rounded-xl bg-black py-3 text-white"
              >
                Взять заказ
              </button>

              <button
                type="button"
                onClick={() =>
                  setAvailableOrders((prev) =>
                    prev.filter((item) => item.id !== order.id),
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white py-3 text-black"
              >
                Пропустить
              </button>
            </div>
          </div>
        ))}
      </div>

      {availableOrders.length > ITEMS_PER_PAGE && (
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
    </div>
  );
}