import OrderDetails from "./OrderDetails";
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import OrdersScreen from "./screens/OrdersScreen";
import SuccessScreen from "./screens/SuccessScreen";
import ChatCenter from "./chat/ChatCenter";

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
  userAccountId,
  newAddressForm,
  setNewAddressForm,
  profileSaved,
  addAddress,
  removeAddress,
  setPrimaryAddress,
  handleLogout,
  onOpenOrder,
}) {
  const handleOpenOrderFromNotification = (orderId) => {
    if (typeof onOpenOrder === "function") {
      onOpenOrder(orderId);
      return;
    }

    const allOrders = [...activeOrders, ...completedOrders];
    const matchedOrder = allOrders.find((order) => order.id === orderId);

    setActiveTab("orders");

    if (matchedOrder) {
      setSelectedOrder(matchedOrder);
    }
  };

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
        profile={profile}
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

  if (activeTab === "chats") {
    return <ChatCenter viewerRole="user" accountId={userAccountId} />;
  }

  return (
    <ProfileScreen
      profile={profile}
      newAddressForm={newAddressForm}
      setNewAddressForm={setNewAddressForm}
      profileSaved={profileSaved}
      addAddress={addAddress}
      removeAddress={removeAddress}
      setPrimaryAddress={setPrimaryAddress}
      handleLogout={handleLogout}
      onOpenOrder={handleOpenOrderFromNotification}
    />
  );
}
