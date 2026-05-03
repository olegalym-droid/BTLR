import { AVAILABLE_CATEGORIES } from "./masterConstants";
import { formatPhoneInput } from "../../lib/profile";

const INPUT_CLASSNAME =
  "w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-gray-500 outline-none focus:border-black";
const SECONDARY_BUTTON_CLASSNAME =
  "w-full rounded-xl border border-gray-400 bg-white py-3 text-sm font-semibold text-black transition hover:bg-gray-50";

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
  const nameParts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const updateFullName = (nextFirstName, nextLastName) => {
    setFullName(`${nextFirstName.trim()} ${nextLastName.trim()}`.trim());
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-gray-300 bg-white p-6 shadow">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-black">
            {mode === "login" ? "Вход мастера" : "Регистрация мастера"}
          </h1>
          <p className="text-sm font-medium text-gray-700">
            {mode === "login"
              ? "Войдите в кабинет мастера"
              : "Заполните данные для регистрации мастера"}
          </p>
        </div>

        {successText && (
          <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-semibold text-green-800">
            {successText}
          </div>
        )}

        <div className="grid grid-cols-2 rounded-2xl border border-gray-300 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "login" ? "bg-black text-white" : "text-black"
            }`}
          >
            Вход
          </button>

          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "register" ? "bg-black text-white" : "text-black"
            }`}
          >
            Регистрация
          </button>
        </div>

        {mode === "register" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => updateFullName(e.target.value, lastName)}
              placeholder="Имя"
              className={INPUT_CLASSNAME}
              maxLength={50}
            />

            <input
              type="text"
              value={lastName}
              onChange={(e) => updateFullName(firstName, e.target.value)}
              placeholder="Фамилия"
              className={INPUT_CLASSNAME}
              maxLength={50}
            />
          </div>
        )}

        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="Телефон"
          className={INPUT_CLASSNAME}
          inputMode="tel"
          maxLength={16}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className={INPUT_CLASSNAME}
          maxLength={50}
        />

        {mode === "register" && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повтор пароля"
            className={INPUT_CLASSNAME}
            maxLength={50}
          />
        )}

        {mode === "register" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-black">
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
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-black hover:border-gray-400"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-gray-300 bg-gray-50 p-3 text-xs font-medium text-gray-700">
              Выбрано категорий:{" "}
              <span className="font-bold text-black">
                {selectedCategories.length}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {isLoading
            ? "Загрузка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-sm font-semibold text-gray-800 underline underline-offset-2"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className={SECONDARY_BUTTON_CLASSNAME}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
