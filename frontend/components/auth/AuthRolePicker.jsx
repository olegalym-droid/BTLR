export default function AuthRolePicker({ onSelectRole }) {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="rounded-3xl bg-white border shadow p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">BTLR</h1>
          <p className="text-sm text-gray-600">
            Сервис домашних услуг для жителей и мастеров
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelectRole("user")}
            className="w-full rounded-2xl bg-black text-white py-4 text-base font-medium"
          >
            Войти как пользователь
          </button>

          <button
            type="button"
            onClick={() => onSelectRole("master")}
            className="w-full rounded-2xl border border-gray-300 bg-white text-black py-4 text-base font-medium"
          >
            Войти как мастер
          </button>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          Сначала выберите роль. Затем откроется вход или регистрация для
          выбранного типа аккаунта.
        </div>
      </div>
    </div>
  );
}