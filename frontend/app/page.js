"use client";

import { useEffect, useMemo } from "react";
import BottomNav from "../components/BottomNav";
import AppContent from "../components/AppContent";
import { servicesByCategory } from "../lib/constants";
import { formatPhoneInput } from "../lib/profile";
import { getStatusLabel } from "../lib/orders";
import useOrders from "../hooks/useOrders";
import useProfile from "../hooks/useProfile";
import useOrderForm from "../hooks/useOrderForm";
import useAppSession from "../hooks/useAppSession";
import useAdminCabinet from "../hooks/useAdminCabinet";
import { getStoredAuthUser } from "../lib/auth";

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    selectedRole,
    setSelectedRole,
    isAuthenticated,
    setIsAuthenticated,
    logoutSession,
  } = useAppSession();

  const adminState = useAdminCabinet({
    onLogout: () => {},
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
    const nextPrimaryAddress =
      profile.addresses[profile.primaryAddressIndex] || "";

    setAddress((currentAddress) =>
      currentAddress ? currentAddress : nextPrimaryAddress,
    );
  }, [profile, setAddress]);

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (authUser?.id && authUser?.role) {
      setIsAuthenticated(true);
      setSelectedRole(authUser.role);
      return;
    }

    if (typeof window !== "undefined") {
      const adminLogin =
        window.sessionStorage.getItem("admin_login") ||
        window.localStorage.getItem("admin_login");
      const adminPassword =
        window.sessionStorage.getItem("admin_password") ||
        window.localStorage.getItem("admin_password");

      if (adminLogin && adminPassword) {
        setSelectedRole("admin");
      }
    }
  }, [setIsAuthenticated, setSelectedRole]);

  const handleAuthSuccess = () => {
    const authUser = getStoredAuthUser();

    syncProfileFromStorage();
    setIsAuthenticated(true);
    setOrderCreated(false);
    setSelectedOrder(null);
    setActiveTab("services");

    if (authUser?.role) {
      setSelectedRole(authUser.role);
    }
  };

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

    const authUser = getStoredAuthUser();
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
    logoutSession();
    setSelectedOrder(null);
    setOrderCreated(false);
  };

  const showBottomNav = selectedRole === "user" && isAuthenticated;

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {showBottomNav && (
          <div className="mb-4">
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        )}

        <div className="rounded-2xl bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 lg:p-6">
          <AppContent
            session={{
              selectedRole,
              setSelectedRole,
              isAuthenticated,
              setIsAuthenticated,
              activeTab,
              setActiveTab,
              handleAuthSuccess,
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
            adminState={adminState}
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