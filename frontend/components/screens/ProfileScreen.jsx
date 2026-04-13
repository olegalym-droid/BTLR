export default function ProfileScreen({
  profile,
  setProfile,
  newAddressForm,
  setNewAddressForm,
  profileSaved,
  addAddress,
  removeAddress,
  setPrimaryAddress,
  saveProfile,
  handleLogout,
  formatPhoneInput,
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
        <p className="text-sm text-gray-700">
          Контакты и адреса для быстрого оформления заявок
        </p>
      </div>

      <div className="rounded-3xl border border-gray-300 bg-white p-5 shadow space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Имя</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-2xl border p-4 text-black"
            placeholder="Введите имя"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Телефон</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                phone: formatPhoneInput(e.target.value),
              }))
            }
            className="w-full rounded-2xl border p-4 text-black"
            placeholder="+7 777 123 45 67"
            inputMode="tel"
          />
          <p className="text-xs text-gray-500">
            Вводите номер в международном формате
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-black">Адреса</p>
            <p className="text-xs text-gray-500">
              Заполните адрес по частям, так он будет понятнее и удобнее
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={newAddressForm.city}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              className="w-full rounded-2xl border p-4 text-black"
              placeholder="Город"
              maxLength={50}
            />

            <input
              type="text"
              value={newAddressForm.street}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  street: e.target.value,
                }))
              }
              className="w-full rounded-2xl border p-4 text-black"
              placeholder="Улица"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newAddressForm.house}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    house: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border p-4 text-black"
                placeholder="Дом"
                maxLength={10}
              />

              <input
                type="text"
                value={newAddressForm.apartment}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    apartment: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border p-4 text-black"
                placeholder="Квартира"
                maxLength={10}
              />
            </div>

            <button
              type="button"
              onClick={addAddress}
              className="w-full rounded-2xl bg-black px-4 py-4 text-white font-medium"
            >
              Добавить адрес
            </button>
          </div>

          {profile.addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              Адреса пока не добавлены
            </div>
          ) : (
            <div className="space-y-3">
              {profile.addresses.map((item, index) => {
                const isPrimary = index === profile.primaryAddressIndex;

                return (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-2xl border border-gray-300 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-black break-words">{item}</p>

                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="shrink-0 text-sm text-red-600"
                      >
                        Удалить
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrimaryAddress(index)}
                      className={`w-full rounded-xl border py-3 text-sm font-medium transition ${
                        isPrimary
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    >
                      {isPrimary ? "Основной адрес" : "Сделать основным"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={saveProfile}
          className="w-full rounded-2xl bg-black px-4 py-4 text-white font-medium"
        >
          Сохранить профиль
        </button>

        {profileSaved && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Профиль сохранён
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-black"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}