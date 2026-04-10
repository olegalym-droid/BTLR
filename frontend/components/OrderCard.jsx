const DESCRIPTION_PREVIEW_LENGTH = 120;
const ADDRESS_PREVIEW_LENGTH = 90;

function truncateText(value, maxLength) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

export default function OrderCard({ order, getStatusLabel, onClick }) {
  const isActive = order.status !== "completed" && order.status !== "paid";
  const photosCount = Array.isArray(order.photos) ? order.photos.length : 0;

  const descriptionPreview = truncateText(
    order.description,
    DESCRIPTION_PREVIEW_LENGTH,
  );

  const addressPreview = truncateText(order.address, ADDRESS_PREVIEW_LENGTH);

  return (
    <button
      type="button"
      onClick={() => onClick(order)}
      className="w-full text-left border p-4 rounded-2xl shadow bg-white space-y-4 active:scale-[0.99] transition overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-black break-words [overflow-wrap:anywhere]">
            {order.service_name}
          </h3>

          <p className="text-sm text-gray-700 mt-1 break-words [overflow-wrap:anywhere]">
            {order.category}
          </p>

          {order.master_name && (
            <p className="text-sm text-gray-700 mt-1 break-words [overflow-wrap:anywhere]">
              👨‍🔧 Мастер: {order.master_name}
            </p>
          )}
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

      <div className="space-y-2 text-sm text-gray-800 min-w-0">
        <p className="break-words [overflow-wrap:anywhere]">
          {descriptionPreview}
        </p>

        <p className="break-words [overflow-wrap:anywhere]">
          <span className="font-medium text-black">Адрес:</span>{" "}
          {addressPreview}
        </p>

        <p className="break-words [overflow-wrap:anywhere]">
          <span className="font-medium text-black">Дата:</span>{" "}
          {order.scheduled_at}
        </p>

        {photosCount > 0 && (
          <p>
            <span className="font-medium text-black">Фото:</span> {photosCount}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-gray-50 p-3 space-y-2 min-w-0">
        <p className="text-sm font-medium text-black break-words [overflow-wrap:anywhere]">
          Мастер: {order.master_name || "назначается..."}
        </p>

        {order.master_rating !== null && order.master_rating !== undefined && (
          <p className="text-sm text-gray-700">
            Рейтинг: ⭐ {order.master_rating}
          </p>
        )}

        {order.price && (
          <p className="text-sm font-semibold text-black break-words [overflow-wrap:anywhere]">
            Сумма: {order.price}
          </p>
        )}
      </div>
    </button>
  );
}
