import OrderDetails from "./OrderDetails";
import AuthRolePicker from "./auth/AuthRolePicker";
import UserAuth from "./auth/UserAuth";
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import OrdersScreen from "./screens/OrdersScreen";
import SuccessScreen from "./screens/SuccessScreen";
import MasterPlaceholderScreen from "./screens/MasterPlaceholderScreen";

export default function AppContent({
  session,
  ordersState,
  orderForm,
  profileState,
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
    address,
    setAddress,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    photos,
    setPhotos,
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

  if (!selectedRole) {
    return <AuthRolePicker onSelectRole={setSelectedRole} />;
  }

  if (selectedRole === "user" && !isAuthenticated) {
    return (
      <UserAuth
        onBack={() => setSelectedRole(null)}
        onSuccess={handleAuthSuccess || (() => setIsAuthenticated(true))}
      />
    );
  }

  if (selectedRole === "master") {
    return <MasterPlaceholderScreen onBack={() => setSelectedRole(null)} />;
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
        address={address}
        setAddress={setAddress}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        photos={photos}
        setPhotos={setPhotos}
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