import {
  CalendarDays,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

function formatMoney(value) {
  const raw = String(value || "0").replace(/[^\d]/g, "");
  const amount = raw ? Number(raw) : 0;
  return amount ? `${amount.toLocaleString("ru-RU")} ₸` : "—";
}

function getStatusLabel(status) {
  if (status === "searching") return "Ищем мастера";
  if (status === "pending_user_confirmation") return "Ожидает выбора";
  return status || "—";
}

function PhotoStrip({ photos = [], onOpenPhoto }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {photos.map((photo) => {
        const url = `${API_BASE_URL}/${photo.file_path}`;

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenPhoto?.(url)}
            className="group relative h-28 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:w-[260px]"
          >
            <img
              src={url}
              alt="Фото заказа"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />

            <div className="absolute inset-0 hidden items-center justify-center bg-black/30 text-white group-hover:flex">
              <ImageIcon size={24} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function MasterAvailableOrdersSection({
  masterProfile,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  onOpenPhoto,
}) {
  const handleRefresh = async () => {
    if (!masterProfile?.id) return;
    await loadAvailableOrders(masterProfile.id);
  };

  const handleSkipOrder = (orderId) => {
    setAvailableOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  return (
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#151c23]">
            Доступные заказы
          </h2>

          <p className="mt-2 text-sm font-medium text-gray-500">
            Выбирайте подходящие заявки по вашему графику и категориям.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isAvailableLoading}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#5f9557] transition hover:bg-[#f7faf6] disabled:opacity-60"
        >
          <RefreshCw
            size={20}
            className={isAvailableLoading ? "animate-spin" : ""}
          />
          Обновить
        </button>
      </div>

      {isAvailableLoading ? (
        <div className="rounded-3xl border border-gray-200 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
          Загружаем доступные заказы...
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
          Сейчас нет подходящих заказов.
        </div>
      ) : (
        <div className="space-y-5">
          {availableOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-[#151c23]">
                    {order.service_name}
                  </h3>

                  <div className="mt-3 inline-flex rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-bold text-[#5f9557]">
                    {getStatusLabel(order.status)}
                  </div>

                  <p className="mt-4 text-base font-semibold text-gray-700">
                    {order.category}
                  </p>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">
                    {order.description || "Без описания"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d7ead6] bg-[#fbfdfb] px-5 py-4 lg:min-w-[240px]">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Цена пользователя
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[#151c23]">
                    {formatMoney(order.client_price || order.price)}
                  </div>
                </div>
              </div>

              <PhotoStrip photos={order.photos} onOpenPhoto={onOpenPhoto} />

              <div className="mt-5 grid gap-3 text-base font-semibold text-[#26312c]">
                <div className="flex items-center gap-3">
                  <MapPin size={22} className="text-[#5f9557]" />
                  <span>
                    <span className="font-bold">Адрес:</span>{" "}
                    {order.address || "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays size={22} className="text-[#5f9557]" />
                  <span>
                    <span className="font-bold">Дата:</span>{" "}
                    {order.scheduled_at || "—"}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleTakeOrder(order.id)}
                  className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5f9557]"
                >
                  <CheckCircle2 size={21} />
                  Согласиться
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const offeredPrice = window.prompt(
                      "Введите вашу цену в тенге",
                      order.client_price || order.price || "",
                    );

                    if (offeredPrice !== null) {
                      handleTakeOrder(order.id, offeredPrice);
                    }
                  }}
                  className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-[#f7faf6]"
                >
                  Предложить цену
                </button>

                <button
                  type="button"
                  onClick={() => handleSkipOrder(order.id)}
                  className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-gray-50"
                >
                  <XCircle size={21} className="text-[#5f9557]" />
                  Пропустить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}