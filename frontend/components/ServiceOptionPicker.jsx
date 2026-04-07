export default function ServiceOptionPicker({
  category,
  availableServices,
  serviceName,
  setServiceName,
}) {
  return (
    <div className="border rounded-2xl bg-white shadow p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Услуга</h2>
        <p className="text-sm text-gray-500 mt-1">
          Категория: {category}
        </p>
      </div>

      <div className="space-y-2">
        {availableServices.map((service) => (
          <button
            key={service}
            type="button"
            onClick={() => setServiceName(service)}
            className={`w-full border rounded-xl p-3 text-left transition ${
              serviceName === service
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300"
            }`}
          >
            {service}
          </button>
        ))}
      </div>
    </div>
  );
}