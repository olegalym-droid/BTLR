export default function ServiceCategoryPicker({
  categories,
  category,
  setCategory,
  setServiceName,
}) {
  return (
    <div className="border rounded-2xl bg-white shadow p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Категория</h2>
        <p className="text-sm text-gray-500 mt-1">
          Выберите направление услуги
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setServiceName("");
            }}
            className={`border rounded-xl p-3 text-sm text-left transition ${
              category === item
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}