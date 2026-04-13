import { useEffect, useState } from "react";
import { updateOrderStatusRequest, createReviewRequest } from "../lib/orders";

const API_BASE_URL = "http://127.0.0.1:8000";
const REVIEW_COMMENT_MAX_LENGTH = 300;

export default function OrderDetails({
  selectedOrder,
  getStatusLabel,
  onBack,
  onStatusChange,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState(null);
  const [openedPhoto, setOpenedPhoto] = useState(null);

  useEffect(() => {
    setSubmitted(false);
    setRating(0);
    setComment("");
  }, [selectedOrder?.id]);

  if (!selectedOrder) return null;

  const statusSteps = [
    { key: "searching", label: "Поиск" },
    { key: "pending_user_confirmation", label: "Выбор" },
    { key: "assigned", label: "Назначен" },
    { key: "on_the_way", label: "Едет" },
    { key: "on_site", label: "На месте" },
    { key: "completed", label: "Готово" },
    { key: "paid", label: "Оплачено" },
  ];

  const currentIndex = statusSteps.findIndex(
    (step) => step.key === selectedOrder.status,
  );

  const getCurrentUserId = () => {
    try {
      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

      if (!authUser?.id) {
        throw new Error("Пользователь не авторизован");
      }

      return authUser.id;
    } catch (error) {
      throw new Error("Не удалось определить пользователя");
    }
  };

  const handlePay = async () => {
    try {
      setIsPaying(true);

      const updatedOrder = await updateOrderStatusRequest({
        orderId: selectedOrder.id,
        status: "paid",
      });

      onStatusChange(updatedOrder);
    } catch (error) {
      console.error("Ошибка оплаты:", error);
      alert(error.message || "Не удалось обновить оплату");
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmMaster = async (offerId) => {
    try {
      setProcessingOfferId(offerId);

      const userId = getCurrentUserId();

      const response = await fetch(
        `${API_BASE_URL}/orders/${selectedOrder.id}/confirm-master?user_id=${userId}&offer_id=${offerId}`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось выбрать мастера");
      }

      onStatusChange(data);
    } catch (error) {
      console.error("Ошибка подтверждения мастера:", error);
      alert(error.message || "Не удалось выбрать мастера");
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleRejectMaster = async (offerId) => {
    try {
      setProcessingOfferId(offerId);

      const userId = getCurrentUserId();

      const response = await fetch(
        `${API_BASE_URL}/orders/${selectedOrder.id}/reject-master?user_id=${userId}&offer_id=${offerId}`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось отклонить мастера");
      }

      onStatusChange(data);
    } catch (error) {
      console.error("Ошибка отклонения мастера:", error);
      alert(error.message || "Не удалось отклонить мастера");
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleCommentChange = (event) => {
    setComment(event.target.value.slice(0, REVIEW_COMMENT_MAX_LENGTH));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("Поставь оценку");
      return;
    }

    try {
      await createReviewRequest({
        orderId: selectedOrder.id,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);
      onStatusChange({
        ...selectedOrder,
        reviewed: true,
      });
    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);
      alert(error.message || "Не удалось отправить отзыв");
    }
  };

  const showReviewForm =
    selectedOrder.status === "paid" && !selectedOrder.reviewed && !submitted;

  return (
    <>
      <div className="space-y-4 min-w-0">
        <button onClick={onBack} className="text-sm text-gray-700">
          ← Назад
        </button>

        <div className="border p-4 rounded-2xl bg-white space-y-4 shadow overflow-hidden min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-black break-words [overflow-wrap:anywhere]">
              {selectedOrder.service_name}
            </h1>
            <p className="text-sm text-gray-700 break-words [overflow-wrap:anywhere]">
              {selectedOrder.category}
            </p>
          </div>

          <div className="space-y-2 min-w-0">
            <p className="text-sm text-gray-700">Статус</p>

            <div className="flex justify-between text-[11px] gap-1 min-w-0">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentIndex;

                return (
                  <div
                    key={step.key}
                    className={`flex-1 text-center min-w-0 ${
                      isActive ? "text-black font-semibold" : "text-gray-400"
                    }`}
                  >
                    <span className="block truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentIndex;

                return (
                  <div
                    key={step.key}
                    className={`h-2 flex-1 rounded ${
                      isActive ? "bg-black" : "bg-gray-200"
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-sm font-medium text-black">
              {getStatusLabel(selectedOrder.status)}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-800 min-w-0">
            <p className="break-words [overflow-wrap:anywhere]">
              {selectedOrder.description}
            </p>

            <p className="break-words [overflow-wrap:anywhere]">
              <span className="font-medium text-black">Адрес:</span>{" "}
              {selectedOrder.address}
            </p>

            <p className="break-words [overflow-wrap:anywhere]">
              <span className="font-medium text-black">Дата:</span>{" "}
              {selectedOrder.scheduled_at}
            </p>
          </div>

          {selectedOrder.photos?.length > 0 && (
            <div className="space-y-2 min-w-0">
              <p className="text-sm font-medium text-black">Фото заявки</p>

              <div className="grid grid-cols-2 gap-2">
                {selectedOrder.photos.map((photo) => {
                  const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setOpenedPhoto(photoUrl)}
                      className="block overflow-hidden rounded-xl"
                    >
                      <img
                        src={photoUrl}
                        alt="Фото заявки"
                        className="h-32 w-full rounded-xl object-cover border"
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Нажми на фото, чтобы открыть крупно
              </p>
            </div>
          )}

          <div className="rounded-xl border bg-gray-50 p-3 space-y-2 min-w-0">
            <p className="font-medium text-black break-words [overflow-wrap:anywhere]">
              Мастер: {selectedOrder.master_name || "назначается..."}
            </p>

            {selectedOrder.master_rating !== null &&
              selectedOrder.master_rating !== undefined && (
                <p className="text-sm text-gray-700">
                  Рейтинг: ⭐ {selectedOrder.master_rating}
                </p>
              )}

            {selectedOrder.price && (
              <p className="text-sm font-semibold text-black break-words [overflow-wrap:anywhere]">
                Сумма: {selectedOrder.price}
              </p>
            )}
          </div>

          {selectedOrder.status === "pending_user_confirmation" &&
            selectedOrder.offers?.length > 0 && (
              <div className="space-y-4 min-w-0">
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                  <p className="text-sm text-gray-700">
                    На вашу заявку откликнулись мастера. Выберите одного:
                  </p>
                </div>

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
                      className="rounded-xl border bg-white p-4 space-y-3"
                    >
                      {photoUrl && (
                        <img
                          src={photoUrl}
                          alt="Фото мастера"
                          className="h-20 w-20 rounded-full object-cover border"
                        />
                      )}

                      <p className="text-lg font-semibold text-black break-words [overflow-wrap:anywhere]">
                        {master?.full_name || "Без имени"}
                      </p>

                      {master?.about_me && (
                        <p className="text-sm text-gray-700 break-words [overflow-wrap:anywhere]">
                          {master.about_me}
                        </p>
                      )}

                      {master?.experience_years !== null &&
                        master?.experience_years !== undefined && (
                          <p className="text-sm text-gray-700">
                            Стаж: {master.experience_years} лет
                          </p>
                        )}

                      <p className="text-sm text-gray-700">
                        ⭐ Рейтинг: {master?.rating ?? 0}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleConfirmMaster(offer.id)}
                          disabled={processingOfferId !== null}
                          className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-60"
                        >
                          {processingOfferId === offer.id
                            ? "Выбор..."
                            : "Выбрать"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectMaster(offer.id)}
                          disabled={processingOfferId !== null}
                          className="w-full rounded-lg border border-gray-300 py-3 text-black disabled:opacity-60"
                        >
                          {processingOfferId === offer.id
                            ? "Обработка..."
                            : "Отклонить"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {selectedOrder.status === "completed" && (
            <div className="space-y-3 min-w-0">
              <div className="rounded-xl border bg-green-50 p-3">
                <p className="text-sm text-gray-700">Работа завершена</p>
                <p className="text-lg font-semibold text-black break-words [overflow-wrap:anywhere]">
                  Сумма: {selectedOrder.price || "5000 ₸"}
                </p>
              </div>

              <button
                className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-60"
                onClick={handlePay}
                disabled={isPaying}
              >
                {isPaying ? "Оплата..." : "Оплатить"}
              </button>
            </div>
          )}

          {showReviewForm && (
            <div className="space-y-4 min-w-0">
              <div className="rounded-xl bg-green-100 p-4 text-center">
                <p className="text-lg font-semibold text-green-800">
                  Оплачено ✅
                </p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-black">
                  Оцените мастера
                </p>

                <div className="flex justify-center gap-2 text-3xl">
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
                            : "text-gray-400 hover:text-gray-600"
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
                  className="w-full border rounded-lg p-3 text-sm text-black placeholder:text-gray-400 min-h-[110px] break-words [overflow-wrap:anywhere]"
                />

                <p className="text-right text-xs text-gray-500">
                  {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
                </p>
              </div>

              <button
                className="w-full bg-black text-white py-3 rounded-lg"
                onClick={handleSubmitReview}
              >
                Отправить оценку
              </button>
            </div>
          )}

          {selectedOrder.status === "paid" && !showReviewForm && (
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-lg font-semibold text-black">
                Спасибо за отзыв 🙌
              </p>
            </div>
          )}
        </div>
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </>
  );
}