const API_BASE_URL = "http://127.0.0.1:8000";

export default function AdminMastersSection({
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  handleApproveMaster,
  isLoading,
}) {
  const openMaster = (master) => {
    setSelectedMaster(master);
  };

  if (selectedMaster) {
    const frontUrl = selectedMaster.id_card_front_path
      ? `${API_BASE_URL}/${selectedMaster.id_card_front_path}`
      : null;

    const backUrl = selectedMaster.id_card_back_path
      ? `${API_BASE_URL}/${selectedMaster.id_card_back_path}`
      : null;

    const selfieUrl = selectedMaster.selfie_photo_path
      ? `${API_BASE_URL}/${selectedMaster.selfie_photo_path}`
      : null;

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedMaster(null)}
          className="text-sm text-gray-700"
        >
          ← Назад к списку
        </button>

        <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
          <h2 className="text-2xl font-bold text-black">
            Проверка мастера
          </h2>

          <p className="text-sm text-gray-700">
            <span className="font-medium text-black">Имя:</span>{" "}
            {selectedMaster.full_name || "Без имени"}
          </p>

          <p className="text-sm text-gray-700">
            <span className="font-medium text-black">Телефон:</span>{" "}
            {selectedMaster.phone || "Не указан"}
          </p>

          {selectedMaster.master_categories?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-black">Категории:</p>
              <div className="flex flex-wrap gap-2">
                {selectedMaster.master_categories.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800"
                  >
                    {item.category_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {frontUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  Удостоверение — лицевая сторона
                </p>
                <img
                  src={frontUrl}
                  alt="Лицевая сторона удостоверения"
                  className="w-full rounded-xl border object-cover"
                />
              </div>
            )}

            {backUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  Удостоверение — обратная сторона
                </p>
                <img
                  src={backUrl}
                  alt="Обратная сторона удостоверения"
                  className="w-full rounded-xl border object-cover"
                />
              </div>
            )}

            {selfieUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">Фото лица</p>
                <img
                  src={selfieUrl}
                  alt="Фото лица мастера"
                  className="w-full rounded-xl border object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleApproveMaster(selectedMaster.id)}
            disabled={isLoading}
            className="w-full rounded-xl bg-green-600 py-3 text-white disabled:opacity-60"
          >
            {isLoading ? "Подтверждение..." : "Одобрить мастера"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
      <h2 className="text-2xl font-bold text-black">Мастера на проверке</h2>

      {pendingMasters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-400 p-4 text-sm text-gray-700">
          Сейчас нет мастеров, ожидающих проверки
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMasters.map((master) => (
            <button
              key={master.id}
              type="button"
              onClick={() => openMaster(master)}
              className="w-full rounded-2xl border p-4 text-left shadow-sm"
            >
              <p className="text-lg font-semibold text-black">
                {master.full_name || "Без имени"}
              </p>

              <p className="text-sm text-gray-700 mt-1">{master.phone}</p>

              <p className="text-sm text-gray-700 mt-2">
                Статус:{" "}
                {master.verification_status === "pending"
                  ? "На проверке"
                  : master.verification_status}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}