import { useMemo, useRef, useState } from "react";
import { getStatusLabel } from "../../lib/orders";
import MasterOrderPhotos from "./MasterOrderPhotos";

const ITEMS_PER_PAGE = 3;
const MAX_REPORT_PHOTOS = 8;
const API_BASE_URL = "http://127.0.0.1:8000";

export default function MasterOrdersSection({
  title = "Мои заказы",
  emptyText = "У вас пока нет принятых заказов",
  masterProfile,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  reportPhotos,
  setReportPhotos,
  reportTargetOrderId,
  setReportTargetOrderId,
  handleUploadOrderReport,
  isReportUploading,
  onOpenPhoto,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);

  const totalPages = Math.ceil(masterOrders.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(
    () =>
      masterOrders.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE,
      ),
    [masterOrders, safeCurrentPage],
  );

  const handleReportFilesChange = (orderId, event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = selectedFiles.slice(0, MAX_REPORT_PHOTOS);

    setReportTargetOrderId(orderId);
    setReportPhotos(nextFiles);

    if (selectedFiles.length > MAX_REPORT_PHOTOS) {
      alert(`Можно выбрать не более ${MAX_REPORT_PHOTOS} фото отчёта`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeReportPhoto = (indexToRemove) => {
    setReportPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const renderExistingReportPhotos = (order) => {
    if (!Array.isArray(order.report_photos) || order.report_photos.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-black">
          Уже загруженные фото-отчёты
        </p>

        <div className="grid grid-cols-2 gap-2">
          {order.report_photos.map((photo) => {
            const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpenPhoto(photoUrl)}
                className="block"
              >
                <img
                  src={photoUrl}
                  alt="Фото-отчёт"
                  className="h-28 w-full rounded-xl border object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReportUploader = (order) => {
    const isCurrentOrderTarget = reportTargetOrderId === order.id;
    const hasExistingReport =
      Array.isArray(order.report_photos) && order.report_photos.length > 0;

    return (
      <div className="space-y-4 rounded-xl border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-black">Фото-отчёт мастера</p>
          <p className="mt-1 text-xs text-gray-500">
            Сначала загрузите фото выполненной работы, затем завершите заказ
          </p>
        </div>

        <input
          ref={isCurrentOrderTarget ? fileInputRef : null}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => handleReportFilesChange(order.id, event)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            setReportTargetOrderId(order.id);
            fileInputRef.current?.click();
          }}
          className="w-full rounded-xl border border-gray-300 py-3 text-black"
        >
          Выбрать фото отчёта
        </button>

        {isCurrentOrderTarget && reportPhotos.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Выбрано: {reportPhotos.length}/{MAX_REPORT_PHOTOS}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {reportPhotos.map((photo, index) => {
                const previewUrl = URL.createObjectURL(photo);

                return (
                  <div
                    key={`${photo.name}-${index}`}
                    className="space-y-2 rounded-xl border border-gray-200 p-2"
                  >
                    <img
                      src={previewUrl}
                      alt={photo.name}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <p className="break-all text-xs text-gray-700">
                      {photo.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeReportPhoto(index)}
                      className="w-full rounded-lg border border-red-300 py-2 text-xs text-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleUploadOrderReport(order.id)}
              disabled={isReportUploading}
              className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
            >
              {isReportUploading && isCurrentOrderTarget
                ? "Загрузка..."
                : "Отправить фото-отчёт"}
            </button>
          </div>
        )}

        {renderExistingReportPhotos(order)}

        {order.status === "on_site" && (
          <button
            type="button"
            onClick={() => handleMasterStatusChange(order.id, "completed")}
            disabled={!hasExistingReport}
            className="w-full rounded-xl bg-black py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Завершить
          </button>
        )}

        {order.status === "on_site" && !hasExistingReport && (
          <p className="text-xs text-red-600">
            Чтобы завершить заказ, сначала загрузите хотя бы одно фото отчёта
          </p>
        )}
      </div>
    );
  };

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
      return renderReportUploader(order);
    }

    if (order.status === "completed" || order.status === "paid") {
      return (
        <div className="space-y-4">
          <div
            className={`rounded-xl p-3 text-sm ${
              order.status === "paid"
                ? "border border-green-300 bg-green-50 text-green-800"
                : "border border-yellow-300 bg-yellow-50 text-yellow-900"
            }`}
          >
            {order.status === "paid"
              ? "Заказ оплачен"
              : "Ожидает оплату от пользователя"}
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-black">Фото-отчёт мастера</p>
              <p className="mt-1 text-xs text-gray-500">
                Вы можете догрузить дополнительные фото выполненной работы
              </p>
            </div>

            <input
              ref={reportTargetOrderId === order.id ? fileInputRef : null}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleReportFilesChange(order.id, event)}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                setReportTargetOrderId(order.id);
                fileInputRef.current?.click();
              }}
              className="w-full rounded-xl border border-gray-300 py-3 text-black"
            >
              Выбрать фото отчёта
            </button>

            {reportTargetOrderId === order.id && reportPhotos.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Выбрано: {reportPhotos.length}/{MAX_REPORT_PHOTOS}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {reportPhotos.map((photo, index) => {
                    const previewUrl = URL.createObjectURL(photo);

                    return (
                      <div
                        key={`${photo.name}-${index}`}
                        className="space-y-2 rounded-xl border border-gray-200 p-2"
                      >
                        <img
                          src={previewUrl}
                          alt={photo.name}
                          className="h-24 w-full rounded-lg object-cover"
                        />
                        <p className="break-all text-xs text-gray-700">
                          {photo.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeReportPhoto(index)}
                          className="w-full rounded-lg border border-red-300 py-2 text-xs text-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleUploadOrderReport(order.id)}
                  disabled={isReportUploading}
                  className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
                >
                  {isReportUploading && reportTargetOrderId === order.id
                    ? "Загрузка..."
                    : "Отправить фото-отчёт"}
                </button>
              </div>
            )}

            {renderExistingReportPhotos(order)}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-black">{title}</h2>

        <button
          type="button"
          onClick={() =>
            masterProfile?.id && loadMasterOrders(masterProfile.id)
          }
          className="rounded-xl border border-black px-4 py-2 text-sm font-medium text-black bg-white"
        >
          Обновить
        </button>
      </div>

      {isMasterOrdersLoading && (
        <p className="text-sm text-black">Загрузка заказов...</p>
      )}

      {!isMasterOrdersLoading && masterOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-400 p-4 text-sm text-gray-700">
          {emptyText}
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
              <span className="font-semibold text-black">📍 Адрес:</span>{" "}
              {order.address}
            </p>

            <p className="text-lg text-gray-900">
              <span className="font-semibold text-black">📅 Дата:</span>{" "}
              {order.scheduled_at}
            </p>

            {order.price && (
              <p className="text-xl font-semibold text-black">
                💰 {order.price}
              </p>
            )}

            {renderMasterOrderAction(order)}
          </div>
        ))}
      </div>

      {masterOrders.length > ITEMS_PER_PAGE && (
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