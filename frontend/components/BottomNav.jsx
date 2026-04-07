export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center">
      <div className="w-full max-w-md bg-white border-t shadow-md">
        <div className="grid grid-cols-3">
          <button
            onClick={() => onTabChange("services")}
            className={`py-4 text-sm font-medium ${
              activeTab === "services" ? "text-black" : "text-gray-500"
            }`}
          >
            Услуги
          </button>

          <button
            onClick={() => onTabChange("orders")}
            className={`py-4 text-sm font-medium ${
              activeTab === "orders" ? "text-black" : "text-gray-500"
            }`}
          >
            Мои заказы
          </button>

          <button
            onClick={() => onTabChange("profile")}
            className={`py-4 text-sm font-medium ${
              activeTab === "profile" ? "text-black" : "text-gray-500"
            }`}
          >
            Профиль
          </button>
        </div>
      </div>
    </div>
  );
}