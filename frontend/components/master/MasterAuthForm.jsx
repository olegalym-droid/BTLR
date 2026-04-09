import { AVAILABLE_CATEGORIES } from "./masterConstants";
import { formatPhoneInput } from "../../lib/profile";

export default function MasterAuthForm({
  mode,
  setMode,
  phone,
  setPhone,
  fullName,
  setFullName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  selectedCategories,
  toggleCategory,
  handleSubmit,
  isLoading,
  successText,
  onBack,
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow space-y-4">
        <h1 className="text-xl font-bold text-center text-black">
          {mode === "login" ? "Вход мастера" : "Регистрация мастера"}
        </h1>

        {successText && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successText}
          </div>
        )}

        {mode === "register" && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Имя"
            className="w-full rounded-lg border p-3 text-black"
            maxLength={50}
          />
        )}

        <input
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="Телефон"
          className="w-full rounded-lg border p-3 text-black"
          inputMode="tel"
          maxLength={16}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-lg border p-3 text-black"
          maxLength={50}
        />

        {mode === "register" && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повтор пароля"
            className="w-full rounded-lg border p-3 text-black"
            maxLength={50}
          />
        )}

        {mode === "register" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-black">
              Выберите категории услуг
            </p>

            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {isLoading
            ? "Загрузка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-sm underline text-gray-700"
          type="button"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>

        <button
          onClick={onBack}
          className="w-full rounded-xl border py-3 text-black"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
