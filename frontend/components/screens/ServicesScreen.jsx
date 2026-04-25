"use client";

import { useMemo, useRef, useState } from "react";
import {
  Wrench,
  Zap,
  Home,
  DoorOpen,
  Sofa,
  Hammer,
  ImagePlus,
  Trash2,
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

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 22) slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const next = [...photos, ...files].slice(0, MAX_PHOTOS);
    setPhotos(next);

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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#25302c]">Услуги</h1>
        <p className="text-gray-500">
          Выберите категорию, услугу и заполните заявку
        </p>
      </div>

      <div className="rounded-[28px] border bg-white p-6 shadow-sm space-y-6">

        {/* STEPS */}
        <div className="grid grid-cols-3 gap-3">
          {["Категория", "Услуга", "Детали"].map((label, i) => {
            const isActive = step === i + 1;

            return (
              <div
                key={i}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm ${
                  isActive
                    ? "bg-[#e6f3e2] border-[#9bc89a]"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <span className="h-6 w-6 flex items-center justify-center rounded-full border text-xs">
                  {i + 1}
                </span>
                {label}
              </div>
            );
          })}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Wrench;

              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 ${
                    category === cat
                      ? "bg-[#e6f3e2] border-[#9bc89a]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#f3f6f1]">
                    <Icon size={22} />
                  </div>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            {availableServices.map((service) => (
              <button
                key={service}
                onClick={() => setServiceName(service)}
                className={`rounded-2xl border p-4 ${
                  serviceName === service
                    ? "bg-[#e6f3e2] border-[#9bc89a]"
                    : "hover:bg-gray-50"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">

            {/* DESCRIPTION */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              className="w-full rounded-2xl border p-4"
            />

            {/* PRICE */}
            <input
              value={clientPrice}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                const num = raw ? Number(raw) : "";
                setClientPrice(num ? num.toLocaleString("ru-RU") : "");
              }}
              placeholder="Цена"
              className="w-full rounded-2xl border p-4"
            />

            {/* PHOTO UPLOAD */}
            <div className="space-y-3">
              <p className="font-medium">Фото (по желанию)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border rounded-2xl py-3"
              >
                <ImagePlus size={18} />
                Добавить фото
              </button>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => {
                    const url = URL.createObjectURL(photo);

                    return (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          alt={photo.name || "Р¤РѕС‚Рѕ Р·Р°СЏРІРєРё"}
                          className="h-24 w-full object-cover rounded-xl"
                        />

                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DATE */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-2xl border p-4"
            />

            {/* TIME */}
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-xl border py-2 ${
                    selectedTime === time
                      ? "bg-[#7fb276] text-white"
                      : ""
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* SUBMIT */}
            <button
              onClick={() => {
                if (!description.trim()) return alert("Добавь описание");
                if (!clientPrice) return alert("Укажи цену");
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
                  photos, // 🔥 ВАЖНО
                });
              }}
              className="w-full rounded-2xl bg-[#6f9a61] py-4 text-white"
            >
              Отправить заявку
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
