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
    }
  }, []);

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

  const createOrder = async (photos = []) => {
    const success = await createOrderAction({
      category,
      serviceName,
      description,
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

  const handleLogout = () => {
    resetProfileState();
    resetForm("");
    logoutSession();
    setSelectedOrder(null);
    setOrderCreated(false);
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-50">
      <div className="w-full max-w-md pb-24">
        <div className="p-4 md:p-6">
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
            }}
            categories={categories}
            availableServices={availableServices}
            createOrder={createOrder}
            getStatusLabel={getStatusLabel}
            handleLogout={handleLogout}
            formatPhoneInput={formatPhoneInput}
          />
        </div>

        {selectedRole === "user" && isAuthenticated && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}
