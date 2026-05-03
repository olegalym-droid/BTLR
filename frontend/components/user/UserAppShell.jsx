"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "../BottomNav";
import StatePanel from "../StatePanel";
import UserAppView from "../UserAppView";
import { API_BASE_URL, servicesByCategory } from "../../lib/constants";
import { getStatusLabel } from "../../lib/orders";
import useOrders from "../../hooks/useOrders";
import useProfile from "../../hooks/useProfile";
import useOrderForm from "../../hooks/useOrderForm";
import { getStoredAuthUser, clearAuthData } from "../../lib/auth";
import {
  getCurrentSessionRole,
  getRolePath,
  getStoredUserTab,
  saveStoredUserTab,
  setStoredActiveRole,
} from "../../lib/session";

export default function UserAppShell({
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState(getStoredUserTab);
  const [sessionStatus, setSessionStatus] = useState("checking");

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
    saveStoredUserTab(tab);
    setActiveTab(tab);
    setOrderCreated(false);
    setSelectedOrder(null);

    if (tab === "orders") {
      await loadOrders();
    }
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
        const response = await fetch(
          `${API_BASE_URL}/orders/${orderId}?user_id=${authUser.id}`,
        );
        const data = await response.json();

        if (response.ok) {
          foundOrder = data;
        }
      } catch (error) {
        console.error("Ошибка открытия заказа из уведомления:", error);
      }
    }

    if (foundOrder) {
      setSelectedOrder(foundOrder);
    }
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

  if (sessionStatus === "checking") {
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
        <div className="mb-4">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <UserAppView
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            orderCreated={orderCreated}
            setOrderCreated={setOrderCreated}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
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
