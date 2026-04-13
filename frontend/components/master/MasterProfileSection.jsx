const API_BASE_URL = "http://127.0.0.1:8000";

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
  handleSaveMasterProfile,
  successText,
  logout,
  avatarFile,
  setAvatarFile,
  handleUploadAvatar,
  isAvatarLoading,
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  hasUploadedAllDocuments,
  isDocumentsLoading,
}) {
  const avatarUrl = masterProfile?.avatar_path
    ? `${API_BASE_URL}/${masterProfile.avatar_path}`
    : null;

  const frontUrl = masterProfile?.id_card_front_path
    ? `${API_BASE_URL}/${masterProfile.id_card_front_path}`
    : null;

  const backUrl = masterProfile?.id_card_back_path
    ? `${API_BASE_URL}/${masterProfile.id_card_back_path}`
    : null;

  const selfieUrl = masterProfile?.selfie_photo_path
    ? `${API_BASE_URL}/${masterProfile.selfie_photo_path}`
    : null;

  const status = masterProfile?.verification_status;
  const isApproved = status === "approved";

  const renderStatus = () => {
    if (status === "approved") {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Профиль подтверждён. Вы можете брать заказы.
        </div>
      );
    }

    if (status === "pending") {
      return (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
          Документы отправлены и ожидают проверки администратором
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        Заполните профиль и загрузите документы для прохождения проверки
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
        <h2 className="text-2xl font-bold text-black">Профиль мастера</h2>

        <div className="space-y-3">
          <div className="flex justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Аватар мастера"
                className="h-28 w-28 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border bg-gray-100 text-sm text-gray-500 text-center px-3">
                Нет аватарки
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />

          {avatarFile && (
            <p className="text-xs text-gray-700">Выбрано: {avatarFile.name}</p>
          )}

          <button
            onClick={handleUploadAvatar}
            disabled={isAvatarLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
          >
            {isAvatarLoading ? "Загрузка..." : "Загрузить аватарку"}
          </button>
        </div>

        {successText && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successText}
          </div>
        )}

        {renderStatus()}

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
          {status === "approved"
            ? "Подтверждён"
            : status === "pending"
              ? "На проверке"
              : status || "Неизвестно"}
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

        <div className="space-y-2">
          <label className="text-sm text-black">Имя</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ФИО"
            className="w-full rounded-lg border p-3 text-black"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black">О себе</label>
          <textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Расскажите о себе"
            className="w-full rounded-lg border p-3 text-black"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black">Опыт (лет)</label>
          <input
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="Например: 3"
            className="w-full rounded-lg border p-3 text-black"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black">Город</label>
          <input
            value={workCity}
            onChange={(e) => setWorkCity(e.target.value)}
            placeholder="Город"
            className="w-full rounded-lg border p-3 text-black"
          />
        </div>

        <button
          onClick={handleSaveMasterProfile}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Сохранить профиль
        </button>

        <button
          onClick={logout}
          className="w-full rounded-xl border border-gray-300 py-3 text-black"
        >
          Выйти
        </button>
      </div>

      {!isApproved && (
        <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
          <h3 className="text-xl font-bold text-black">Документы</h3>

          <div className="space-y-2">
            <label className="text-sm text-black">Удостоверение (лицевая)</label>
            <input
              type="file"
              onChange={(e) => setIdCardFront(e.target.files[0])}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-black">Удостоверение (обратная)</label>
            <input
              type="file"
              onChange={(e) => setIdCardBack(e.target.files[0])}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-black">Фото лица для проверки</label>
            <input
              type="file"
              onChange={(e) => setSelfiePhoto(e.target.files[0])}
            />
          </div>

          <button
            onClick={handleUploadDocuments}
            disabled={isDocumentsLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
          >
            {isDocumentsLoading ? "Загрузка..." : "Загрузить документы"}
          </button>

          {hasUploadedAllDocuments && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-black">
                Загруженные документы:
              </p>

              {frontUrl && (
                <img
                  src={frontUrl}
                  alt="Front"
                  className="w-full rounded-xl border"
                />
              )}

              {backUrl && (
                <img
                  src={backUrl}
                  alt="Back"
                  className="w-full rounded-xl border"
                />
              )}

              {selfieUrl && (
                <img
                  src={selfieUrl}
                  alt="Selfie"
                  className="w-full rounded-xl border"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}