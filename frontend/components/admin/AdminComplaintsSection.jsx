import { useState } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { loadAdminOrderRequest } from "../../lib/admin";

const STATUS_LABELS = {
  new: "Новая",
  in_progress: "В работе",
  resolved: "Решена",
  rejected: "Отклонена",
};

const ORDER_STATUS_LABELS = {
  searching: "Ищем мастера",
  pending_user_confirmation: "Ожидает выбора",
  assigned: "Мастер назначен",
  on_the_way: "Мастер едет",
  on_site: "Мастер на месте",
  completed: "Работа завершена",
  paid: "Оплачено",
};

function AdminOrderPhotos({ photos = [] }) {
  if (!photos.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black">Фото заявки</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo) => {
          const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

          return (
            <img
              key={photo.id}
              src={photoUrl}
              alt="Фото заявки"
              className="h-28 w-full rounded-xl border object-cover"
            />
          );
        })}
      </div>
    </div>
  );
}

function AdminReportPhotos({ photos = [] }) {
  if (!photos.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black">Фото-отчёт мастера</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo) => {
          const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

          return (
            <img
              key={photo.id}
              src={photoUrl}
              alt="Фото-отчёт"
              className="h-28 w-full rounded-xl border object-cover"
            />
          );
        })}
      </div>
    </div>
  );
}

export default function AdminComplaintsSection({
  complaints,
  isLoading,
  updateComplaintStatus,
}) {
  const [openedOrderId, setOpenedOrderId] = useState(null);
  const [openedOrder, setOpenedOrder] = useState(null);
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  const openOrder = async (orderId) => {
    try {
      if (openedOrderId === orderId) {
        setOpenedOrderId(null);
        setOpenedOrder(null);
        return;
      }

      setIsOrderLoading(true);

      const data = await loadAdminOrderRequest(orderId);

      setOpenedOrderId(orderId);
      setOpenedOrder(data);
    } catch (error) {
      alert(error.message || "Не удалось загрузить заказ");
    } finally {
      setIsOrderLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
      <h2 className="text-2xl font-bold text-black">Жалобы по заказам</h2>

      {complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-400 p-4 text-sm text-gray-700">
          Сейчас жалоб нет
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => {
            const order = complaint.order;
            const orderStatusLabel = order?.status
              ? ORDER_STATUS_LABELS[order.status] || order.status
              : "Неизвестно";

            const isOpened = openedOrderId === complaint.order_id;

            return (
              <div
                key={complaint.id}
                className="rounded-2xl border border-gray-300 p-4 space-y-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-black">
                      Жалоба #{complaint.id}
                    </p>

                    <p className="text-sm text-gray-700">
                      Пользователь: {complaint.user_name || `#${complaint.user_id}`}
                    </p>

                    <p className="text-sm text-gray-700">
                      Заказ: #{complaint.order_id}
                    </p>
                  </div>

                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                    {STATUS_LABELS[complaint.status] || complaint.status}
                  </span>
                </div>

                {order && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Услуга</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {order.service_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Категория</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {order.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Статус заказа</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {orderStatusLabel}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Мастер</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {order.master_name || "Ещё не назначен"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Цена пользователя</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {order.client_price || "Не указана"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Итоговая цена</p>
                      <p className="mt-1 text-sm font-medium text-black break-words">
                        {order.price || "Пока не определена"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Текст жалобы</p>
                  <p className="mt-2 text-sm leading-6 text-gray-800 whitespace-pre-wrap break-words">
                    {complaint.text}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => openOrder(complaint.order_id)}
                    disabled={isOrderLoading}
                    className="rounded-xl border border-black px-3 py-3 text-sm text-black disabled:opacity-60"
                  >
                    {isOpened ? "Скрыть заказ" : "Открыть заказ"}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateComplaintStatus(complaint.id, "new")}
                    disabled={isLoading}
                    className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-black disabled:opacity-60"
                  >
                    Новая
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateComplaintStatus(complaint.id, "in_progress")
                    }
                    disabled={isLoading}
                    className="rounded-xl border border-yellow-300 px-3 py-3 text-sm text-yellow-800 disabled:opacity-60"
                  >
                    В работу
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateComplaintStatus(complaint.id, "resolved")
                    }
                    disabled={isLoading}
                    className="rounded-xl border border-green-300 px-3 py-3 text-sm text-green-800 disabled:opacity-60"
                  >
                    Решена
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateComplaintStatus(complaint.id, "rejected")
                    }
                    disabled={isLoading}
                    className="rounded-xl border border-red-300 px-3 py-3 text-sm text-red-700 disabled:opacity-60"
                  >
                    Отклонить
                  </button>
                </div>

                {isOpened && openedOrder && (
                  <div className="rounded-2xl border border-black bg-white p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-black">
                        Полный заказ #{openedOrder.id}
                      </p>
                      <p className="text-sm text-gray-700">
                        {openedOrder.service_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Категория</p>
                        <p className="mt-1 text-sm text-black">
                          {openedOrder.category}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Статус</p>
                        <p className="mt-1 text-sm text-black">
                          {ORDER_STATUS_LABELS[openedOrder.status] || openedOrder.status}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Адрес</p>
                        <p className="mt-1 text-sm text-black break-words">
                          {openedOrder.address}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Дата</p>
                        <p className="mt-1 text-sm text-black break-words">
                          {openedOrder.scheduled_at}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Цена пользователя</p>
                        <p className="mt-1 text-sm text-black">
                          {openedOrder.client_price || "Не указана"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Итоговая цена</p>
                        <p className="mt-1 text-sm text-black">
                          {openedOrder.price || "Пока не определена"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Мастер</p>
                        <p className="mt-1 text-sm text-black break-words">
                          {openedOrder.master_name || "Ещё не назначен"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Рейтинг мастера</p>
                        <p className="mt-1 text-sm text-black">
                          {openedOrder.master_rating ?? "Нет данных"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Описание</p>
                      <p className="mt-1 text-sm leading-6 text-black whitespace-pre-wrap break-words">
                        {openedOrder.description}
                      </p>
                    </div>

                    <AdminOrderPhotos photos={openedOrder.photos || []} />
                    <AdminReportPhotos photos={openedOrder.report_photos || []} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}