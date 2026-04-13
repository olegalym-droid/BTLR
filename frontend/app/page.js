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
    const adminLogin = localStorage.getItem("admin_login");
    const adminPassword = localStorage.getItem("admin_password");

    if (authUser?.id && authUser?.role) {
      setIsAuthenticated(true);
      setSelectedRole(authUser.role);
      return;
    }

    if (adminLogin && adminPassword) {
      setSelectedRole("admin");
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

  const showBottomNav = selectedRole === "user" && isAuthenticated;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto w-full max-w-md px-4 py-4">
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
          adminState={adminState}
          categories={categories}
          availableServices={availableServices}
          createOrder={createOrder}
          getStatusLabel={getStatusLabel}
          handleLogout={handleLogout}
          formatPhoneInput={formatPhoneInput}
        />

        {showBottomNav && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}