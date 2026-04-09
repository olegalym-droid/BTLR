export default function MasterProfileSection({
  masterProfile,
  fullName,
  setFullName,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  workDistrict,
  setWorkDistrict,
  handleSaveMasterProfile,
  successText,
  logout,
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-3">
      <h1 className="text-2xl font-bold text-black">Кабинет мастера</h1>

      <p className="text-sm text-gray-700">
        <span className="font-medium text-black">Имя:</span>{" "}
        {masterProfile?.full_name || "Без имени"}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-medium text-black">Телефон:</span>{" "}
        {masterProfile?.phone || "Не указан"}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-medium text-black">Статус проверки:</span>{" "}
        {masterProfile?.verification_status === "pending"
          ? "На проверке"
          : masterProfile?.verification_status === "approved"
            ? "Подтвержден"
            : masterProfile?.verification_status || "Неизвестно"}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-medium text-black">Рейтинг:</span>{" "}
        {masterProfile?.rating ?? 0}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-medium text-black">Выполнено заказов:</span>{" "}
        {masterProfile?.completed_orders_count ?? 0}
      </p>

      {masterProfile?.master_categories?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-black">Категории:</p>
          <div className="flex flex-wrap gap-2">
            {masterProfile.master_categories.map((item) => (
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

      <div className="space-y-3 rounded-2xl border p-4">
        <h2 className="text-lg font-semibold text-black">Мой профиль</h2>

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Имя"
          className="w-full rounded-lg border p-3 text-black"
          maxLength={50}
        />

        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="О себе"
          className="w-full rounded-lg border p-3 text-black min-h-[100px]"
          maxLength={500}
        />

        <input
          type="number"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="Стаж (лет)"
          className="w-full rounded-lg border p-3 text-black"
          min="0"
        />

        <input
          value={workCity}
          onChange={(e) => setWorkCity(e.target.value)}
          placeholder="Город работы"
          className="w-full rounded-lg border p-3 text-black"
          maxLength={100}
        />

        <input
          value={workDistrict}
          onChange={(e) => setWorkDistrict(e.target.value)}
          placeholder="Район работы"
          className="w-full rounded-lg border p-3 text-black"
          maxLength={100}
        />

        <button
          type="button"
          onClick={handleSaveMasterProfile}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Сохранить профиль
        </button>
      </div>

      {successText && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successText}
        </div>
      )}

      <button
        onClick={logout}
        className="w-full rounded-xl border py-3 text-black"
      >
        Выйти
      </button>
    </div>
  );
}
