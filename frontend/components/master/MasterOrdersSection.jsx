import { getStatusLabel } from "../../lib/orders";
import MasterOrderPhotos from "./MasterOrderPhotos";

export default function MasterOrdersSection({
  masterProfile,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  onOpenPhoto,
}) {
  const renderMasterOrderAction = (order) => {
    if (order.status === "assigned") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "on_the_way")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Выехал
        </button>
      );
    }

    if (order.status === "on_the_way") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "on_site")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          На месте
        </button>
      );
    }

    if (order.status === "on_site") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "completed")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Завершить
        </button>
      );
    }

    if (order.status === "completed") {
      return (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Ожидает оплату от пользователя
        </div>
      );
    }

    if (order.status === "paid") {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Заказ оплачен
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-black">Мои заказы</h2>

        <button
          type="button"
          onClick={() =>
            masterProfile?.id && loadMasterOrders(masterProfile.id)
          }
          className="rounded-xl border px-3 py-2 text-sm text-black"
        >
          Обновить
        </button>
      </div>

      {isMasterOrdersLoading && (
        <p className="text-sm text-gray-600">Загрузка заказов мастера...</p>
      )}

      {!isMasterOrdersLoading && masterOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed p-4 text-sm text-gray-600">
          У вас пока нет принятых заказов
        </div>
      )}

      <div className="space-y-3">
        {masterOrders.map((order) => (
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

            {order.price && (
              <p className="text-sm font-medium text-black">
                Сумма: {order.price}
              </p>
            )}

            {renderMasterOrderAction(order)}
          </div>
        ))}
      </div>
    </div>
  );
}
