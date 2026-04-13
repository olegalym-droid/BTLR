const DESCRIPTION_PREVIEW_LENGTH = 110;
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
      className="w-full rounded-3xl border border-gray-300 bg-white p-5 text-left shadow transition active:scale-[0.99]"
    >
      <div className="space-y-4 min-w-0">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-lg font-bold text-black break-words [overflow-wrap:anywhere]">
              {order.service_name}
            </h3>

            <p className="text-sm text-gray-700 break-words [overflow-wrap:anywhere]">
              {order.category}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
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
            <p className="text-sm text-gray-700">
              <span className="font-medium text-black">Фото:</span> {photosCount}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 space-y-2 min-w-0">
          <p className="text-sm font-medium text-black break-words [overflow-wrap:anywhere]">
            Мастер: {order.master_name || "ещё не назначен"}
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
      </div>
    </button>
  );
}