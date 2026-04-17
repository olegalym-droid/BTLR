import AuthGate from "./AuthGate";
import UserAppView from "./UserAppView";
import AdminAppView from "./AdminAppView";
import MasterAppView from "./MasterAppView";

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
    complaints,
    withdrawalRequests,
    successText: adminSuccessText,
    handleApproveMaster,
    isLoading: isAdminLoading,
    logout: adminLogout,
    loginWithCredentials,
    updateComplaintStatus,
    updateWithdrawalStatus,
  } = adminState;

  if (!selectedRole) {
    return (
      <AuthGate
        handleAuthSuccess={handleAuthSuccess}
        setSelectedRole={setSelectedRole}
        setIsAuthenticated={setIsAuthenticated}
        loginWithCredentials={loginWithCredentials}
      />
    );
  }

  if (selectedRole === "master") {
    return (
      <MasterAppView
        setIsAuthenticated={setIsAuthenticated}
        setSelectedRole={setSelectedRole}
      />
    );
  }

  if (selectedRole === "admin") {
    return (
      <AdminAppView
        isAdminLoggedIn={isAdminLoggedIn}
        pendingMasters={pendingMasters}
        selectedMaster={selectedMaster}
        setSelectedMaster={setSelectedMaster}
        complaints={complaints}
        withdrawalRequests={withdrawalRequests}
        adminSuccessText={adminSuccessText}
        handleApproveMaster={handleApproveMaster}
        isAdminLoading={isAdminLoading}
        adminLogout={adminLogout}
        loginWithCredentials={loginWithCredentials}
        updateComplaintStatus={updateComplaintStatus}
        updateWithdrawalStatus={updateWithdrawalStatus}
        setSelectedRole={setSelectedRole}
        handleAuthSuccess={handleAuthSuccess}
        setIsAuthenticated={setIsAuthenticated}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        handleAuthSuccess={handleAuthSuccess}
        setSelectedRole={setSelectedRole}
        setIsAuthenticated={setIsAuthenticated}
        loginWithCredentials={loginWithCredentials}
      />
    );
  }

  return (
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
    />
  );
}