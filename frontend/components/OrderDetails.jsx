"use client";

import { useEffect, useState } from "react";
import {
  ORDER_PROGRESS_STEPS,
  ORDER_STATUSES,
  formatPublicOrderCode,
} from "../lib/orders";
import { API_BASE_URL } from "../lib/constants";
import useOrderDetailsActions from "../hooks/useOrderDetailsActions";

const REVIEW_COMMENT_MAX_LENGTH = 300;
const COMPLAINT_MAX_LENGTH = 1000;

function SectionCard({ title, subtitle = "", children, className = "" }) {
  return (
    <div className={`rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#25302c]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function InfoTile({ label, value, valueClassName = "" }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#fbfcfb] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-2 break-words text-sm text-[#25302c] sm:text-base [overflow-wrap:anywhere] ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
}) {
  const styles =
    variant === "primary"
      ? "bg-[#7fb276] text-white hover:bg-[#6fa565]"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-700"
        : variant === "soft-danger"
          ? "border border-red-300 bg-white text-red-700 hover:bg-red-50"
          : "border border-gray-200 bg-white text-[#25302c] hover:bg-gray-50";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${styles}`}
    >
      {children}
    </button>
  );
}

export default function OrderDetails({
  selectedOrder,
  getStatusLabel,
  onBack,
  onStatusChange,
}) {
  const {
    rating,
    setRating,
    comment,
    submitted,
    isPaying,
    processingOfferId,
    openedPhoto,
    setOpenedPhoto,
    isSubmittingReview,
    showComplaintForm,
    setShowComplaintForm,
    complaintText,
    isSubmittingComplaint,
    complaintSubmitted,
    handlePay,
    handleConfirmMaster,
    handleRejectMaster,
    handleCommentChange,
    handleComplaintChange,
    handleSubmitReview,
    handleSubmitComplaint,
    showReviewForm,
    canComplain,
  } = useOrderDetailsActions({
    selectedOrder,
    onStatusChange,
  });

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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

  useEffect(() => {
    setCopiedPhone(false);
  }, [selectedOrder?.id]);

  if (!selectedOrder) return null;

  const statusSteps = ORDER_PROGRESS_STEPS;
  const currentIndex = statusSteps.findIndex(
    (step) => step.key === selectedOrder.status,
  );

  const canContactMaster =
    Boolean(selectedOrder.master_id) &&
    Boolean(selectedOrder.master_phone) &&
    selectedOrder.status !== ORDER_STATUSES.SEARCHING &&
    selectedOrder.status !== ORDER_STATUSES.PENDING_USER_CONFIRMATION;

  const normalizedPhone = String(selectedOrder.master_phone || "").trim();
  const whatsappPhone = normalizedPhone.replace(/[^\d]/g, "");
  const whatsappUrl =
    whatsappPhone.length >= 10 ? `https://wa.me/${whatsappPhone}` : null;
  const messageLinkHref = whatsappUrl || `tel:${normalizedPhone}`;
  const messageLinkLabel = whatsappUrl
    ? "Написать мастеру"
    : "Связаться с мастером";

  const handleCopyPhone = async () => {
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

      setCopiedPhone(true);

      setTimeout(() => {
        setCopiedPhone(false);
      }, 2000);
    } catch (error) {
      console.error("Не удалось скопировать номер:", error);
      alert("Не удалось скопировать номер");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#25302c]"
        >
          ← Назад к заказам
        </button>

        <div className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-[#dbe9d7] bg-[#f8fcf7] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#5e8d58]">
                {formatPublicOrderCode(selectedOrder.id)}
              </div>

              <div className="space-y-2">
                <h1 className="break-words text-2xl font-bold text-[#25302c] sm:text-3xl [overflow-wrap:anywhere]">
                  {selectedOrder.service_name}
                </h1>
                <p className="break-words text-sm text-gray-500 sm:text-base [overflow-wrap:anywhere]">
                  {selectedOrder.category}
                </p>
              </div>
            </div>

            <SectionCard
              title="Статус заказа"
              subtitle="Следите за этапом выполнения заявки"
              className="bg-[#fcfdfc]"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {statusSteps.map((step, index) => {
                    const isActive = index <= currentIndex;

                    return (
                      <div
                        key={step.key}
                        className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold sm:text-sm ${
                          isActive
                            ? "border-[#9bc89a] bg-[#e6f3e2] text-[#4f7d4f]"
                            : "border-gray-200 bg-white text-gray-400"
                        }`}
                      >
                        <span className="block truncate">{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="inline-flex rounded-full bg-[#eef6ea] px-4 py-2 text-sm font-semibold text-[#5e8d58]">
                  {getStatusLabel(selectedOrder.status)}
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <div className="min-w-0 space-y-6">
                <SectionCard title="Описание">
                  <p className="break-words text-sm leading-7 text-gray-700 sm:text-base [overflow-wrap:anywhere]">
                    {selectedOrder.description}
                  </p>
                </SectionCard>

                <SectionCard title="Детали заказа">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoTile
                      label="Адрес"
                      value={selectedOrder.address}
                    />

                    <InfoTile
                      label="Дата"
                      value={selectedOrder.scheduled_at}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Цена пользователя">
                  <div className="rounded-3xl border border-[#dbe9d7] bg-[#f8fcf7] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Стоимость
                    </p>
                    <p className="mt-2 break-words text-xl font-bold text-[#25302c] sm:text-2xl [overflow-wrap:anywhere]">
                      {selectedOrder.client_price || "Не указана"}
                    </p>
                  </div>
                </SectionCard>

                {selectedOrder.photos?.length > 0 && (
                  <SectionCard
                    title="Фото заявки"
                    subtitle="Нажмите на фото, чтобы открыть крупно"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedOrder.photos.map((photo) => {
                        const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setOpenedPhoto(photoUrl)}
                            className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                          >
                            <img
                              src={photoUrl}
                              alt="Фото заявки"
                              className="h-44 w-full rounded-[22px] object-cover sm:h-48"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {selectedOrder.report_photos?.length > 0 && (
                  <SectionCard
                    title="Фото-отчёт мастера"
                    subtitle="Фото выполненной работы от мастера"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedOrder.report_photos.map((photo) => {
                        const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setOpenedPhoto(photoUrl)}
                            className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                          >
                            <img
                              src={photoUrl}
                              alt="Фото-отчёт мастера"
                              className="h-44 w-full rounded-[22px] object-cover sm:h-48"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}
              </div>

              <div className="min-w-0 space-y-6">
                <SectionCard title="Мастер" className="bg-[#fcfdfc]">
                  <div className="space-y-3">
                    <p className="break-words text-base font-semibold text-[#25302c] sm:text-lg [overflow-wrap:anywhere]">
                      {selectedOrder.master_name || "Назначается..."}
                    </p>

                    {selectedOrder.master_rating !== null &&
                      selectedOrder.master_rating !== undefined && (
                        <p className="text-sm text-gray-600 sm:text-base">
                          ⭐ Рейтинг: {selectedOrder.master_rating}
                        </p>
                      )}

                    {selectedOrder.price && (
                      <div className="rounded-3xl border border-[#dbe9d7] bg-[#f8fcf7] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Итоговая сумма
                        </p>
                        <p className="mt-2 break-words text-xl font-bold text-[#25302c] [overflow-wrap:anywhere]">
                          {selectedOrder.price}
                        </p>
                      </div>
                    )}

                    {canContactMaster && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <a
                            href={messageLinkHref}
                            target={whatsappUrl ? "_blank" : undefined}
                            rel={whatsappUrl ? "noreferrer" : undefined}
                            className="flex w-full items-center justify-center rounded-2xl bg-[#7fb276] px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#6ea765] sm:text-base"
                          >
                            {messageLinkLabel}
                          </a>

                          {isMobileDevice ? (
                            <a
                              href={`tel:${normalizedPhone}`}
                              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-[#25302c] transition hover:bg-gray-50 sm:text-base"
                            >
                              Позвонить мастеру
                            </a>
                          ) : (
                            <ActionButton
                              onClick={handleCopyPhone}
                              variant="secondary"
                            >
                              {copiedPhone ? "Номер скопирован" : "Скопировать номер"}
                            </ActionButton>
                          )}
                        </div>

                        {!isMobileDevice && (
                          <div className="rounded-3xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Телефон мастера
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
                              {normalizedPhone}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SectionCard>

                {selectedOrder.status ===
                  ORDER_STATUSES.PENDING_USER_CONFIRMATION &&
                  selectedOrder.offers?.length > 0 && (
                    <SectionCard
                      title="Отклики мастеров"
                      subtitle="Выберите мастера для выполнения заказа"
                    >
                      <div className="space-y-4">
                        {selectedOrder.offers.map((offer) => {
                          const master = offer.master;
                          const photoPath =
                            master?.avatar_path || master?.selfie_photo_path || null;
                          const photoUrl = photoPath
                            ? `${API_BASE_URL}/${photoPath}`
                            : null;

                          return (
                            <div
                              key={offer.id}
                              className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4 shadow-sm"
                            >
                              <div className="space-y-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt="Фото мастера"
                                      className="h-20 w-20 rounded-full border border-gray-200 object-cover shadow-sm"
                                    />
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-center text-xs text-gray-500">
                                      Нет фото
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <p className="break-words text-lg font-semibold text-[#25302c] [overflow-wrap:anywhere]">
                                      {master?.full_name || "Без имени"}
                                    </p>

                                    {master?.about_me && (
                                      <p className="break-words text-sm text-gray-600 sm:text-base [overflow-wrap:anywhere]">
                                        {master.about_me}
                                      </p>
                                    )}

                                    {master?.experience_years !== null &&
                                      master?.experience_years !== undefined && (
                                        <p className="text-sm text-gray-600 sm:text-base">
                                          Стаж: {master.experience_years} лет
                                        </p>
                                      )}

                                    <p className="text-sm text-gray-600 sm:text-base">
                                      ⭐ Рейтинг: {master?.rating ?? 0}
                                    </p>

                                    <div className="rounded-3xl border border-[#dbe9d7] bg-[#f8fcf7] p-4">
                                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Цена мастера
                                      </p>
                                      <p className="mt-2 break-words text-xl font-bold text-[#25302c] [overflow-wrap:anywhere]">
                                        {offer.offered_price ||
                                          selectedOrder.client_price ||
                                          "Не указана"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <ActionButton
                                    onClick={() => handleConfirmMaster(offer.id)}
                                    disabled={processingOfferId !== null}
                                    variant="primary"
                                  >
                                    {processingOfferId === offer.id
                                      ? "Выбор..."
                                      : "Выбрать"}
                                  </ActionButton>

                                  <ActionButton
                                    onClick={() => handleRejectMaster(offer.id)}
                                    disabled={processingOfferId !== null}
                                    variant="secondary"
                                  >
                                    {processingOfferId === offer.id
                                      ? "Обработка..."
                                      : "Отклонить"}
                                  </ActionButton>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  )}

                {canComplain && (
                  <SectionCard
                    title="Проблема с заказом"
                    subtitle="Если возникла проблема, отправьте жалобу администратору"
                    className="border-red-200 bg-red-50/60"
                  >
                    <div className="space-y-4">
                      {!showComplaintForm ? (
                        <ActionButton
                          onClick={() => setShowComplaintForm(true)}
                          variant="soft-danger"
                        >
                          Проблема с заказом
                        </ActionButton>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            placeholder="Опишите проблему: например, мастер не приехал, был грубым, сломал мебель, сделал некачественно и т.д."
                            value={complaintText}
                            onChange={handleComplaintChange}
                            maxLength={COMPLAINT_MAX_LENGTH}
                            className="min-h-[140px] w-full rounded-3xl border border-red-200 bg-white p-4 text-sm text-[#25302c] placeholder:text-gray-400 outline-none transition focus:border-red-400 sm:text-base"
                          />

                          <p className="text-right text-xs text-gray-500">
                            {complaintText.length}/{COMPLAINT_MAX_LENGTH}
                          </p>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ActionButton
                              onClick={handleSubmitComplaint}
                              disabled={isSubmittingComplaint}
                              variant="danger"
                            >
                              {isSubmittingComplaint
                                ? "Отправка..."
                                : "Отправить жалобу"}
                            </ActionButton>

                            <ActionButton
                              onClick={() => {
                                setShowComplaintForm(false);
                              }}
                              variant="secondary"
                            >
                              Отмена
                            </ActionButton>
                          </div>
                        </div>
                      )}

                      {complaintSubmitted && (
                        <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                          Жалоба уже отправлена администратору по этому заказу в рамках текущей сессии.
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {selectedOrder.status === ORDER_STATUSES.COMPLETED && (
                  <SectionCard
                    title="Оплата"
                    subtitle="Работа завершена, можно перейти к оплате"
                    className="bg-[#fcfdfc]"
                  >
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-gray-600">Сумма к оплате</p>
                        <p className="mt-2 break-words text-2xl font-bold text-[#25302c] [overflow-wrap:anywhere]">
                          {selectedOrder.price || "Цена не указана"}
                        </p>
                      </div>

                      <ActionButton
                        onClick={handlePay}
                        disabled={isPaying}
                        variant="primary"
                      >
                        {isPaying ? "Оплата..." : "Оплатить"}
                      </ActionButton>
                    </div>
                  </SectionCard>
                )}

                {showReviewForm && (
                  <SectionCard
                    title="Оценка мастера"
                    subtitle="Поделитесь впечатлением после оплаты"
                  >
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-center">
                        <p className="text-lg font-semibold text-green-800">
                          Оплачено ✅
                        </p>
                      </div>

                      <div className="space-y-3 text-center">
                        <p className="text-sm font-medium text-[#25302c] sm:text-base">
                          Оцените мастера
                        </p>

                        <div className="flex justify-center gap-2 text-3xl sm:text-4xl">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isActive = star <= rating;

                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={
                                  isActive
                                    ? "text-yellow-400 transition"
                                    : "text-gray-300 transition hover:text-gray-400"
                                }
                              >
                                ★
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          placeholder="Комментарий (необязательно)"
                          value={comment}
                          onChange={handleCommentChange}
                          maxLength={REVIEW_COMMENT_MAX_LENGTH}
                          className="min-h-[120px] w-full rounded-3xl border border-gray-200 bg-white p-4 text-sm text-[#25302c] placeholder:text-gray-400 outline-none transition focus:border-[#9bc89a] sm:text-base"
                        />

                        <p className="text-right text-xs text-gray-500">
                          {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
                        </p>
                      </div>

                      <ActionButton
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        variant="primary"
                      >
                        {isSubmittingReview
                          ? "Отправка..."
                          : "Отправить оценку"}
                      </ActionButton>
                    </div>
                  </SectionCard>
                )}

                {selectedOrder.status === ORDER_STATUSES.PAID && !showReviewForm && (
                  <div className="rounded-[28px] border border-green-200 bg-green-50 p-5 text-center shadow-sm">
                    <p className="text-lg font-semibold text-[#25302c]">
                      Спасибо за отзыв 🙌
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[95vw] rounded-[28px] object-contain sm:max-w-[90vw]"
          />
        </div>
      )}
    </>
  );
}