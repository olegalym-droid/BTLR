export default function OrderDetails({
  selectedOrder,
  getStatusLabel,
  onBack,
}) {
  if (!selectedOrder) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500"
      >
        ← Назад
      </button>

      <div className="border p-4 rounded-2xl bg-white space-y-4 shadow">
        <div>
          <h1 className="text-xl font-bold">{selectedOrder.service_name}</h1>
          <p className="text-sm text-gray-500">{selectedOrder.category}</p>
        </div>

        <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
          {getStatusLabel(selectedOrder.status)}
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p>{selectedOrder.description}</p>
          <p>
            <span className="font-medium text-black">Адрес:</span>{" "}
            {selectedOrder.address}
          </p>
          <p>
            <span className="font-medium text-black">Дата:</span>{" "}
            {selectedOrder.scheduled_at}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-3 space-y-2">
          <p className="font-medium text-black">
            Мастер: {selectedOrder.master_name || "назначается..."}
          </p>

          {selectedOrder.master_rating && (
            <p className="text-sm text-gray-600">
              Рейтинг: ⭐ {selectedOrder.master_rating}
            </p>
          )}

          {selectedOrder.price && (
            <p className="text-sm font-semibold text-black">
              Сумма: {selectedOrder.price}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-black text-white py-3 rounded-lg">
            Написать
          </button>

          <button className="flex-1 border border-gray-300 py-3 rounded-lg">
            Позвонить
          </button>
        </div>
      </div>
    </div>
  );
}