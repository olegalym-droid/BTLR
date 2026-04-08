import { useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
} from "../../lib/auth";
import { formatPhoneInput } from "../../lib/profile";

export default function UserAuth({ onBack, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      let authData;

      if (mode === "register") {
        authData = await registerRequest({
          role: "user",
          phone,
          password,
          fullName,
        });
      } else {
        authData = await loginRequest({
          role: "user",
          phone,
          password,
        });
      }

      saveAuthData(authData);
      onSuccess();
    } catch (error) {
      alert(error.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="rounded-3xl bg-white border shadow p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-black">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === "login"
              ? "Войдите в аккаунт"
              : "Создайте аккаунт пользователя"}
          </p>
        </div>

        {mode === "register" && (
          <input
            type="text"
            placeholder="Ваше имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
            maxLength={50}
          />
        )}

        <input
          type="text"
          placeholder="Номер телефона"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          className="w-full border rounded-lg p-3 text-black"
          inputMode="tel"
          maxLength={16}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg p-3 text-black"
          maxLength={50}
        />

        {mode === "register" && (
          <input
            type="password"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
            maxLength={50}
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-60"
        >
          {isLoading
            ? "Загрузка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          type="button"
          className="text-sm text-gray-600 underline"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>

        <button onClick={onBack} className="w-full border py-3 rounded-lg">
          Назад
        </button>
      </div>
    </div>
  );
}