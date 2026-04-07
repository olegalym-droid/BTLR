export default function OrderCard({ order, getStatusLabel, onClick }) {
  const isActive = order.status !== "completed" && order.status !== "paid";

  return (
    <div
      onClick={() => onClick(order)}
      className="border p-4 rounded-2xl shadow bg-white space-y-4 cursor-pointer active:scale-[0.99] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-black">
            {order.service_name}
          </h3>
          <p className="text-sm text-gray-700">{order.category}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            isActive
              ? "bg-gray-100 text-gray-900"
              : "bg-green-100 text-green-800"
          }`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-800">
        <p>{order.description}</p>
        <p>
          <span className="font-medium text-black">Адрес:</span> {order.address}
        </p>
        <p>
          <span className="font-medium text-black">Дата:</span>{" "}
          {order.scheduled_at}
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 space-y-2">
        <p className="text-sm font-medium text-black">
          Мастер: {order.master_name || "назначается..."}
        </p>

        {order.master_rating && (
          <p className="text-sm text-gray-700">
            Рейтинг: ⭐ {order.master_rating}
          </p>
        )}

        {order.price && (
          <p className="text-sm font-semibold text-black">
            Сумма: {order.price}
          </p>
        )}
      </div>
    </div>
  );
}
