"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DESCRIPTION_MAX_LENGTH = 300;
const ADDRESS_MAX_LENGTH = 180;
const CLIENT_PRICE_MAX_LENGTH = 20;
const MAX_ORDER_PHOTOS = 4;

const generateTimeSlots = (startHour = 8, endHour = 22) => {
  const slots = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (const minute of [0, 30]) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return slots;
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateOrderForm({
  categories,
  category,
  setCategory,
  serviceName,
  setServiceName,
  availableServices,
  description,
  setDescription,
  clientPrice,
  setClientPrice,
  address,
  setAddress,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  createOrder,
}) {
  const [step, setStep] = useState(() => {
    if (serviceName) return 3;
    if (category) return 2;
    return 1;
  });

  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const previewUrls = useMemo(() => {
    return photos.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [photos]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewUrls]);

  const handleSelectCategory = (item) => {
    setCategory(item);
    setServiceName("");
    setStep(2);
  };

  const handleSelectService = (service) => {
    setServiceName(service);
    setStep(3);
  };

  const handlePhotoChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const merged = [...photos, ...selectedFiles].slice(0, MAX_ORDER_PHOTOS);
    setPhotos(merged);

    if (photos.length + selectedFiles.length > MAX_ORDER_PHOTOS) {
      alert(`Можно прикрепить не более ${MAX_ORDER_PHOTOS} фото`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    const nextPhotos = photos.filter((_, index) => index !== indexToRemove);
    setPhotos(nextPhotos);

    if (fileInputRef.current && nextPhotos.length === 0) {
      fileInputRef.current.value = "";
    }
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH));
  };

  const handleClientPriceChange = (event) => {
    const raw = String(event.target.value || "");
    const digits = raw.replace(/[^\d]/g, "");
    const limited = digits.slice(0, CLIENT_PRICE_MAX_LENGTH);
    const formatted = limited.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    setClientPrice(formatted);
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value.slice(0, ADDRESS_MAX_LENGTH));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      await createOrder({
        category,
        serviceName,
        description,
        clientPrice,
        address,
        selectedDate,
        selectedTime,
        photos,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { id: 1, title: "Категория" },
    { id: 2, title: "Услуга" },
    { id: 3, title: "Детали" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-black sm:text-2xl">
            Оформление заявки
          </h2>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Заполните заявку по шагам
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {stepLabels.map((item) => {
            const isActive = step === item.id;
            const isDone = step > item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 1) setStep(1);
                  if (item.id === 2 && category) setStep(2);
                  if (item.id === 3 && category && serviceName) setStep(3);
                }}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition sm:text-base ${
                  isActive
                    ? "border-black bg-black text-white"
                    : isDone
                      ? "border-gray-300 bg-gray-100 text-black"
                      : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {category && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-800 sm:text-sm">
              Категория: {category}
            </span>

            {serviceName && (
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-800 sm:text-sm">
                Услуга: {serviceName}
              </span>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-black sm:text-lg">
                Выберите категорию
              </h3>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                С чего начинается ваша заявка
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectCategory(item)}
                  className={`rounded-xl border p-4 text-left text-sm transition sm:text-base ${
                    category === item
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-black hover:border-gray-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && category && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-black sm:text-lg">
                  Выберите услугу
                </h3>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  {category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="self-start text-sm text-gray-700 hover:underline"
              >
                Изменить категорию
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {availableServices.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition sm:text-base ${
                    serviceName === service
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-black hover:border-gray-400"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && category && serviceName && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-black sm:text-lg">
                  Детали заявки
                </h3>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  {serviceName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="self-start text-sm text-gray-700 hover:underline"
              >
                Изменить услугу
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black sm:text-base">
                Описание
              </label>
              <textarea
                placeholder="Что нужно сделать"
                value={description}
                onChange={handleDescriptionChange}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className="min-h-[120px] w-full rounded-xl border border-gray-300 p-4 text-black outline-none placeholder:text-gray-400 focus:border-black"
              />
              <p className="text-right text-xs text-gray-500">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black sm:text-base">
                Ваша цена
              </label>
              <input
                type="text"
                placeholder="Например: 7000 ₸"
                value={clientPrice}
                onChange={handleClientPriceChange}
                maxLength={CLIENT_PRICE_MAX_LENGTH}
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-300 p-4 text-black outline-none placeholder:text-gray-400 focus:border-black"
              />
              <p className="text-xs text-gray-500">
                Укажите сумму, за которую хотите выполнить работу
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-black sm:text-base">
                  Фото
                </p>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Можно прикрепить до {MAX_ORDER_PHOTOS} фото
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black hover:border-gray-400 sm:text-base"
              >
                Прикрепить фото
              </button>

              <p className="text-right text-xs text-gray-500">
                {photos.length}/{MAX_ORDER_PHOTOS}
              </p>

              {photos.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {previewUrls.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="space-y-2 rounded-2xl border border-gray-200 p-3"
                    >
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-40 w-full rounded-xl object-cover sm:h-44"
                      />

                      <p className="break-all text-xs text-gray-700 sm:text-sm">
                        {item.file.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="w-full rounded-xl border border-red-300 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black sm:text-base">
                Адрес
              </label>
              <input
                type="text"
                placeholder="Введите адрес"
                value={address}
                onChange={handleAddressChange}
                maxLength={ADDRESS_MAX_LENGTH}
                className="w-full rounded-xl border border-gray-300 p-4 text-black outline-none placeholder:text-gray-400 focus:border-black"
              />
              <p className="text-right text-xs text-gray-500">
                {address.length}/{ADDRESS_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-black sm:text-base">
                  Дата
                </p>

                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayDateString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-black outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-black sm:text-base">
                  Время
                </p>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Выберите удобный слот
                </p>

                <div className="rounded-2xl border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`h-12 rounded-xl border px-3 text-sm transition sm:text-base ${
                          selectedTime === time
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:border-gray-400"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-black px-4 py-4 text-sm font-medium text-white disabled:opacity-60 sm:text-base"
            >
              {isSubmitting ? "Отправка..." : "Отправить заявку"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
