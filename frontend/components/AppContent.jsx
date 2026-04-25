import { useEffect, useRef, useState } from "react";
import AuthGate from "./AuthGate";
import UserAppView from "./UserAppView";
import { API_BASE_URL } from "../lib/constants";
import { getStoredAuthUser } from "../lib/auth";

export default function AppContent({
  session,
  ordersState,
  orderForm,
  profileState,
  adminState,
  categories,
  availableServices,
  createOrder,
  getStatusLabel,
  handleLogout,
  formatPhoneInput,
}) {
  const {
    selectedRole,
    setSelectedRole,
    isAuthenticated,
    setIsAuthenticated,
    activeTab,
    setActiveTab,
    handleAuthSuccess,
  } = session;

  const {
    orderCreated,
    setOrderCreated,
    selectedOrder,
    setSelectedOrder,
    updateSelectedOrder,
    activeOrders,
    completedOrders,
  } = ordersState;

  const {
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
  } = orderForm;

  const {
    profile,
    setProfile,
    newAddressForm,
    setNewAddressForm,
    profileSaved,
    addAddress,
    removeAddress,
    setPrimaryAddress,
    saveProfile,
    onOpenOrder,
  } = profileState;

  const { loginWithCredentials } = adminState;

  const [toastNotification, setToastNotification] = useState(null);
  const previousTopNotificationIdRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (selectedRole !== "user" || !isAuthenticated) {
      previousTopNotificationIdRef.current = null;

      const resetToastTimer = setTimeout(() => {
        setToastNotification(null);
      }, 0);

      return () => clearTimeout(resetToastTimer);
    }

    const authUser = getStoredAuthUser("user");

    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications?user_id=${authUser.id}`,
        );
        const data = await response.json();

        if (!response.ok || !Array.isArray(data) || !data.length) {
          return;
        }

        if (!isMounted) return;

        const topNotification = data[0];

        if (
          previousTopNotificationIdRef.current &&
          topNotification.id !== previousTopNotificationIdRef.current &&
          !topNotification.is_read
        ) {
          setToastNotification(topNotification);

          if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
          }

          toastTimerRef.current = setTimeout(() => {
            setToastNotification(null);
          }, 4500);
        }

        previousTopNotificationIdRef.current = topNotification.id;
      } catch (error) {
        console.error("Ошибка загрузки toast-уведомлений:", error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [selectedRole, isAuthenticated]);

  const handleToastOpen = () => {
    if (!toastNotification) return;

    if (toastNotification.order_id && typeof onOpenOrder === "function") {
      onOpenOrder(toastNotification.order_id);
    }

    setToastNotification(null);
  };

  const authGate = (
    <AuthGate
      handleAuthSuccess={handleAuthSuccess}
      setSelectedRole={setSelectedRole}
      setIsAuthenticated={setIsAuthenticated}
      loginWithCredentials={loginWithCredentials}
    />
  );

  if (selectedRole === "master") {
    return <SilentRedirect to="/master" />;
  }

  if (selectedRole === "admin") {
    return <SilentRedirect to="/admin" />;
  }

  return (
    <div className="relative">
      {toastNotification && selectedRole === "user" && isAuthenticated && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <div className="rounded-2xl border border-black bg-black p-4 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-sm font-semibold">Новое уведомление</p>
                </div>

                <p className="mt-2 break-words text-base font-bold [overflow-wrap:anywhere]">
                  {toastNotification.title}
                </p>

                <p className="mt-1 break-words text-sm text-white/80 [overflow-wrap:anywhere]">
                  {toastNotification.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="shrink-0 rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              {toastNotification.order_id && (
                <button
                  type="button"
                  onClick={handleToastOpen}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
                >
                  Открыть
                </button>
              )}

              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedRole && authGate}

      {selectedRole === "user" && !isAuthenticated && authGate}

      {selectedRole === "user" && isAuthenticated && (
        <UserAppView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
          setProfile={setProfile}
          newAddressForm={newAddressForm}
          setNewAddressForm={setNewAddressForm}
          profileSaved={profileSaved}
          addAddress={addAddress}
          removeAddress={removeAddress}
          setPrimaryAddress={setPrimaryAddress}
          saveProfile={saveProfile}
          handleLogout={handleLogout}
          formatPhoneInput={formatPhoneInput}
          onOpenOrder={onOpenOrder}
        />
      )}
    </div>
  );
}

function SilentRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}
