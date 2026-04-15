import OrderDetails from "./OrderDetails";
import UnifiedAuth from "./auth/UnifiedAuth";
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import OrdersScreen from "./screens/OrdersScreen";
import SuccessScreen from "./screens/SuccessScreen";
import MasterPlaceholderScreen from "./screens/MasterPlaceholderScreen";
import AdminDashboard from "./admin/AdminDashboard";

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
  } = profileState;

  const {
    isLoggedIn: isAdminLoggedIn,
    pendingMasters,
    selectedMaster,
    setSelectedMaster,
    successText: adminSuccessText,
    handleApproveMaster,
    isLoading: isAdminLoading,
    logout: adminLogout,
    loginWithCredentials,
  } = adminState;

  if (!selectedRole) {
    return (
      <UnifiedAuth
        onUserOrMasterSuccess={(role) => {
          handleAuthSuccess();
          setSelectedRole(role);
          setIsAuthenticated(true);
        }}
        onAdminSuccess={async (login, password) => {
          await loginWithCredentials(login, password);
          setSelectedRole("admin");
        }}
      />
    );
  }

  if (selectedRole === "master") {
    return (
      <MasterPlaceholderScreen
        onBack={() => {
          setIsAuthenticated(false);
          setSelectedRole(null);
        }}
        onLogout={() => {
          setIsAuthenticated(false);
          setSelectedRole(null);
        }}
      />
    );
  }

  if (selectedRole === "admin") {
    if (!isAdminLoggedIn) {
      return (
        <UnifiedAuth
          onUserOrMasterSuccess={(role) => {
            handleAuthSuccess();
            setSelectedRole(role);
            setIsAuthenticated(true);
          }}
          onAdminSuccess={async (login, password) => {
            await loginWithCredentials(login, password);
            setSelectedRole("admin");
          }}
        />
      );
    }

    return (
      <AdminDashboard
        pendingMasters={pendingMasters}
        selectedMaster={selectedMaster}
        setSelectedMaster={setSelectedMaster}
        handleApproveMaster={handleApproveMaster}
        isLoading={isAdminLoading}
        successText={adminSuccessText}
        logout={() => {
          adminLogout();
          setSelectedRole(null);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <UnifiedAuth
        onUserOrMasterSuccess={(role) => {
          handleAuthSuccess();
          setSelectedRole(role);
          setIsAuthenticated(true);
        }}
        onAdminSuccess={async (login, password) => {
          await loginWithCredentials(login, password);
          setSelectedRole("admin");
        }}
      />
    );
  }

  if (orderCreated) {
    return (
      <SuccessScreen
        onGoToOrders={() => {
          setOrderCreated(false);
          setActiveTab("orders");
        }}
        onBackToServices={() => {
          setOrderCreated(false);
          setActiveTab("services");
        }}
      />
    );
  }

  if (selectedOrder) {
    return (
      <OrderDetails
        selectedOrder={selectedOrder}
        getStatusLabel={getStatusLabel}
        onBack={() => setSelectedOrder(null)}
        onStatusChange={updateSelectedOrder}
      />
    );
  }

  if (activeTab === "services") {
    return (
      <ServicesScreen
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
      />
    );
  }

  if (activeTab === "orders") {
    return (
      <OrdersScreen
        activeOrders={activeOrders}
        completedOrders={completedOrders}
        getStatusLabel={getStatusLabel}
        setSelectedOrder={setSelectedOrder}
      />
    );
  }

  return (
    <ProfileScreen
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
    />
  );
}