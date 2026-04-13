import CreateOrderForm from "../CreateOrderForm";

export default function ServicesScreen({
  categories,
  category,
  setCategory,
  serviceName,
  setServiceName,
  availableServices,
  description,
  setDescription,
  address,
  setAddress,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  createOrder,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-black">Услуги</h1>
        <p className="mt-1 text-sm text-gray-700">
          Выберите категорию, услугу и заполните заявку
        </p>
      </div>

      <CreateOrderForm
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
        createOrder={createOrder}
      />
    </div>
  );
}