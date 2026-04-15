import OrderDetails from "./OrderDetails";
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import OrdersScreen from "./screens/OrdersScreen";
import SuccessScreen from "./screens/SuccessScreen";

export default function UserAppView({
  activeTab,
  setActiveTab,
  orderCreated,
  setOrderCreated,
  selectedOrder,
  setSelectedOrder,
  updateSelectedOrder,
  activeOrders,
  completedOrders,
  categories,
  category,
  setCategory,
  serviceName,
  setServiceName,
  availableServices,
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
  createOrder,
  getStatusLabel,
  profile,
  setProfile,
  newAddressForm,
  setNewAddressForm,
  profileSaved,
  addAddress,
  removeAddress,
  setPrimaryAddress,
  saveProfile,
  handleLogout,
  formatPhoneInput,
}) {
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