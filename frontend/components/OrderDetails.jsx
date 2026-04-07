import { useState } from "react";

export default function OrderDetails({
  selectedOrder,
  getStatusLabel,
  onBack,
  onStatusChange,
}) {
  // ✅ ХУКИ ВСЕГДА СНАЧАЛА
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!selectedOrder) return null;

  const statusSteps = [
    { key: "searching", label: "Поиск" },
    { key: "assigned", label: "Назначен" },
    { key: "on_the_way", label: "Едет" },
    { key: "on_site", label: "На месте" },
    { key: "completed", label: "Готово" },
    { key: "paid", label: "Оплачено" },
  ];

  const currentIndex = statusSteps.findIndex(
    (s) => s.key === selectedOrder.status,
  );

  const handlePay = async () => {
    try {
      await fetch(
        `http://127.0.0.1:8000/orders/${selectedOrder.id}/status?status=paid`,
        {
          method: "PUT",
        },
      );

      const updatedOrder = {
        ...selectedOrder,
        status: "paid",
      };

      onStatusChange(updatedOrder);
    } catch (error) {
      console.error("Ошибка оплаты:", error);
    }
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Поставь оценку");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-gray-700">
        ← Назад
      </button>

      <div className="border p-4 rounded-2xl bg-white space-y-4 shadow">
        <div>
          <h1 className="text-xl font-bold text-black">
            {selectedOrder.service_name}
          </h1>
          <p className="text-sm text-gray-700">{selectedOrder.category}</p>
        </div>

        {/* СТАТУС */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Статус</p>

          <div className="flex justify-between text-xs">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentIndex;

              return (
                <div
                  key={step.key}
                  className={`flex-1 text-center ${
                    isActive ? "text-black font-semibold" : "text-gray-400"
                  }`}
                >
                  {step.label}
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
        </div>

        {/* ОПИСАНИЕ */}
        <div className="space-y-2 text-sm text-gray-800">
          <p>{selectedOrder.description}</p>

          <p>
            <span className="font-medium text-black">Адрес:</span>{" "}
            {selectedOrder.address}
          </p>

          <p>
            <span className="font-medium text-black">Дата:</span>{" "}
            {selectedOrder.scheduled_at}
          </p>
        </div>

        {/* МАСТЕР */}
        <div className="rounded-xl border bg-gray-50 p-3 space-y-2">
          <p className="font-medium text-black">
            Мастер: {selectedOrder.master_name || "назначается..."}
          </p>

          {selectedOrder.master_rating && (
            <p className="text-sm text-gray-700">
              Рейтинг: ⭐ {selectedOrder.master_rating}
            </p>
          )}
        </div>

        {/* COMPLETED */}
        {selectedOrder.status === "completed" && (
          <div className="space-y-3">
            <div className="rounded-xl border bg-green-50 p-3">
              <p className="text-sm text-gray-700">Работа завершена</p>
              <p className="text-lg font-semibold text-black">
                Сумма: {selectedOrder.price || "5000 ₸"}
              </p>
            </div>

            <button
              className="w-full bg-black text-white py-3 rounded-lg"
              onClick={handlePay}
            >
              Оплатить
            </button>
          </div>
        )}

        {/* PAID */}
        {selectedOrder.status === "paid" && !submitted && (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-100 p-4 text-center">
              <p className="text-lg font-semibold text-green-800">
                Оплачено ✅
              </p>
            </div>

            {/* ⭐ ЗВЁЗДЫ */}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium !text-black">Оцените мастера</p>

              <div className="flex justify-center gap-2 text-3xl">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= rating;

                  return (
                    <button
                      key={star}
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

            <textarea
              placeholder="Комментарий (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm text-black placeholder:text-gray-400"
            />

            <button
              className="w-full bg-black text-white py-3 rounded-lg"
              onClick={handleSubmitReview}
            >
              Отправить оценку
            </button>
          </div>
        )}

        {submitted && (
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-black">
              Спасибо за отзыв 🙌
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
