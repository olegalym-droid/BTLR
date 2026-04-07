import ServiceCategoryPicker from "./ServiceCategoryPicker";
import ServiceOptionPicker from "./ServiceOptionPicker";

export default function CreateOrderForm({
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
      <ServiceCategoryPicker
        categories={categories}
        category={category}
        setCategory={setCategory}
        setServiceName={setServiceName}
      />

      {category && (
        <ServiceOptionPicker
          category={category}
          availableServices={availableServices}
          serviceName={serviceName}
          setServiceName={setServiceName}
        />
      )}

      {serviceName && (
        <div className="border rounded-2xl bg-white shadow p-4 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Детали заявки</h2>
            <p className="text-sm text-gray-500 mt-1">
              Коротко опишите задачу и выберите время
            </p>
          </div>

          <textarea
            placeholder="Что нужно сделать"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg p-3 min-h-[110px]"
          />

          <input
            type="text"
            placeholder="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <div className="grid grid-cols-1 gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="time"
              step="1800"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border rounded-lg p-3 bg-white"
            />
          </div>

          <button
            onClick={createOrder}
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Отправить заявку
          </button>
        </div>
      )}
    </div>
  );
}