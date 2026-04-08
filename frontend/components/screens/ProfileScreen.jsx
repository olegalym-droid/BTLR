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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
        <p className="mt-1 text-sm text-gray-700">
          Контакты и адреса для быстрого оформления заявок
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-4 shadow">
        <div className="space-y-2">
          <label className="text-sm text-gray-700">Имя</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-lg border p-3 text-black"
            placeholder="Введите имя"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-700">Телефон</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                phone: formatPhoneInput(e.target.value),
              }))
            }
            className="w-full rounded-lg border p-3 text-black"
            placeholder="+7 777 123 45 67"
            inputMode="tel"
          />
          <p className="text-xs text-gray-500">
            Вводите номер в международном формате
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700">Адреса</p>
            <p className="mt-1 text-xs text-gray-500">
              Заполните адрес по частям, так пользователю будет понятнее
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              value={newAddressForm.city}
              onChange={(e) =>
                setNewAddressForm((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              className="w-full rounded-lg border p-3 text-black"
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
              className="w-full rounded-lg border p-3 text-black"
              placeholder="Улица"
              maxLength={80}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newAddressForm.house}
                onChange={(e) =>
                  setNewAddressForm((prev) => ({
                    ...prev,
                    house: e.target.value,
                  }))
                }
                className="w-full rounded-lg border p-3 text-black"
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
                className="w-full rounded-lg border p-3 text-black"
                placeholder="Квартира"
                maxLength={10}
              />
            </div>

            <button
              type="button"
              onClick={addAddress}
              className="w-full rounded-lg bg-black px-4 py-3 text-white"
            >
              Добавить адрес
            </button>
          </div>

          {profile.addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-3 text-sm text-gray-600">
              Адреса пока не добавлены
            </div>
          ) : (
            <div className="space-y-2">
              {profile.addresses.map((item, index) => {
                const isPrimary = index === profile.primaryAddressIndex;

                return (
                  <div
                    key={`${item}-${index}`}
                    className="flex flex-col gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-black">{item}</p>

                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="text-sm text-red-600"
                      >
                        Удалить
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrimaryAddress(index)}
                      className={`w-full rounded-lg border py-2 text-sm transition ${
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
          className="w-full rounded-lg bg-black px-4 py-3 text-white"
        >
          Сохранить профиль
        </button>

        {profileSaved && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Профиль сохранён
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}