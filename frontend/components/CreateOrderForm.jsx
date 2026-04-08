"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

export default function CreateOrderForm({
  categories,
  category,
  setCategory,
  serviceName,
  setServiceName,
  availableServices,
  description,
  setDescription,
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
    setPhotos(selectedFiles);
  };

  const handleRemovePhoto = (indexToRemove) => {
    const nextPhotos = photos.filter((_, index) => index !== indexToRemove);
    setPhotos(nextPhotos);

    if (fileInputRef.current && nextPhotos.length === 0) {
      fileInputRef.current.value = "";
    }
  };

  const stepLabels = [
    { id: 1, title: "Категория" },
    { id: 2, title: "Услуга" },
    { id: 3, title: "Детали" },
  ];

  return (
    <div className="border rounded-2xl bg-white shadow p-4 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-black">Оформление заявки</h2>
        <p className="text-sm text-gray-700 mt-1">Заполни заявку по шагам</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
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
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-black text-white border-black"
                  : isDone
                    ? "bg-gray-100 text-black border-gray-300"
                    : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {category && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
            Категория: {category}
          </span>

          {serviceName && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
              Услуга: {serviceName}
            </span>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-black">
              Выберите категорию
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              С чего начинается ваша заявка
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSelectCategory(item)}
                className={`border rounded-xl p-3 text-sm text-left transition ${
                  category === item
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300"
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-black">
                Выберите услугу
              </h3>
              <p className="text-sm text-gray-700 mt-1">{category}</p>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-gray-700"
            >
              Изменить
            </button>
          </div>

          <div className="space-y-2">
            {availableServices.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => handleSelectService(service)}
                className={`w-full border rounded-xl p-3 text-left transition ${
                  serviceName === service
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && category && serviceName && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-black">
                Детали заявки
              </h3>
              <p className="text-sm text-gray-700 mt-1">{serviceName}</p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-gray-700"
            >
              Изменить
            </button>
          </div>

          <textarea
            placeholder="Что нужно сделать"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg p-3 min-h-[100px] text-black placeholder:text-gray-400"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-black">Фото</p>

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
              className="w-full border rounded-lg p-3 text-black"
            >
              Прикрепить фото
            </button>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {previewUrls.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="rounded-xl border p-2 space-y-2"
                  >
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="h-28 w-full rounded-lg object-cover"
                    />

                    <p className="text-xs text-gray-700 break-all">
                      {item.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="w-full rounded-lg border border-red-300 py-2 text-sm text-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg p-3 text-black placeholder:text-gray-400"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-black">Время</p>
            <p className="text-sm text-gray-700">Выберите удобный слот</p>

            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    selectedTime === time
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => createOrder(photos)}
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Отправить заявку
          </button>
        </div>
      )}
    </div>
  );
}