"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "../BottomNav";
import AppContent from "../AppContent";
import { servicesByCategory } from "../../lib/constants";
import { formatPhoneInput } from "../../lib/profile";
import { getStatusLabel } from "../../lib/orders";
import useOrders from "../../hooks/useOrders";
import useProfile from "../../hooks/useProfile";
import useOrderForm from "../../hooks/useOrderForm";
import { getStoredAuthUser, clearAuthData } from "../../lib/auth";

const EMPTY_ADMIN_STATE = {
  login: "",
  setLogin: () => {},
  password: "",
  setPassword: () => {},
  isLoading: false,
  isLoggedIn: false,
  pendingMasters: [],
  selectedMaster: null,
  setSelectedMaster: () => {},
  complaints: [],
  withdrawalRequests: [],
  successText: "",
  handleLogin: async () => {},
  handleApproveMaster: async () => {},
  loadPendingMasters: async () => [],
  loadComplaints: async () => [],
  loadWithdrawalRequests: async () => [],
  loginWithCredentials: async () => {},
  updateComplaintStatus: async () => {},
  updateWithdrawalStatus: async () => {},
  logout: () => {},
};

export default function UserAppShell({
  initialTab = "services",
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAuthReady, setIsAuthReady] = useState(false);

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
    setProfile,
    address: profileAddress,
    newAddressForm,
    setNewAddressForm,
    profileSaved,
    saveProfile,
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

  const availableServices = useMemo(() => {
    return category ? servicesByCategory[category] || [] : [];
  }, [category]);

  useEffect(() => {
    const authUser = getStoredAuthUser("user");

    if (!authUser?.id || authUser.role !== "user") {
      window.location.replace("/");
      return;
    }

    syncProfileFromStorage();

    const timer = window.setTimeout(() => setIsAuthReady(true), 0);
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
  };

  const handleTabChange = async (tab) => {
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

    setActiveTab("orders");
    setOrderCreated(false);

    const freshOrders = [...orders];
    let foundOrder = freshOrders.find((item) => item.id === orderId);

    if (!foundOrder) {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/orders/${orderId}?user_id=${authUser.id}`,
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

    window.location.href = "/";
  };

  if (!isAuthReady) {
    return <main className="min-h-screen bg-gray-100" />;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mb-4">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <AppContent
            session={{
              selectedRole: "user",
              setSelectedRole: () => {},
              isAuthenticated: true,
              setIsAuthenticated: () => {},
              activeTab,
              setActiveTab,
              handleAuthSuccess: () => {},
            }}
            ordersState={{
              orderCreated,
              setOrderCreated,
              selectedOrder,
              setSelectedOrder,
              updateSelectedOrder,
              activeOrders,
              completedOrders,
            }}
            orderForm={{
              category,
              setCategory,
              serviceName,
              setServiceName,
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
            }}
            profileState={{
              profile,
              setProfile,
              newAddressForm,
              setNewAddressForm,
              profileSaved,
              addAddress,
              removeAddress,
              setPrimaryAddress,
              saveProfile,
              onOpenOrder: handleOpenOrderFromNotification,
            }}
            adminState={EMPTY_ADMIN_STATE}
            categories={categories}
            availableServices={availableServices}
            createOrder={createOrder}
            getStatusLabel={getStatusLabel}
            handleLogout={handleLogout}
            formatPhoneInput={formatPhoneInput}
          />
        </div>
      </div>
    </main>
  );
}
