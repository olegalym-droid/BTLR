import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  formatPublicOrderCode,
  getStatusLabel as getOrderStatusLabel,
} from "../../lib/orders";
import { API_BASE_URL } from "../../lib/constants";

function formatMoney(value) {
  const raw = String(value || "0").replace(/[^\d]/g, "");
  const amount = raw ? Number(raw) : 0;
  return amount ? `${amount.toLocaleString("ru-RU")} ₸` : "Не указана";
}

function formatPriceInput(value) {
  const raw = String(value || "").replace(/[^\d]/g, "").slice(0, 8);
  const amount = raw ? Number(raw) : 0;
  return amount ? amount.toLocaleString("ru-RU") : "";
}

function getPhotoCount(photos) {
  return Array.isArray(photos) ? photos.length : 0;
}

function PhotoStrip({ photos = [], onOpenPhoto }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-[#fbfcfb] p-4 text-sm font-semibold text-gray-500">
        Клиент не добавил фото.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => {
        const url = `${API_BASE_URL}/${photo.file_path}`;

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenPhoto?.(url)}
            className="group relative h-28 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
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

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ea] text-[#5f9557]">
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[#26312c] [overflow-wrap:anywhere]">
            {value || "Не указано"}
          </p>
        </div>
      </div>
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
  const [offerPrices, setOfferPrices] = useState({});

  const handleRefresh = async () => {
    if (!masterProfile?.id) return;
    await loadAvailableOrders(masterProfile.id);
  };

  const handleSkipOrder = (orderId) => {
    setAvailableOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const handleOfferPriceChange = (orderId, value) => {
    setOfferPrices((prev) => ({
      ...prev,
      [orderId]: formatPriceInput(value),
    }));
  };

  const handleSubmitCustomPrice = (order) => {
    const offeredPrice = offerPrices[order.id] || "";

    if (!offeredPrice) {
      alert("Укажите вашу цену");
      return;
    }

    handleTakeOrder(order.id, offeredPrice);
  };

  return (
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#151c23]">
            Доступные заказы
          </h2>

          <p className="mt-2 text-sm font-medium text-gray-500">
            Выбирайте заявки по категории, цене, адресу и времени.
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
          {availableOrders.map((order) => {
            const photoCount = getPhotoCount(order.photos);
            const basePrice = order.client_price || order.price || "";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 bg-[#fbfdfb] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#dbe9d7] bg-white px-3 py-1.5 text-xs font-bold text-[#5f9557]">
                          {formatPublicOrderCode(order.id)}
                        </span>
                        <span className="rounded-full bg-[#eef6ea] px-3 py-1.5 text-xs font-bold text-[#5f9557]">
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600">
                          {order.category}
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-2xl font-bold leading-tight text-[#151c23] [overflow-wrap:anywhere]">
                        {order.service_name}
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-[#d7ead6] bg-white px-5 py-4 lg:min-w-[230px]">
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Цена клиента
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[#151c23]">
                        {formatMoney(basePrice)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="rounded-2xl border border-gray-200 bg-[#fbfcfb] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#151c23]">
                      <FileText size={18} className="text-[#5f9557]" />
                      Описание
                    </div>
                    <p className="break-words text-base leading-7 text-gray-600 [overflow-wrap:anywhere]">
                      {order.description || "Без описания"}
                    </p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <InfoTile
                      icon={MapPin}
                      label="Адрес"
                      value={order.address}
                    />
                    <InfoTile
                      icon={CalendarDays}
                      label="Дата и время"
                      value={order.scheduled_at}
                    />
                    <InfoTile
                      icon={ImageIcon}
                      label="Фото"
                      value={
                        photoCount > 0
                          ? `${photoCount} фото от клиента`
                          : "Фото нет"
                      }
                    />
                  </div>

                  <PhotoStrip photos={order.photos} onOpenPhoto={onOpenPhoto} />

                  <div className="grid gap-4 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#25302c]">
                        Ваша цена, если отличается
                      </span>
                      <input
                        value={offerPrices[order.id] || ""}
                        onChange={(event) =>
                          handleOfferPriceChange(order.id, event.target.value)
                        }
                        placeholder={formatMoney(basePrice)}
                        inputMode="numeric"
                        className="min-h-[54px] w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                      <button
                        type="button"
                        onClick={() => handleTakeOrder(order.id)}
                        className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5f9557]"
                      >
                        <CheckCircle2 size={20} />
                        Согласиться
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubmitCustomPrice(order)}
                        className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-[#f7faf6]"
                      >
                        <WalletCards size={20} className="text-[#5f9557]" />
                        Предложить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSkipOrder(order.id)}
                        className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-gray-50"
                      >
                        <XCircle size={20} className="text-[#5f9557]" />
                        Пропустить
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
