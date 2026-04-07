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

export default function Home() {
  const [activeTab, setActiveTab] = useState("services");
  const [orders, setOrders] = useState([]);
  const [orderCreated, setOrderCreated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [category, setCategory] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

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

  const resetForm = () => {
    setCategory("");
    setServiceName("");
    setDescription("");
    setAddress("");
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

  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-4 mt-20">
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
        className="w-full bg-black text-white py-3 rounded-lg"
      >
        Перейти к заказам
      </button>

      <button
        onClick={() => {
          setOrderCreated(false);
          setActiveTab("services");
        }}
        className="w-full border border-gray-300 text-black py-3 rounded-lg"
      >
        Назад к услугам
      </button>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-black">Услуги</h1>
        <p className="text-sm text-gray-700 mt-1">
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
        <p className="text-sm text-gray-700 mt-1">
          Активные и завершённые заявки
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-black mb-3">Активные</h2>

        {activeOrders.length === 0 ? (
          <div className="border rounded-2xl p-4 bg-white text-gray-700">
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
        <h2 className="text-xl font-semibold text-black mb-3">Завершённые</h2>

        {completedOrders.length === 0 ? (
          <div className="border rounded-2xl p-4 bg-white text-gray-700">
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
      <h1 className="text-3xl font-bold text-black">Профиль</h1>

      <div className="border p-4 rounded-2xl shadow bg-white space-y-4">
        <div>
          <p className="text-sm text-gray-700">Имя</p>
          <p className="text-lg font-medium text-black">Олег</p>
        </div>

        <div>
          <p className="text-sm text-gray-700">Телефон</p>
          <p className="text-lg font-medium text-black">+7 700 000 00 00</p>
        </div>

        <div>
          <p className="text-sm text-gray-700">Адрес</p>
          <p className="text-lg font-medium text-black">
            Адрес пока не добавлен
          </p>
        </div>

        <button className="w-full bg-black text-white px-4 py-3 rounded-lg">
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md pb-24">
        <div className="p-4 md:p-6">
          {orderCreated ? (
            renderSuccessScreen()
          ) : selectedOrder ? (
            <OrderDetails
              selectedOrder={selectedOrder}
              getStatusLabel={getStatusLabel}
              onBack={() => setSelectedOrder(null)}
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
