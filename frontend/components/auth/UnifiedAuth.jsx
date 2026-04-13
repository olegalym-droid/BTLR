import { useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
} from "../../lib/auth";
import { formatPhoneInput } from "../../lib/profile";
import { AVAILABLE_CATEGORIES } from "../master/masterConstants";

export default function UnifiedAuth({
  onUserOrMasterSuccess,
  onAdminSuccess,
}) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const resetCommonFields = () => {
    setFullName("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setAdminLogin("");
    setSelectedCategories([]);
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setMode(nextRole === "admin" ? "login" : "login");
    resetCommonFields();
  };

  const handleModeChange = (nextMode) => {
    if (role === "admin" && nextMode === "register") {
      return;
    }

    setMode(nextMode);
    setFullName("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setSelectedCategories([]);
  };

  const validate = () => {
    if (role === "admin") {
      if (!adminLogin.trim() || !password.trim()) {
        alert("Заполните логин и пароль");
        return false;
      }
      return true;
    }

    if (!phone.trim() || !password.trim()) {
      alert("Заполните телефон и пароль");
      return false;
    }

    if (phone.length < 12) {
      alert("Введите корректный номер телефона");
      return false;
    }

    if (password.length < 6) {
      alert("Пароль должен быть не короче 6 символов");
      return false;
    }

    if (mode === "register") {
      if (!fullName.trim()) {
        alert("Введите имя");
        return false;
      }

      if (password !== confirmPassword) {
        alert("Пароли не совпадают");
        return false;
      }

      if (role === "master" && selectedCategories.length === 0) {
        alert("Выберите хотя бы одну категорию");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);

      if (role === "admin") {
        await onAdminSuccess(adminLogin.trim(), password.trim());
        return;
      }

      let authData;

      if (mode === "register") {
        authData = await registerRequest({
          role,
          phone,
          password,
          fullName,
          categories: role === "master" ? selectedCategories : [],
        });
      } else {
        authData = await loginRequest({
          role,
          phone,
          password,
        });
      }

      saveAuthData(authData);
      onUserOrMasterSuccess(authData.role);
    } catch (error) {
      alert(error.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-black">BTLR</h1>
          <p className="text-sm text-gray-600">
            Единый вход и регистрация
          </p>
        </div>

        <div className="grid grid-cols-3 rounded-2xl border p-1 bg-gray-50">
          <button
            type="button"
            onClick={() => handleRoleChange("user")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              role === "user" ? "bg-black text-white" : "text-black"
            }`}
          >
            Пользователь
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("master")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              role === "master" ? "bg-black text-white" : "text-black"
            }`}
          >
            Мастер
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              role === "admin" ? "bg-black text-white" : "text-black"
            }`}
          >
            Админ
          </button>
        </div>

        {role !== "admin" && (
          <div className="grid grid-cols-2 rounded-2xl border p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                mode === "login" ? "bg-black text-white" : "text-black"
              }`}
            >
              Вход
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                mode === "register" ? "bg-black text-white" : "text-black"
              }`}
            >
              Регистрация
            </button>
          </div>
        )}

        {role === "admin" ? (
          <>
            <input
              type="text"
              value={adminLogin}
              onChange={(e) => setAdminLogin(e.target.value)}
              placeholder="Логин администратора"
              className="w-full rounded-lg border p-3 text-black"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full rounded-lg border p-3 text-black"
            />
          </>
        ) : (
          <>
            {mode === "register" && (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === "master" ? "Имя мастера" : "Ваше имя"}
                className="w-full rounded-lg border p-3 text-black"
                maxLength={50}
              />
            )}

            <input
              type="text"
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
                placeholder="Повторите пароль"
                className="w-full rounded-lg border p-3 text-black"
                maxLength={50}
              />
            )}

            {mode === "register" && role === "master" && (
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
          </>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {isLoading
            ? "Загрузка..."
            : role === "admin"
              ? "Войти как администратор"
              : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
        </button>
      </div>
    </div>
  );
}