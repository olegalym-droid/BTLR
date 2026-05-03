import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Trash2,
  Truck,
  Upload,
  WalletCards,
} from "lucide-react";
import { getStatusLabel, ORDER_STATUSES } from "../../lib/orders";
import { API_BASE_URL } from "../../lib/constants";
import MasterOrderPhotos from "./MasterOrderPhotos";
import ChatModal from "../chat/ChatModal";

const ITEMS_PER_PAGE = 3;
const MAX_REPORT_PHOTOS = 8;

function formatMoney(value) {
  const raw = String(value || "0").replace(/[^\d]/g, "");
  const amount = raw ? Number(raw) : 0;
  return amount ? `${amount.toLocaleString("ru-RU")} ₸` : "—";
}

function StatusBadge({ status }) {
  return (
    <span className="inline-flex rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-bold text-[#5f9557]">
      {getStatusLabel(status)}
    </span>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-base font-semibold text-[#26312c]">
      <Icon size={22} className="mt-0.5 shrink-0 text-[#5f9557]" />
      <span className="break-words [overflow-wrap:anywhere]">
        <span className="font-bold text-[#151c23]">{label}:</span>{" "}
        {value || "—"}
      </span>
    </div>
  );
}

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [copiedPhonesByOrder, setCopiedPhonesByOrder] = useState({});
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [activeAdminChatOrder, setActiveAdminChatOrder] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const touchCapable =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const updateDeviceState = () => {
      setIsMobileDevice(mobileQuery.matches || touchCapable);
    };

    updateDeviceState();

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", updateDeviceState);
      return () => mobileQuery.removeEventListener("change", updateDeviceState);
    }

    mobileQuery.addListener(updateDeviceState);
    return () => mobileQuery.removeListener(updateDeviceState);
  }, []);

  const totalPages = Math.ceil(masterOrders.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedOrders = useMemo(
    () =>
      masterOrders.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE,
      ),
    [masterOrders, safeCurrentPage],
  );

  const activeChatStartRequest = useMemo(
    () => ({
      conversationType: "order",
      orderId: activeChatOrder?.id || null,
    }),
    [activeChatOrder?.id],
  );

  const activeAdminChatStartRequest = useMemo(
    () => ({
      conversationType: "admin",
    }),
    [],
  );

  const handleRefresh = async () => {
    if (!masterProfile?.id) return;
    await loadMasterOrders(masterProfile.id);
  };

  const handleReportFilesChange = (orderId, event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

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
    setReportPhotos((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleCopyPhone = async (orderId, phone) => {
    const normalizedPhone = String(phone || "").trim();

    if (!normalizedPhone) return;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(normalizedPhone);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = normalizedPhone;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedPhonesByOrder((prev) => ({
        ...prev,
        [orderId]: true,
      }));

      setTimeout(() => {
        setCopiedPhonesByOrder((prev) => ({
          ...prev,
          [orderId]: false,
        }));
      }, 2000);
    } catch (error) {
      console.error("Не удалось скопировать номер:", error);
      alert("Не удалось скопировать номер");
    }
  };

  const renderClientContactBlock = (order) => {
    const normalizedPhone = String(order.user_phone || "").trim();

    const hasClientPhone = Boolean(normalizedPhone);

    return (
      <div className="rounded-[28px] border border-gray-200 bg-gradient-to-br from-[#fbfdfb] to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
            <MessageCircle size={22} />
          </div>

          <div>
            <p className="text-base font-bold text-[#151c23]">
              Связь с клиентом
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Напишите клиенту или сохраните номер для связи.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveChatOrder(order)}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#151c23] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-black"
          >
            <MessageCircle size={20} />
            Написать клиенту
          </button>

          {hasClientPhone && isMobileDevice ? (
            <a
              href={`tel:${normalizedPhone}`}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-[#f7faf6]"
            >
              <Phone size={20} />
              Позвонить клиенту
            </a>
          ) : hasClientPhone ? (
            <button
              type="button"
              onClick={() => handleCopyPhone(order.id, normalizedPhone)}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#26312c] transition hover:bg-[#f7faf6]"
            >
              <Copy size={20} />
              {copiedPhonesByOrder[order.id]
                ? "Номер скопирован"
                : "Скопировать номер"}
            </button>
          ) : (
            <div className="flex min-h-[56px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-500">
              Телефон не указан
            </div>
          )}
        </div>

        {!isMobileDevice && hasClientPhone && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1f8f1] text-[#5f9557]">
              <Phone size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Телефон клиента
              </p>
              <p className="mt-1 break-words text-base font-bold text-[#151c23] [overflow-wrap:anywhere]">
                {normalizedPhone}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDisputeBlock = (order) => {
    const complaints = Array.isArray(order.complaints) ? order.complaints : [];

    if (complaints.length === 0) {
      return null;
    }

    const activeComplaint =
      complaints.find((item) =>
        ["new", "in_progress", "needs_details"].includes(item.status),
      ) || complaints[0];

    return (
      <div className="rounded-[28px] border border-orange-200 bg-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600">
            <AlertTriangle size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-base font-bold text-orange-900">
              Спор по заказу
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-orange-800 [overflow-wrap:anywhere]">
              {activeComplaint.reason_label || "Другое"} ·{" "}
              {activeComplaint.status_label || activeComplaint.status}
            </p>
            {activeComplaint.admin_comment ? (
              <p className="mt-2 break-words text-sm text-orange-900 [overflow-wrap:anywhere]">
                {activeComplaint.admin_comment}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveAdminChatOrder(order)}
          className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#151c23] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-black"
        >
          <MessageCircle size={20} />
          Чат с администратором
        </button>
      </div>
    );
  };

  const renderExistingReportPhotos = (order) => {
    if (!Array.isArray(order.report_photos) || order.report_photos.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-[#151c23]">
          Уже загруженные фото-отчёты
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {order.report_photos.map((photo) => {
            const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpenPhoto(photoUrl)}
                className="group relative h-28 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
              >
                <img
                  src={photoUrl}
                  alt="Фото-отчёт"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />

                <div className="absolute inset-0 hidden items-center justify-center bg-black/30 text-white group-hover:flex">
                  <ImageIcon size={24} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSelectedReportPhotos = (orderId) => {
    const isCurrentOrderTarget = reportTargetOrderId === orderId;

    if (!isCurrentOrderTarget || reportPhotos.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500">
          Выбрано: {reportPhotos.length}/{MAX_REPORT_PHOTOS}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {reportPhotos.map((photo, index) => {
            const previewUrl = URL.createObjectURL(photo);

            return (
              <div
                key={`${photo.name}-${index}`}
                className="space-y-2 rounded-2xl border border-gray-200 bg-white p-2"
              >
                <img
                  src={previewUrl}
                  alt={photo.name}
                  className="h-24 w-full rounded-xl object-cover"
                />

                <p className="break-all text-xs font-medium text-gray-700">
                  {photo.name}
                </p>

                <button
                  type="button"
                  onClick={() => removeReportPhoto(index)}
                  className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Удалить
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleUploadOrderReport(orderId)}
          disabled={isReportUploading}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5f9557] disabled:opacity-60"
        >
          <Camera size={20} />
          {isReportUploading && reportTargetOrderId === orderId
            ? "Загрузка..."
            : "Отправить фото-отчёт"}
        </button>
      </div>
    );
  };

  const renderReportPicker = (order) => {
    return (
      <>
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
            requestAnimationFrame(() => {
              fileInputRef.current?.click();
            });
          }}
          className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#151c23] transition hover:border-[#8ebf8c] hover:bg-[#f7faf6]"
        >
          <Upload size={20} className="text-[#5f9557]" />
          Выбрать фото отчёта
        </button>
      </>
    );
  };

  const renderReportUploader = (order) => {
    const hasExistingReport =
      Array.isArray(order.report_photos) && order.report_photos.length > 0;

    return (
      <div className="space-y-4 rounded-[28px] border border-gray-200 bg-gradient-to-br from-[#fbfdfb] to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
            <Camera size={22} />
          </div>

          <div>
            <p className="text-base font-bold text-[#151c23]">
              Фото-отчёт мастера
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Загрузите фото выполненной работы перед завершением заказа.
            </p>
          </div>
        </div>

        {renderReportPicker(order)}
        {renderSelectedReportPhotos(order.id)}
        {renderExistingReportPhotos(order)}

        {order.status === ORDER_STATUSES.ON_SITE && (
          <button
            type="button"
            onClick={() =>
              handleMasterStatusChange(order.id, ORDER_STATUSES.COMPLETED)
            }
            disabled={!hasExistingReport}
            className={`flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
              hasExistingReport
                ? "bg-[#6f9f72] text-white hover:bg-[#5f9557]"
                : "cursor-not-allowed bg-gray-200 text-gray-500"
            }`}
          >
            <CheckCircle2 size={20} />
            Завершить заказ
          </button>
        )}

        {order.status === ORDER_STATUSES.ON_SITE && !hasExistingReport && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            Чтобы завершить заказ, сначала загрузите хотя бы одно фото отчёта.
          </div>
        )}
      </div>
    );
  };

  const renderMasterOrderAction = (order) => {
    if (order.status === ORDER_STATUSES.ASSIGNED) {
      return (
        <button
          type="button"
          onClick={() =>
            handleMasterStatusChange(order.id, ORDER_STATUSES.ON_THE_WAY)
          }
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5f9557]"
        >
          <Truck size={20} />
          Выехал
        </button>
      );
    }

    if (order.status === ORDER_STATUSES.ON_THE_WAY) {
      return (
        <button
          type="button"
          onClick={() =>
            handleMasterStatusChange(order.id, ORDER_STATUSES.ON_SITE)
          }
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5f9557]"
        >
          <MapPin size={20} />
          На месте
        </button>
      );
    }

    if (order.status === ORDER_STATUSES.ON_SITE) {
      return renderReportUploader(order);
    }

    if (
      order.status === ORDER_STATUSES.COMPLETED ||
      order.status === ORDER_STATUSES.PAID
    ) {
      return (
        <div className="space-y-4">
          <div
            className={`flex min-h-[54px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
              order.status === ORDER_STATUSES.PAID
                ? "border-[#cfe6d2] bg-[#f1f8f1] text-[#407a45]"
                : "border-yellow-200 bg-yellow-50 text-yellow-800"
            }`}
          >
            {order.status === ORDER_STATUSES.PAID ? (
              <WalletCards size={20} />
            ) : (
              <Clock size={20} />
            )}

            {order.status === ORDER_STATUSES.PAID
              ? "Заказ оплачен"
              : "Ожидает оплату от пользователя"}
          </div>

          <div className="space-y-4 rounded-[28px] border border-gray-200 bg-gradient-to-br from-[#fbfdfb] to-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
                <Camera size={22} />
              </div>

              <div>
                <p className="text-base font-bold text-[#151c23]">
                  Фото-отчёт мастера
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Вы можете догрузить дополнительные фото выполненной работы.
                </p>
              </div>
            </div>

            {renderReportPicker(order)}
            {renderSelectedReportPhotos(order.id)}
            {renderExistingReportPhotos(order)}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#151c23]">
            {title}
          </h2>

          <p className="mt-2 text-sm font-medium text-gray-500">
            Управляйте статусами, связью с клиентом и фото-отчётами.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isMasterOrdersLoading}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#5f9557] transition hover:bg-[#f7faf6] disabled:opacity-60"
        >
          <RefreshCw
            size={20}
            className={isMasterOrdersLoading ? "animate-spin" : ""}
          />
          Обновить
        </button>
      </div>

      {isMasterOrdersLoading && (
        <div className="rounded-3xl border border-gray-200 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
          Загрузка заказов...
        </div>
      )}

      {!isMasterOrdersLoading && masterOrders.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-[#fbfdfb] p-6 text-sm font-semibold text-gray-600">
          {emptyText}
        </div>
      )}

      {!isMasterOrdersLoading && masterOrders.length > 0 && (
        <div className="space-y-5">
          {paginatedOrders.map((order) => (
            <article
              key={order.id}
              className="space-y-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0 space-y-3">
                <h3 className="break-words text-2xl font-bold leading-tight text-[#151c23] [overflow-wrap:anywhere]">
                  {order.service_name}
                </h3>

                <StatusBadge status={order.status} />

                <p className="break-words text-lg font-semibold text-gray-700 [overflow-wrap:anywhere]">
                  {order.category}
                </p>
              </div>

              <p className="break-words text-base leading-7 text-gray-600 [overflow-wrap:anywhere]">
                {order.description || "Без описания"}
              </p>

              <MasterOrderPhotos
                photos={order.photos}
                onOpenPhoto={onOpenPhoto}
              />

              <div className="grid gap-3">
                <InfoLine icon={MapPin} label="Адрес" value={order.address} />
                <InfoLine
                  icon={CalendarDays}
                  label="Дата"
                  value={order.scheduled_at}
                />
                <InfoLine
                  icon={WalletCards}
                  label="Цена"
                  value={formatMoney(order.price || order.client_price)}
                />
              </div>

              {renderClientContactBlock(order)}
              {renderDisputeBlock(order)}

              {renderMasterOrderAction(order)}
            </article>
          ))}

          {masterOrders.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-11 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      safeCurrentPage === page
                        ? "bg-[#6f9f72] text-white"
                        : "border border-gray-300 bg-white text-[#26312c] hover:bg-[#f7faf6]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <ChatModal
        isOpen={Boolean(activeChatOrder)}
        onClose={() => setActiveChatOrder(null)}
        viewerRole="master"
        accountId={masterProfile?.id}
        startRequest={activeChatStartRequest}
        title="Чат с клиентом"
      />
      <ChatModal
        isOpen={Boolean(activeAdminChatOrder)}
        onClose={() => setActiveAdminChatOrder(null)}
        viewerRole="master"
        accountId={masterProfile?.id}
        startRequest={activeAdminChatStartRequest}
        title="Чат с администратором"
      />
    </section>
    </>
  );
}
