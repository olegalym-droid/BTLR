import { getStatusLabel } from "../../lib/orders";
import MasterOrderPhotos from "./MasterOrderPhotos";

export default function MasterAvailableOrdersSection({
  masterProfile,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  onOpenPhoto,
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-black">Доступные заказы</h2>

        <button
          type="button"
          onClick={() => loadAvailableOrders(masterProfile?.id)}
          className="rounded-xl border px-3 py-2 text-sm text-black"
        >
          Обновить
        </button>
      </div>

      {isAvailableLoading && (
        <p className="text-sm text-gray-600">Загрузка заказов...</p>
      )}

      {!isAvailableLoading && availableOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed p-4 text-sm text-gray-600">
          Сейчас доступных заказов нет
        </div>
      )}

      <div className="space-y-3">
        {availableOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-black">{order.service_name}</p>
                <p className="text-sm text-gray-700">{order.category}</p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
                {getStatusLabel(order.status)}
              </span>
            </div>

            <p className="text-sm text-gray-800">{order.description}</p>

            <MasterOrderPhotos
              photos={order.photos}
              onOpenPhoto={onOpenPhoto}
            />

            <p className="text-sm text-gray-700">
              <span className="font-medium text-black">Адрес:</span>{" "}
              {order.address}
            </p>

            <p className="text-sm text-gray-700">
              <span className="font-medium text-black">Дата:</span>{" "}
              {order.scheduled_at}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
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
                className="w-full rounded-xl border border-gray-300 py-3 text-black"
              >
                Пропустить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
