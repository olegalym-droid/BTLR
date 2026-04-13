export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { key: "services", label: "Услуги" },
    { key: "orders", label: "Мои заказы" },
    { key: "profile", label: "Профиль" },
  ];

  return (
    <div className="mt-4">
      <div className="w-full rounded-2xl border border-gray-200 bg-white shadow">
        <div className="grid grid-cols-3 gap-1 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`rounded-xl px-2 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}