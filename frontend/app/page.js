"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import CreateOrderForm from "../components/CreateOrderForm";
import OrderCard from "../components/OrderCard";
import OrderDetails from "../components/OrderDetails";

const servicesByCategory = {
  Сантехника: [
    "Починить кран",
    "Поменять смеситель",
    "Устранить протечку",
    "Установить унитаз",
  ],
  Электрика: [
    "Починить розетку",
    "Установить светильник",
    "Поменять выключатель",
    "Проверить проводку",
  ],
  Уборка: [
    "Генеральная уборка",
    "Уборка кухни",
    "Уборка ванной",
    "Мытьё полов",
  ],
  "Окна и двери": [
    "Починить окно",
    "Отрегулировать дверь",
    "Заменить ручку",
    "Устранить сквозняк",
  ],
  "Сборка мебели": [
    "Собрать шкаф",
    "Собрать стол",
    "Собрать кровать",
    "Повесить полку",
  ],
  Ремонт: [
    "Покрасить стену",
    "Зашпаклевать трещину",
    "Мелкий ремонт",
    "Заменить плинтус",
  ],
};

const DEFAULT_PROFILE = {
  name: "Олег",
  phone: "+7 700 000 00 00",
  addresses: [],
  primaryAddressIndex: 0,
};

const EMPTY_ADDRESS_FORM = {
  city: "",
  street: "",
  house: "",
  apartment: "",
};

const getStoredProfile = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE;
  }

  try {
    const savedProfile = localStorage.getItem("resident_profile");

    if (!savedProfile) {
      return DEFAULT_PROFILE;
    }

    const parsed = JSON.parse(savedProfile);

    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
      primaryAddressIndex:
        typeof parsed.primaryAddressIndex === "number"
          ? parsed.primaryAddressIndex
          : 0,
    };
  } catch (error) {
    console.error("Ошибка чтения профиля:", error);
    return DEFAULT_PROFILE;
  }
};

const getPrimaryAddressFromProfile = (profile) => {
  if (!profile?.addresses?.length) {
    return "";
  }

  return (
    profile.addresses[profile.primaryAddressIndex] || profile.addresses[0] || ""
  );
};

const formatPhoneInput = (value) => {
  let cleaned = value.replace(/[^\d+]/g, "");

  if (cleaned.includes("+")) {
    cleaned = `+${cleaned.replace(/\+/g, "")}`;
  }

  if (!cleaned.startsWith("+") && cleaned.length > 0) {
    cleaned = `+${cleaned}`;
  }

  return cleaned.slice(0, 16);
};

