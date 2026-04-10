import { API_BASE_URL } from "./masterConstants";

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
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  handleApproveProfile,
  hasUploadedAllDocuments,
  isDocumentsLoading,
  isApproveLoading,
}) {
  const isApproved = masterProfile?.verification_status === "approved";
  const profilePhotoUrl = masterProfile?.selfie_photo_path
    ? `${API_BASE_URL}/${masterProfile.selfie_photo_path}`
    : null;

  return (
    <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
      <h1 className="text-2xl font-bold text-black">Кабинет мастера</h1>

      <div className="flex flex-col items-center gap-3 rounded-2xl border p-4">
        <label className="cursor-pointer">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt="Фото мастера"
              className="h-28 w-28 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border bg-gray-100 text-sm text-gray-500 text-center px-3">
              Нажмите, чтобы добавить фото
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelfiePhoto(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <p className="text-sm text-gray-700 text-center">
          Нажмите на фото, чтобы {profilePhotoUrl ? "изменить" : "добавить"}{" "}
          аватар
        </p>

        {selfiePhoto && (
          <p className="text-xs text-gray-700">Выбрано: {selfiePhoto.name}</p>
        )}

        <button
          type="button"
          onClick={handleUploadDocuments}
          disabled={isDocumentsLoading || !selfiePhoto}
          className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {isDocumentsLoading ? "Загрузка..." : "Сохранить фото профиля"}
        </button>
      </div>

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
        />

        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="О себе"
          className="w-full rounded-lg border p-3 text-black min-h-[100px]"
        />

        <input
          type="number"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="Стаж (лет)"
          className="w-full rounded-lg border p-3 text-black"
        />

        <input
          value={workCity}
          onChange={(e) => setWorkCity(e.target.value)}
          placeholder="Город работы"
          className="w-full rounded-lg border p-3 text-black"
        />

        <input
          value={workDistrict}
          onChange={(e) => setWorkDistrict(e.target.value)}
          placeholder="Район работы"
          className="w-full rounded-lg border p-3 text-black"
        />

        <button
          type="button"
          onClick={handleSaveMasterProfile}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Сохранить профиль
        </button>
      </div>

      {!isApproved && (
        <div className="rounded-2xl border border-gray-300 bg-white p-4 space-y-3">
          <h3 className="text-lg font-semibold text-black">Проверка профиля</h3>

          <p className="text-sm text-gray-700">
            Загрузите документы для подтверждения личности:
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">
              Удостоверение — лицевая сторона
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIdCardFront(e.target.files?.[0] || null)}
              className="block w-full text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
            />
            {idCardFront && (
              <p className="text-xs text-gray-700">{idCardFront.name}</p>
            )}
            {!idCardFront && masterProfile?.id_card_front_path && (
              <p className="text-xs text-green-700">Файл уже загружен</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">
              Удостоверение — обратная сторона
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIdCardBack(e.target.files?.[0] || null)}
              className="block w-full text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
            />
            {idCardBack && (
              <p className="text-xs text-gray-700">{idCardBack.name}</p>
            )}
            {!idCardBack && masterProfile?.id_card_back_path && (
              <p className="text-xs text-green-700">Файл уже загружен</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">
              Фото лица
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelfiePhoto(e.target.files?.[0] || null)}
              className="block w-full text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
            />
            {selfiePhoto && (
              <p className="text-xs text-gray-700">{selfiePhoto.name}</p>
            )}
            {!selfiePhoto && masterProfile?.selfie_photo_path && (
              <p className="text-xs text-green-700">Файл уже загружен</p>
            )}
          </div>

          <button
            onClick={handleUploadDocuments}
            disabled={isDocumentsLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
          >
            {isDocumentsLoading ? "Загрузка..." : "Загрузить документы"}
          </button>

          {hasUploadedAllDocuments && (
            <button
              onClick={handleApproveProfile}
              disabled={isApproveLoading}
              className="w-full rounded-xl bg-green-600 py-3 text-white disabled:opacity-60"
            >
              {isApproveLoading ? "Подтверждение..." : "Подтвердить профиль"}
            </button>
          )}
        </div>
      )}

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
