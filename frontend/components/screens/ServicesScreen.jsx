"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  Hammer,
  Home,
  ImagePlus,
  MapPin,
  PencilLine,
  Sofa,
  Trash2,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";

const CATEGORY_ICONS = {
  Сантехника: Wrench,
  Электрика: Zap,
  Уборка: Home,
  "Окна и двери": DoorOpen,
  "Сборка мебели": Sofa,
  Ремонт: Hammer,
};

const MAX_PHOTOS = 6;
const DESCRIPTION_MAX_LENGTH = 1200;
const ADDRESS_MAX_LENGTH = 260;

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "Не выбрана";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function StepButton({ item, step, isAvailable, onClick }) {
  const isActive = step === item.id;
  const isDone = step > item.id;

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={onClick}
      className={`flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition disabled:cursor-not-allowed ${
        isActive
          ? "border-[#78b978] bg-[#e6f3e2] text-[#236530] shadow-sm"
          : isDone
            ? "border-[#b9ddb6] bg-[#f1f8f1] text-[#407a45]"
            : isAvailable
              ? "border-gray-300 bg-white text-[#25302c] hover:border-[#9bc89a]"
              : "border-gray-300 bg-[#f8faf8] text-[#5f6673]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
          isActive || isDone
            ? "border-[#78b978] bg-white text-[#236530]"
            : isAvailable
              ? "border-gray-300 bg-white text-gray-600"
              : "border-gray-300 bg-white text-[#5f6673]"
        }`}
      >
        {isDone ? <CheckCircle2 size={15} /> : item.id}
      </span>
      {item.label}
    </button>
  );
}