const buildAddressString = ({ city, street, house, apartment }) => {
  const parts = [];

  if (city.trim()) {
    parts.push(`г. ${city.trim()}`);
  }

  if (street.trim()) {
    parts.push(`ул. ${street.trim()}`);
  }

  if (house.trim()) {
    parts.push(`д. ${house.trim()}`);
  }

  if (apartment.trim()) {
    parts.push(`кв. ${apartment.trim()}`);
  }

  return parts.join(", ");
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("services");
  const [orders, setOrders] = useState([]);
  const [orderCreated, setOrderCreated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [category, setCategory] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState(getStoredProfile);
  const [address, setAddress] = useState(() =>
    getPrimaryAddressFromProfile(getStoredProfile()),
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [newAddressForm, setNewAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [profileSaved, setProfileSaved] = useState(false);

  const categories = Object.keys(servicesByCategory);

  const availableServices = useMemo(() => {
    return category ? servicesByCategory[category] || [] : [];
  }, [category]);

  const loadOrders = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/orders");
        const data = await res.json();

        if (isMounted) {
          setOrders(data);
        }
      } catch (error) {
        console.error("Ошибка загрузки заявок:", error);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profileSaved) return;

    const timer = setTimeout(() => setProfileSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [profileSaved]);

  const resetForm = () => {
    setCategory("");
    setServiceName("");
    setDescription("");
    setAddress(getPrimaryAddressFromProfile(profile));
    setSelectedDate("");
    setSelectedTime("");
  };

  const createOrder = async () => {
    if (
      !category ||
      !serviceName ||
      !description ||
      !address ||
      !selectedDate ||
      !selectedTime
    ) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    const scheduledAt = `${selectedDate} ${selectedTime}`;

    try {
      await fetch("http://127.0.0.1:8000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          service_name: serviceName,
          description,
          address,
          scheduled_at: scheduledAt,
        }),
      });

      resetForm();
      await loadOrders();
      setOrderCreated(true);
    } catch (error) {
      console.error("Ошибка создания заявки:", error);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      searching: "Ищем мастера",
      assigned: "Мастер назначен",
      on_the_way: "Мастер едет",
      on_site: "Мастер на месте",
      completed: "Работа выполнена",
      paid: "Оплачено",
    };

    return statusMap[status] || status;
  };

  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "paid",
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed" || order.status === "paid",
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setOrderCreated(false);
    setSelectedOrder(null);
  };

  const saveProfile = () => {
    localStorage.setItem("resident_profile", JSON.stringify(profile));
    setProfileSaved(true);
    setAddress(getPrimaryAddressFromProfile(profile));
  };

  const addAddress = () => {
    const fullAddress = buildAddressString(newAddressForm);

    if (
      !newAddressForm.city.trim() ||
      !newAddressForm.street.trim() ||
      !newAddressForm.house.trim()
    ) {
      alert("Заполни хотя бы город, улицу и дом");
      return;
    }

    const updatedAddresses = [...profile.addresses, fullAddress];

    setProfile((prev) => ({
      ...prev,
      addresses: updatedAddresses,
      primaryAddressIndex:
        updatedAddresses.length === 1 ? 0 : prev.primaryAddressIndex,
    }));

    setNewAddressForm(EMPTY_ADDRESS_FORM);
  };

  const removeAddress = (indexToRemove) => {
    const updatedAddresses = profile.addresses.filter(
      (_, index) => index !== indexToRemove,
    );

    let nextPrimaryIndex = profile.primaryAddressIndex;

    if (updatedAddresses.length === 0) {
      nextPrimaryIndex = 0;
    } else if (indexToRemove === profile.primaryAddressIndex) {
      nextPrimaryIndex = 0;
    } else if (indexToRemove < profile.primaryAddressIndex) {
      nextPrimaryIndex = profile.primaryAddressIndex - 1;
    }

    const updatedProfile = {
      ...profile,
      addresses: updatedAddresses,
      primaryAddressIndex: nextPrimaryIndex,
    };

    setProfile(updatedProfile);
    setAddress((currentAddress) => {
      const primaryAddress = getPrimaryAddressFromProfile(updatedProfile);
      return currentAddress === profile.addresses[indexToRemove]
        ? primaryAddress
        : currentAddress;
    });
  };

  const setPrimaryAddress = (index) => {
    const updatedProfile = {
      ...profile,
      primaryAddressIndex: index,
    };

    setProfile(updatedProfile);
    setAddress(getPrimaryAddressFromProfile(updatedProfile));
  };

  const handleLogout = () => {
    localStorage.removeItem("resident_profile");
    setProfile(DEFAULT_PROFILE);
    setNewAddressForm(EMPTY_ADDRESS_FORM);
    setAddress("");
    setProfileSaved(false);
  };

  const renderSuccessScreen = () => (
    <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="text-6xl">⏳</div>
      <h1 className="text-2xl font-bold text-black">Заявка принята</h1>
      <p className="text-gray-700">
        Ищем для вас мастера, это может занять пару минут
      </p>

      <button
        onClick={() => {
          setOrderCreated(false);
          setActiveTab("orders");
        }}
        className="w-full rounded-lg bg-black py-3 text-white"
      >
        Перейти к заказам
      </button>

      <button
        onClick={() => {
          setOrderCreated(false);
          setActiveTab("services");
        }}
        className="w-full rounded-lg border border-gray-300 py-3 text-black"
      >
        Назад к услугам
      </button>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-black">Услуги</h1>
        <p className="mt-1 text-sm text-gray-700">
          Выберите категорию, услугу и заполните заявку
        </p>
      </div>

      <CreateOrderForm
        categories={categories}
        category={category}
        setCategory={setCategory}
        serviceName={serviceName}
        setServiceName={setServiceName}
        availableServices={availableServices}
        description={description}
        setDescription={setDescription}
        address={address}
        setAddress={setAddress}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        createOrder={createOrder}
      />
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Мои заказы</h1>
        <p className="mt-1 text-sm text-gray-700">
          Активные и завершённые заявки
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xl font-semibold text-black">Активные</h2>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-gray-700">
            Нет активных заказов
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusLabel={getStatusLabel}
                onClick={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-xl font-semibold text-black">Завершённые</h2>

        {completedOrders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-gray-700">
            Нет завершённых заказов
          </div>
        ) : (
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusLabel={getStatusLabel}
                onClick={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
        <p className="mt-1 text-sm text-gray-700">
          Контакты и адреса для быстрого оформления заявок
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-4 shadow">
        <div className="space-y-2">
          <label className="text-sm text-gray-700">Имя</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-lg border p-3 text-black"
            placeholder="Введите имя"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-700">Телефон</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                phone: formatPhoneInput(e.target.value),
              }))
            }
            className="w-full rounded-lg border p-3 text-black"
            placeholder="+7 777 123 45 67"
            inputMode="tel"
          />
          <p className="text-xs text-gray-500">
            Вводите номер в международном формате
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700">Адреса</p>
            <p className="mt-1 text-xs text-gray-500">
              Заполните адрес по частям, так пользователю будет понятнее
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              value={newAddressForm.city}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="Город"
              maxLength={50}
            />

            <input
              type="text"
              value={newAddressForm.street}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  street: e.target.value,
                }))
              }
              className="w-full rounded-lg border p-3 text-black"
              placeholder="Улица"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newAddressForm.house}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    house: e.target.value,
                  }))
                }
                className="w-full rounded-lg border p-3 text-black"
                placeholder="Дом"
                maxLength={10}
              />

              <input
                type="text"
                value={newAddressForm.apartment}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    apartment: e.target.value,
                  }))
                }
                className="w-full rounded-lg border p-3 text-black"
                placeholder="Квартира"
                maxLength={10}
              />
            </div>

            <button
              type="button"
              onClick={addAddress}
              className="w-full rounded-lg bg-black px-4 py-3 text-white"
            >
              Добавить адрес
            </button>
          </div>

          {profile.addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-3 text-sm text-gray-600">
              Адреса пока не добавлены
            </div>
          ) : (
            <div className="space-y-2">
              {profile.addresses.map((item, index) => {
                const isPrimary = index === profile.primaryAddressIndex;

                return (
                  <div
                    key={`${item}-${index}`}
                    className="flex flex-col gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-black">{item}</p>

                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="text-sm text-red-600"
                      >
                        Удалить
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrimaryAddress(index)}
                      className={`w-full rounded-lg border py-2 text-sm transition ${
                        isPrimary
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    >
                      {isPrimary ? "Основной адрес" : "Сделать основным"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={saveProfile}
          className="w-full rounded-lg bg-black px-4 py-3 text-white"
        >
          Сохранить профиль
        </button>

        {profileSaved && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Профиль сохранён
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
        >
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen justify-center bg-gray-50">
      <div className="w-full max-w-md pb-24">
        <div className="p-4 md:p-6">
          {orderCreated ? (
            renderSuccessScreen()
          ) : selectedOrder ? (
            <OrderDetails
              selectedOrder={selectedOrder}
              getStatusLabel={getStatusLabel}
              onBack={() => setSelectedOrder(null)}
              onStatusChange={(updatedOrder) => {
                setSelectedOrder({ ...updatedOrder });

                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === updatedOrder.id ? { ...updatedOrder } : o,
                  ),
                );
              }}
            />
          ) : activeTab === "services" ? (
            renderServicesTab()
          ) : activeTab === "orders" ? (
            renderOrdersTab()
          ) : (
            renderProfileTab()
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
