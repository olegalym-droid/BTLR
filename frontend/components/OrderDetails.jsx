import {
  ORDER_PROGRESS_STEPS,
  ORDER_STATUSES,
} from "../lib/orders";
import { API_BASE_URL } from "../lib/constants";
import useOrderDetailsActions from "../hooks/useOrderDetailsActions";

const REVIEW_COMMENT_MAX_LENGTH = 300;
const COMPLAINT_MAX_LENGTH = 1000;

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

  if (!selectedOrder) return null;

  const statusSteps = ORDER_PROGRESS_STEPS;

  const currentIndex = statusSteps.findIndex(
    (step) => step.key === selectedOrder.status,
  );

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-700 hover:text-black"
        >
          ← Назад
        </button>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold text-black sm:text-2xl lg:text-3xl [overflow-wrap:anywhere]">
                {selectedOrder.service_name}
              </h1>
              <p className="mt-1 break-words text-sm text-gray-600 sm:text-base [overflow-wrap:anywhere]">
                {selectedOrder.category}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-700 sm:text-base">Статус</p>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentIndex;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-xl px-2 py-2 text-center text-xs font-medium sm:text-sm ${
                        isActive
                          ? "bg-black text-white"
                          : "border border-gray-200 bg-white text-gray-500"
                      }`}
                    >
                      <span className="block truncate">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm font-medium text-black sm:text-base">
                {getStatusLabel(selectedOrder.status)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
              <div className="min-w-0 space-y-5">
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Описание
                  </h2>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <p className="break-words text-sm leading-6 text-gray-800 sm:text-base [overflow-wrap:anywhere]">
                      {selectedOrder.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Детали заказа
                  </h2>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 sm:text-sm">Адрес</p>
                      <p className="mt-1 break-words text-sm text-black sm:text-base [overflow-wrap:anywhere]">
                        {selectedOrder.address}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 sm:text-sm">Дата</p>
                      <p className="mt-1 break-words text-sm text-black sm:text-base [overflow-wrap:anywhere]">
                        {selectedOrder.scheduled_at}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Цена пользователя
                  </h2>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="break-words text-lg font-semibold text-black sm:text-xl [overflow-wrap:anywhere]">
                      {selectedOrder.client_price || "Не указана"}
                    </p>
                  </div>
                </div>

                {selectedOrder.photos?.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base font-semibold text-black sm:text-lg">
                        Фото заявки
                      </h2>
                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                        Нажмите на фото, чтобы открыть крупно
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedOrder.photos.map((photo) => {
                        const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setOpenedPhoto(photoUrl)}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                          >
                            <img
                              src={photoUrl}
                              alt="Фото заявки"
                              className="h-44 w-full object-cover sm:h-48"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedOrder.report_photos?.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base font-semibold text-black sm:text-lg">
                        Фото-отчёт мастера
                      </h2>
                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                        Фото выполненной работы от мастера
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedOrder.report_photos.map((photo) => {
                        const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setOpenedPhoto(photoUrl)}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                          >
                            <img
                              src={photoUrl}
                              alt="Фото-отчёт мастера"
                              className="h-44 w-full object-cover sm:h-48"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Мастер
                  </h2>

                  <div className="mt-3 space-y-2">
                    <p className="break-words text-sm text-black sm:text-base [overflow-wrap:anywhere]">
                      {selectedOrder.master_name || "Назначается..."}
                    </p>

                    {selectedOrder.master_rating !== null &&
                      selectedOrder.master_rating !== undefined && (
                        <p className="text-sm text-gray-700 sm:text-base">
                          Рейтинг: ⭐ {selectedOrder.master_rating}
                        </p>
                      )}

                    {selectedOrder.price && (
                      <p className="break-words text-base font-semibold text-black sm:text-lg [overflow-wrap:anywhere]">
                        Сумма: {selectedOrder.price}
                      </p>
                    )}
                  </div>
                </div>

                {selectedOrder.status ===
                  ORDER_STATUSES.PENDING_USER_CONFIRMATION &&
                  selectedOrder.offers?.length > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4">
                        <p className="text-sm text-gray-700 sm:text-base">
                          На вашу заявку откликнулись мастера. Выберите одного:
                        </p>
                      </div>

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
                              className="rounded-2xl border border-gray-200 bg-white p-4"
                            >
                              <div className="space-y-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt="Фото мастера"
                                      className="h-20 w-20 rounded-full border object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-gray-100 text-center text-xs text-gray-500">
                                      Нет фото
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <p className="break-words text-lg font-semibold text-black [overflow-wrap:anywhere]">
                                      {master?.full_name || "Без имени"}
                                    </p>

                                    {master?.about_me && (
                                      <p className="break-words text-sm text-gray-700 sm:text-base [overflow-wrap:anywhere]">
                                        {master.about_me}
                                      </p>
                                    )}

                                    {master?.experience_years !== null &&
                                      master?.experience_years !== undefined && (
                                        <p className="text-sm text-gray-700 sm:text-base">
                                          Стаж: {master.experience_years} лет
                                        </p>
                                      )}

                                    <p className="text-sm text-gray-700 sm:text-base">
                                      ⭐ Рейтинг: {master?.rating ?? 0}
                                    </p>

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                      <p className="text-xs text-gray-500">
                                        Цена мастера
                                      </p>
                                      <p className="mt-1 text-lg font-semibold text-black break-words [overflow-wrap:anywhere]">
                                        {offer.offered_price ||
                                          selectedOrder.client_price ||
                                          "Не указана"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmMaster(offer.id)}
                                    disabled={processingOfferId !== null}
                                    className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white disabled:opacity-60 sm:text-base"
                                  >
                                    {processingOfferId === offer.id
                                      ? "Выбор..."
                                      : "Выбрать"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRejectMaster(offer.id)}
                                    disabled={processingOfferId !== null}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black disabled:opacity-60 sm:text-base"
                                  >
                                    {processingOfferId === offer.id
                                      ? "Обработка..."
                                      : "Отклонить"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {canComplain && (
                  <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div>
                      <h2 className="text-base font-semibold text-black sm:text-lg">
                        Проблема с заказом
                      </h2>
                      <p className="mt-1 text-sm text-gray-700">
                        Если мастер не приехал, был грубым, повредил что-то или
                        выполнил работу некачественно — отправьте жалобу
                        администратору.
                      </p>
                    </div>

                    {!showComplaintForm ? (
                      <button
                        type="button"
                        onClick={() => setShowComplaintForm(true)}
                        className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-red-700 sm:text-base"
                      >
                        Проблема с заказом
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Опишите проблему: например, мастер не приехал, был грубым, сломал мебель, сделал некачественно и т.д."
                          value={complaintText}
                          onChange={handleComplaintChange}
                          maxLength={COMPLAINT_MAX_LENGTH}
                          className="min-h-[140px] w-full rounded-xl border border-red-200 p-4 text-sm text-black placeholder:text-gray-400 outline-none focus:border-red-400 sm:text-base"
                        />

                        <p className="text-right text-xs text-gray-500">
                          {complaintText.length}/{COMPLAINT_MAX_LENGTH}
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={handleSubmitComplaint}
                            disabled={isSubmittingComplaint}
                            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm text-white disabled:opacity-60 sm:text-base"
                          >
                            {isSubmittingComplaint
                              ? "Отправка..."
                              : "Отправить жалобу"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowComplaintForm(false);
                            }}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black sm:text-base"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}

                    {complaintSubmitted && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        Жалоба уже отправлена администратору по этому заказу в
                        рамках текущей сессии.
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.status === ORDER_STATUSES.COMPLETED && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                      <p className="text-sm text-gray-700 sm:text-base">
                        Работа завершена
                      </p>
                      <p className="mt-1 break-words text-xl font-semibold text-black [overflow-wrap:anywhere]">
                        Сумма: {selectedOrder.price || "Цена не указана"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-xl bg-black px-4 py-4 text-sm text-white disabled:opacity-60 sm:text-base"
                      onClick={handlePay}
                      disabled={isPaying}
                    >
                      {isPaying ? "Оплата..." : "Оплатить"}
                    </button>
                  </div>
                )}

                {showReviewForm && (
                  <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                    <div className="rounded-2xl bg-green-100 p-4 text-center">
                      <p className="text-lg font-semibold text-green-800">
                        Оплачено ✅
                      </p>
                    </div>

                    <div className="space-y-3 text-center">
                      <p className="text-sm font-medium text-black sm:text-base">
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
                                  ? "text-yellow-400"
                                  : "text-gray-300 hover:text-gray-500"
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
                        className="min-h-[120px] w-full rounded-xl border border-gray-300 p-4 text-sm text-black placeholder:text-gray-400 outline-none focus:border-black sm:text-base"
                      />

                      <p className="text-right text-xs text-gray-500">
                        {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-xl bg-black px-4 py-4 text-sm text-white disabled:opacity-60 sm:text-base"
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview
                        ? "Отправка..."
                        : "Отправить оценку"}
                    </button>
                  </div>
                )}

                {selectedOrder.status === ORDER_STATUSES.PAID && !showReviewForm && (
                  <div className="rounded-2xl bg-green-50 p-4 text-center">
                    <p className="text-lg font-semibold text-black">
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
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain sm:max-w-[90vw]"
          />
        </div>
      )}
    </>
  );
}