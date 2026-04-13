"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DESCRIPTION_MAX_LENGTH = 300;
const ADDRESS_MAX_LENGTH = 180;
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

const getDaysInMonth = (month, year) => {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
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

  const today = new Date();
  const currentYear = today.getFullYear();

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

  const parsedDate = useMemo(() => {
    if (!selectedDate || !selectedDate.includes("-")) {
      return { year: "", month: "", day: "" };
    }

    const [year, month, day] = selectedDate.split("-");
    return {
      year,
      month,
      day,
    };
  }, [selectedDate]);

  const availableDays = useMemo(() => {
    const daysCount = getDaysInMonth(
      Number(parsedDate.month || 1),
      Number(parsedDate.year || currentYear),
    );

    return Array.from({ length: daysCount }, (_, index) =>
      String(index + 1).padStart(2, "0"),
    );
  }, [parsedDate.month, parsedDate.year, currentYear]);

  const years = useMemo(() => {
    return Array.from({ length: 3 }, (_, index) => String(currentYear + index));
  }, [currentYear]);

  const months = [
    { value: "01", label: "Январь" },
    { value: "02", label: "Февраль" },
    { value: "03", label: "Март" },
    { value: "04", label: "Апрель" },
    { value: "05", label: "Май" },
    { value: "06", label: "Июнь" },
    { value: "07", label: "Июль" },
    { value: "08", label: "Август" },
    { value: "09", label: "Сентябрь" },
    { value: "10", label: "Октябрь" },
    { value: "11", label: "Ноябрь" },
    { value: "12", label: "Декабрь" },
  ];

  const updateDate = ({
    nextDay = parsedDate.day,
    nextMonth = parsedDate.month,
    nextYear = parsedDate.year,
  }) => {
    if (!nextDay || !nextMonth || !nextYear) {
      setSelectedDate("");
      return;
    }

    const maxDay = getDaysInMonth(Number(nextMonth), Number(nextYear));
    const normalizedDay = Math.min(Number(nextDay), maxDay);

    setSelectedDate(
      `${nextYear}-${nextMonth}-${String(normalizedDay).padStart(2, "0")}`,
    );
  };

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

    const nextPhotos = selectedFiles.slice(0, MAX_ORDER_PHOTOS);
    setPhotos(nextPhotos);

    if (selectedFiles.length > MAX_ORDER_PHOTOS) {
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

  const handleAddressChange = (event) => {
    setAddress(event.target.value.slice(0, ADDRESS_MAX_LENGTH));
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

          <div className="space-y-2">
            <textarea
              placeholder="Что нужно сделать"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className="w-full border rounded-lg p-3 min-h-[100px] text-black placeholder:text-gray-400"
            />
            <p className="text-right text-xs text-gray-500">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-black">Фото</p>
            <p className="text-xs text-gray-500">
              Можно прикрепить до {MAX_ORDER_PHOTOS} фото
            </p>

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

            <p className="text-right text-xs text-gray-500">
              {photos.length}/{MAX_ORDER_PHOTOS}
            </p>

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

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Адрес"
              value={address}
              onChange={handleAddressChange}
              maxLength={ADDRESS_MAX_LENGTH}
              className="w-full border rounded-lg p-3 text-black placeholder:text-gray-400"
            />
            <p className="text-right text-xs text-gray-500">
              {address.length}/{ADDRESS_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-black">Дата</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={parsedDate.day}
                onChange={(e) => updateDate({ nextDay: e.target.value })}
                className="w-full border rounded-lg p-3 text-black bg-white"
              >
                <option value="">День</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                value={parsedDate.month}
                onChange={(e) => updateDate({ nextMonth: e.target.value })}
                className="w-full border rounded-lg p-3 text-black bg-white"
              >
                <option value="">Месяц</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={parsedDate.year}
                onChange={(e) => updateDate({ nextYear: e.target.value })}
                className="w-full border rounded-lg p-3 text-black bg-white"
              >
                <option value="">Год</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

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