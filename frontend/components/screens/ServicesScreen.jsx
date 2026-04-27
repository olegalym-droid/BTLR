"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  DoorOpen,
  Hammer,
  Home,
  ImagePlus,
  MapPin,
  Sofa,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";

const CATEGORY_ICONS = {
  "Сантехника": Wrench,
  "Электрика": Zap,
  "Уборка": Home,
  "Окна и двери": DoorOpen,
  "Сборка мебели": Sofa,
  "Ремонт": Hammer,
};

const MAX_PHOTOS = 6;

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function ServicesScreen({
  category,
  setCategory,
  serviceName,
  setServiceName,
  description,
  setDescription,
  clientPrice,
  setClientPrice,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  address,
  setAddress,
  categories,
  availableServices,
  createOrder,
}) {
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const step = !category ? 1 : !serviceName ? 2 : 3;
  const todayDate = useMemo(() => getTodayDateString(), []);

  const timeSlots = useMemo(() => {
    const slots = [];

    for (let h = 8; h <= 22; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 22) slots.push(`${String(h).padStart(2, "0")}:30`);
    }

    return slots;
  }, []);

  const photoPreviews = useMemo(() => {
    return photos.map((photo) => ({
      photo,
      url: URL.createObjectURL(photo),
    }));
  }, [photos]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [photoPreviews]);

  const handleCategorySelect = (nextCategory) => {
    setCategory(nextCategory);
    setServiceName("");
  };

  const handleBackToCategories = () => {
    setCategory("");
    setServiceName("");
  };

  const handleBackToServices = () => {
    setServiceName("");
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const nextPhotos = [...photos, ...files].slice(0, MAX_PHOTOS);
    setPhotos(nextPhotos);

    if (files.length + photos.length > MAX_PHOTOS) {
      alert(`Максимум ${MAX_PHOTOS} фото`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePriceChange = (event) => {
    const raw = event.target.value.replace(/[^\d]/g, "");
    const num = raw ? Number(raw) : "";
    setClientPrice(num ? num.toLocaleString("ru-RU") : "");
  };

  const handleSubmit = () => {
    if (!description.trim()) return alert("Добавь описание");
    if (!clientPrice) return alert("Укажи цену");
    if (!address.trim()) return alert("Укажи адрес");
    if (!selectedDate) return alert("Выбери дату");
    if (!selectedTime) return alert("Выбери время");

    createOrder({
      category,
      serviceName,
      description,
      clientPrice,
      address,
      selectedDate,
      selectedTime,
      photos,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#151c23]">Услуги</h1>
        <p className="mt-1 text-gray-600">
          Выберите категорию, услугу и заполните заявку
        </p>
      </div>

      <div className="space-y-6 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Категория", "Услуга", "Детали"].map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isDone = step > stepNumber;
            const isAvailable =
              stepNumber === 1 ||
              (stepNumber === 2 && Boolean(category)) ||
              (stepNumber === 3 && Boolean(category && serviceName));

            return (
              <button
                key={label}
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  if (stepNumber === 1) handleBackToCategories();
                  if (stepNumber === 2 && category) handleBackToServices();
                }}
                className={`flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-100 ${
                  isActive
                    ? "border-[#78b978] bg-[#e6f3e2] text-[#236530] shadow-sm"
                    : isDone
                      ? "border-[#b9ddb6] bg-[#f1f8f1] text-[#407a45]"
                      : isAvailable
                        ? "border-gray-300 bg-white text-[#25302c] hover:border-[#9bc89a]"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                    isActive || isDone
                      ? "border-[#78b978] bg-white text-[#236530]"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={15} /> : stepNumber}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#151c23]">
                Выберите категорию
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                После выбора откроется список услуг.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || Wrench;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="flex min-h-[86px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left font-semibold text-[#25302c] transition hover:border-[#9bc89a] hover:bg-[#f8fbf7]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef6ea] text-[#5f9557]">
                      <Icon size={22} />
                    </div>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#25302c] transition hover:border-[#9bc89a]"
              >
                <ArrowLeft size={16} />
                Назад к категориям
              </button>

              <span className="rounded-full bg-[#f3f6f1] px-4 py-2 text-sm font-medium text-[#2f6f3c]">
                {category}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {availableServices.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => setServiceName(service)}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left font-medium text-[#25302c] transition hover:border-[#9bc89a] hover:bg-gray-50"
                >
                  {service}
                </button>
              ))}
            </div>

            {availableServices.length === 0 && (
              <p className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Для этой категории пока нет услуг.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToServices}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#25302c] transition hover:border-[#9bc89a]"
              >
                <ArrowLeft size={16} />
                Назад к услугам
              </button>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f3f6f1] px-4 py-2 text-sm font-medium text-[#2f6f3c]">
                  {category}
                </span>
                <span className="rounded-full bg-[#f3f6f1] px-4 py-2 text-sm font-medium text-[#2f6f3c]">
                  {serviceName}
                </span>
              </div>
            </div>

            <div className="grid gap-5">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#25302c]">
                  Описание
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Опишите, что нужно сделать"
                  className="min-h-28 w-full rounded-2xl border border-gray-300 bg-white p-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#25302c]">
                  Цена
                </span>
                <input
                  value={clientPrice}
                  onChange={handlePriceChange}
                  placeholder="Например: 10 000"
                  className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#25302c]">
                  Адрес
                </span>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5f9557]"
                  />
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Укажите адрес заявки"
                    className="w-full rounded-2xl border border-gray-300 bg-white py-4 pl-11 pr-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                  />
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-[#25302c]">Фото (по желанию)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3 text-[#25302c] transition hover:border-[#9bc89a]"
              >
                <ImagePlus size={18} />
                Добавить фото
              </button>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photoPreviews.map((item, index) => (
                    <div
                      key={`${item.photo.name}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={item.url}
                        alt={item.photo.name || "Фото заявки"}
                        className="h-28 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#25302c]">
                Дата
              </span>
              <input
                type="date"
                min={todayDate}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-[#111827] outline-none focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-[#25302c]">
                Время
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`min-h-[44px] rounded-xl border py-2 font-medium transition ${
                      selectedTime === time
                        ? "border-[#6f9a61] bg-[#7fb276] text-white"
                        : "border-gray-300 bg-white text-[#25302c] hover:border-[#9bc89a]"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-[#6f9a61] py-4 font-semibold text-white shadow-sm transition hover:bg-[#5f8f55]"
            >
              Отправить заявку
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
