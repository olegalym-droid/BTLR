import { useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
} from "../../lib/auth";
import { formatPhoneInput } from "../../lib/profile";

export default function MasterPlaceholderScreen({ onBack }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successText, setSuccessText] = useState("");

  const handleSubmit = async () => {
    if (!phone || !password) {
      alert("Заполни все обязательные поля");
      return;
    }

    if (phone.length < 12) {
      alert("Введите корректный номер телефона");
      return;
    }

    if (password.length < 6) {
      alert("Пароль должен быть не короче 6 символов");
      return;
    }

    if (mode === "register" && !fullName.trim()) {
      alert("Введите имя");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    try {
      setIsLoading(true);
      setSuccessText("");

      let authData;

      if (mode === "register") {
        authData = await registerRequest({
          role: "master",
          phone,
          password,
          fullName,
        });
      } else {
        authData = await loginRequest({
          role: "master",
          phone,
          password,
        });
      }

      saveAuthData(authData);
      setSuccessText(
        mode === "register"
          ? "Мастер успешно зарегистрирован"
          : "Вход мастера выполнен",
      );
    } catch (error) {
      alert(error.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="rounded-3xl border bg-white p-6 shadow space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-black">
            {mode === "login" ? "Вход для мастера" : "Регистрация мастера"}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === "login"
              ? "Войдите в аккаунт мастера"
              : "Создайте аккаунт мастера"}
          </p>
        </div>

        {mode === "register" && (
          <input
            type="text"
            placeholder="Ваше имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border p-3 text-black"
            maxLength={50}
          />
        )}

        <input
          type="text"
          placeholder="Номер телефона"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          className="w-full rounded-lg border p-3 text-black"
          inputMode="tel"
          maxLength={16}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border p-3 text-black"
          maxLength={50}
        />

        {mode === "register" && (
          <input
            type="password"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border p-3 text-black"
            maxLength={50}
          />
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-2xl bg-black py-4 text-base font-medium text-white disabled:opacity-60"
        >
          {isLoading
            ? "Загрузка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setSuccessText("");
          }}
          className="text-sm text-gray-600 underline"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>

        {successText && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">
            {successText}
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
          Пока кабинет мастера не реализован. На этом шаге мы подключили
          настоящую регистрацию и вход для роли master.
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl border border-gray-300 bg-white py-4 text-base font-medium text-black"
        >
          Назад
        </button>
      </div>
    </div>
  );
}