function SummaryTile({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
            {value || "Не указано"}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  profile,
}) {
  const [photos, setPhotos] = useState([]);
  const [currentStep, setCurrentStep] = useState(() => {
    if (!category) return 1;
    if (!serviceName) return 2;
    return 3;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const todayDate = useMemo(() => getTodayDateString(), []);
  const profileAddresses = useMemo(
    () =>
      Array.isArray(profile?.addresses)
        ? profile.addresses.filter((item) => String(item || "").trim())
        : [],
    [profile?.addresses],
  );
  const primaryAddress =
    profileAddresses[profile?.primaryAddressIndex] || profileAddresses[0] || "";

  const step = !category ? 1 : !serviceName ? Math.min(currentStep, 2) : currentStep;
  const detailsReady = Boolean(
    category &&
      serviceName &&
      description.trim() &&
      clientPrice &&
      address.trim() &&
      selectedDate &&
      selectedTime,
  );

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

  useEffect(() => {
    if (!category) {
      setCurrentStep(1);
      return;
    }

    if (!serviceName && currentStep > 2) {
      setCurrentStep(2);
    }
  }, [category, currentStep, serviceName]);

  const handleCategorySelect = (nextCategory) => {
    setCategory(nextCategory);
    setServiceName("");
    setCurrentStep(2);
  };

  const handleServiceSelect = (nextService) => {
    setServiceName(nextService);
    setCurrentStep(3);
  };

  const handleBackToCategories = () => {
    setCategory("");
    setServiceName("");
    setCurrentStep(1);
  };

  const handleBackToServices = () => {
    setServiceName("");
    setCurrentStep(2);
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

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
    const raw = event.target.value.replace(/[^\d]/g, "").slice(0, 8);
    const num = raw ? Number(raw) : "";
    setClientPrice(num ? num.toLocaleString("ru-RU") : "");
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value.slice(0, ADDRESS_MAX_LENGTH));
  };

  const validateDetails = () => {
    if (!category) return alert("Выберите категорию");
    if (!serviceName) return alert("Выберите услугу");
    if (!description.trim()) return alert("Опишите, что нужно сделать");
    if (!clientPrice) return alert("Укажите цену");
    if (!address.trim()) return alert("Укажите адрес");
    if (!selectedDate) return alert("Выберите дату");
    if (!selectedTime) return alert("Выберите время");

    return true;
  };

  const handleGoToConfirmation = () => {
    if (validateDetails()) {
      setCurrentStep(4);
    }
  };

  const handleSubmit = async () => {
    if (!validateDetails()) return;

    try {
      setIsSubmitting(true);
      const success = await createOrder({
        category,
        serviceName,
        description,
        clientPrice,
        address,
        selectedDate,
        selectedTime,
        photos,
      });

      if (!success) {
        setIsSubmitting(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepItems = [
    { id: 1, label: "Категория" },
    { id: 2, label: "Услуга" },
    { id: 3, label: "Детали" },
    { id: 4, label: "Проверка" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#151c23]">Услуги</h1>
        <p className="mt-1 text-gray-600">
          Выберите услугу, заполните детали и проверьте заявку перед отправкой.
        </p>
      </div>

      <div className="space-y-6 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stepItems.map((item) => {
            const isAvailable =
              item.id === 1 ||
              (item.id === 2 && Boolean(category)) ||
              (item.id === 3 && Boolean(category && serviceName)) ||
              (item.id === 4 && detailsReady);

            return (
              <StepButton
                key={item.id}
                item={item}
                step={step}
                isAvailable={isAvailable}
                onClick={() => {
                  if (item.id === 1) handleBackToCategories();
                  if (item.id === 2 && category) handleBackToServices();
                  if (item.id === 3 && category && serviceName) setCurrentStep(3);
                  if (item.id === 4 && detailsReady) setCurrentStep(4);
                }}
              />
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
                После выбора откроется список подходящих услуг.
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
                  onClick={() => handleServiceSelect(service)}
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
                  Описание задачи
                </span>
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
                    )
                  }
                  placeholder="Например: течёт кран на кухне, нужен ремонт сегодня вечером"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  className="min-h-32 w-full rounded-2xl border border-gray-300 bg-white p-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                />
                <p className="text-right text-xs text-gray-500">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#25302c]">
                  Ожидаемая цена
                </span>
                <input
                  value={clientPrice}
                  onChange={handlePriceChange}
                  placeholder="Например: 10 000"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                />
                <p className="text-xs text-gray-500">
                  Мастер может согласиться или предложить свою цену.
                </p>
              </label>

              <div className="space-y-3 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#25302c]">
                      Адрес заявки
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Берём адрес из профиля, но его можно изменить только для
                      этой заявки.
                    </p>
                  </div>

                  {primaryAddress && (
                    <button
                      type="button"
                      onClick={() => setAddress(primaryAddress)}
                      className="rounded-full border border-[#b9d3b6] bg-white px-4 py-2 text-xs font-semibold text-[#5f9557] transition hover:bg-[#f8fbf7]"
                    >
                      Взять основной
                    </button>
                  )}
                </div>

                {profileAddresses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileAddresses.map((item, index) => {
                      const isSelected = address.trim() === item.trim();

                      return (
                        <button
                          key={`${item}-${index}`}
                          type="button"
                          onClick={() => setAddress(item)}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "border-[#78b978] bg-[#e6f3e2] text-[#236530]"
                              : "border-gray-200 bg-white text-gray-600 hover:border-[#9bc89a]"
                          }`}
                        >
                          {index === profile?.primaryAddressIndex
                            ? "Основной адрес"
                            : `Адрес ${index + 1}`}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                    В профиле пока нет сохранённых адресов. Введите адрес ниже,
                    а позже сможете сохранить его в профиле.
                  </div>
                )}

                <div className="relative">
                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5f9557]"
                  />
                  <input
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="Укажите адрес заявки"
                    maxLength={ADDRESS_MAX_LENGTH}
                    className="w-full rounded-2xl border border-gray-300 bg-white py-4 pl-11 pr-4 text-[#111827] outline-none placeholder:text-gray-500 focus:border-[#6f9a61] focus:ring-2 focus:ring-[#e6f3e2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              </div>

              <div className="space-y-3 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#25302c]">
                      Фото задачи
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Не обязательно, но фото помогают мастеру быстрее понять
                      объём работы.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </div>

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
                  className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#25302c] transition hover:border-[#9bc89a]"
                >
                  <ImagePlus size={18} />
                  Добавить фото
                </button>

                {photoPreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photoPreviews.map((item, index) => (
                      <div
                        key={`${item.photo.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
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
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                    Фото не добавлены. Заявку можно отправить и без них.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoToConfirmation}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9a61] px-4 py-4 font-semibold text-white shadow-sm transition hover:bg-[#5f8f55]"
            >
              <ClipboardCheck size={20} />
              Проверить заявку
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#25302c] transition hover:border-[#9bc89a]"
              >
                <ArrowLeft size={16} />
                Изменить детали
              </button>

              <span className="rounded-full bg-[#e6f3e2] px-4 py-2 text-sm font-semibold text-[#236530]">
                Готово к отправке
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#151c23]">
                Проверьте заявку
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                После отправки мастера увидят заявку и смогут откликнуться.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryTile icon={Wrench} label="Категория" value={category} />
              <SummaryTile icon={PencilLine} label="Услуга" value={serviceName} />
              <SummaryTile
                icon={WalletCards}
                label="Цена клиента"
                value={clientPrice ? `${clientPrice} ₸` : ""}
              />
              <SummaryTile
                icon={CalendarDays}
                label="Дата и время"
                value={`${formatDate(selectedDate)}, ${selectedTime || "время не выбрано"}`}
              />
              <SummaryTile
                icon={MapPin}
                label="Адрес"
                value={address}
                className="md:col-span-2"
              />
              <SummaryTile
                icon={ImagePlus}
                label="Фото"
                value={
                  photos.length > 0
                    ? `${photos.length} фото прикреплено`
                    : "Фото не добавлены"
                }
              />
              <SummaryTile
                icon={Clock3}
                label="Что дальше"
                value="Заявка появится у подходящих мастеров. Когда мастер откликнется, вы выберете исполнителя в разделе заказов."
              />
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Описание
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-[#25302c] sm:text-base [overflow-wrap:anywhere]">
                {description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6f9a61] px-4 py-4 font-semibold text-white shadow-sm transition hover:bg-[#5f8f55] disabled:opacity-60"
            >
              <CheckCircle2 size={20} />
              {isSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
