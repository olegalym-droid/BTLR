"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../BottomNav";
import CabinetHeader from "../CabinetHeader";
import StatePanel from "../StatePanel";
import UserAppView from "../UserAppView";
import { servicesByCategory } from "../../lib/constants";
import { getStatusLabel, loadUserOrderRequest } from "../../lib/orders";
import useOrders from "../../hooks/useOrders";
import useProfile from "../../hooks/useProfile";
import useOrderForm from "../../hooks/useOrderForm";
import { getStoredAuthUser, clearAuthData } from "../../lib/auth";
import {
  getCurrentSessionRole,
  getRolePath,
  getUserTabPath,
  getStoredUserTab,
  saveStoredUserTab,
  setStoredActiveRole,
  USER_TABS,
} from "../../lib/session";

const resolveUserTab = (tab) =>
  USER_TABS.includes(tab) ? tab : getStoredUserTab();

const USER_TAB_LABELS = {
  services: "Услуги",
  orders: "Заказы",
  chats: "Чаты",
  profile: "Профиль",
};

export default function UserAppShell({
  initialTab = "services",
  onLogout,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => resolveUserTab(initialTab));
  const [sessionStatus, setSessionStatus] = useState(() => {
    const role = getCurrentSessionRole();
    const authUser = getStoredAuthUser("user");

    if (role && role !== "user") {
      return "redirecting";
    }

    return authUser?.id && authUser.role === "user" ? "ready" : "missing";
  });

  const {
    orderCreated,
    setOrderCreated,
    selectedOrder,
    setSelectedOrder,
    createOrder: createOrderAction,
    activeOrders,
    completedOrders,
    updateSelectedOrder,
    loadOrders,
    orders,
  } = useOrders();

  const {
    profile,
    address: profileAddress,
    newAddressForm,
    setNewAddressForm,
    profileSaved,
    addAddress,
    removeAddress,
    setPrimaryAddress,
    resetProfileState,
    syncProfileFromStorage,
  } = useProfile();

  const {
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
    resetForm,
  } = useOrderForm({ initialAddress: profileAddress });

  const categories = Object.keys(servicesByCategory);
  const authUser = useMemo(() => getStoredAuthUser("user"), []);

  const availableServices = useMemo(() => {
    return category ? servicesByCategory[category] || [] : [];
  }, [category]);

  useEffect(() => {
    const role = getCurrentSessionRole();
    let timer;

    if (role && role !== "user") {
      window.location.replace(getRolePath(role));
      return;
    }

    const authUser = getStoredAuthUser("user");

    if (!authUser?.id || authUser.role !== "user") {
      timer = window.setTimeout(() => {
        setSessionStatus("missing");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    setStoredActiveRole("user");
    syncProfileFromStorage();
    timer = window.setTimeout(() => {
      setSessionStatus("ready");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [syncProfileFromStorage]);

  useEffect(() => {
    const nextPrimaryAddress =
      profile.addresses[profile.primaryAddressIndex] || "";

    setAddress((currentAddress) =>
      currentAddress ? currentAddress : nextPrimaryAddress,
    );
  }, [profile, setAddress]);

  const createOrder = async ({
    category,
    serviceName,
    description,
    clientPrice,
    address,
    selectedDate,
    selectedTime,
    photos = [],
  }) => {
    const success = await createOrderAction({
      category,
      serviceName,
      description,
      clientPrice,
      address,
      selectedDate,
      selectedTime,
      photos,
      onSuccess: () =>
        resetForm(profile.addresses[profile.primaryAddressIndex] || ""),
    });

    if (!success) return;

    return success;
  };

  const handleTabChange = async (tab) => {
    const nextTab = USER_TABS.includes(tab) ? tab : "services";

    saveStoredUserTab(nextTab);
    setActiveTab(nextTab);
    setOrderCreated(false);
    setSelectedOrder(null);
    router.push(getUserTabPath(nextTab));

    if (nextTab === "orders") {
      await loadOrders();
    }
  };

  const handleOpenUserOrder = (order) => {
    if (!order?.id) {
      return;
    }

    router.push(`/user/orders/${order.id}`);
  };

  const handleOpenOrderFromNotification = async (orderId) => {
    if (!orderId) {
      return;
    }

    await loadOrders();

    const authUser = getStoredAuthUser("user");
    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    saveStoredUserTab("orders");
    setActiveTab("orders");
    setOrderCreated(false);

    const freshOrders = [...orders];
    let foundOrder = freshOrders.find((item) => item.id === orderId);

    if (!foundOrder) {
      try {
        foundOrder = await loadUserOrderRequest(orderId);
      } catch (error) {
        console.error("Ошибка открытия заказа из уведомления:", error);
      }
    }

    if (foundOrder) {
      router.push(`/user/orders/${foundOrder.id}`);
      return;
    }

    router.push(`/user/orders/${orderId}`);
  };

  const handleLogout = () => {
    resetProfileState();
    resetForm("");
    clearAuthData("user");
    setSelectedOrder(null);
    setOrderCreated(false);

    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    window.location.replace("/");
  };

  if (sessionStatus === "checking" || sessionStatus === "redirecting") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Открываем кабинет"
          text="Проверяем сохраненный вход пользователя."
        />
      </main>
    );
  }

  if (sessionStatus === "missing") {
    return (
      <main className="min-h-screen bg-gray-100">
        <StatePanel
          title="Нужно войти"
          text="Для кабинета пользователя нужна активная сессия."
          actionLabel="Перейти ко входу"
          onAction={() => window.location.replace("/")}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <CabinetHeader
          title="Кабинет пользователя"
          subtitle="Создание заявок, отслеживание заказов, чаты и профиль."
          roleLabel="Пользователь"
          accountName={profile.name || authUser?.fullName || authUser?.phone}
          activeLabel={USER_TAB_LABELS[activeTab]}
          onLogout={handleLogout}
        >
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </CabinetHeader>

        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <UserAppView
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            orderCreated={orderCreated}
            setOrderCreated={setOrderCreated}
            selectedOrder={selectedOrder}
            setSelectedOrder={handleOpenUserOrder}
            updateSelectedOrder={updateSelectedOrder}
            activeOrders={activeOrders}
            completedOrders={completedOrders}
            categories={categories}
            category={category}
            setCategory={setCategory}
            serviceName={serviceName}
            setServiceName={setServiceName}
            availableServices={availableServices}
            description={description}
            setDescription={setDescription}
            clientPrice={clientPrice}
            setClientPrice={setClientPrice}
            address={address}
            setAddress={setAddress}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            createOrder={createOrder}
            getStatusLabel={getStatusLabel}
            profile={profile}
            userAccountId={authUser?.id}
            newAddressForm={newAddressForm}
            setNewAddressForm={setNewAddressForm}
            profileSaved={profileSaved}
            addAddress={addAddress}
            removeAddress={removeAddress}
            setPrimaryAddress={setPrimaryAddress}
            handleLogout={handleLogout}
            onOpenOrder={handleOpenOrderFromNotification}
          />
        </div>
      </div>
    </main>
  );
}
