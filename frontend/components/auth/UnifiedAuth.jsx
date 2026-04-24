"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
  saveRememberedLogin,
  clearRememberedLogin,
} from "../../lib/auth";
import { formatPhoneInput } from "../../lib/profile";
import { AVAILABLE_CATEGORIES } from "../master/masterConstants";

const LOGIN_ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "master", label: "Мастер" },
  { value: "admin", label: "Админ" },
];

const REGISTER_ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "master", label: "Мастер" },
];

const INPUT_CLASSNAME =
  "w-full rounded-2xl border border-[#d7ddd2] bg-white pl-12 pr-12 py-3.5 text-[15px] text-[#20302c] placeholder:text-[#9aa29d] outline-none transition focus:border-[#86ab82] focus:ring-4 focus:ring-[#dfeadb]";

const ICON_CLASSNAME =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7ca16f]";

const TOGGLE_CLASSNAME =
  "absolute right-4 top-1/2 -translate-y-1/2 text-[#7f8785] transition hover:text-[#20302c]";

function TopModeTabs({ mode, setMode }) {
  return (
    <div className="grid grid-cols-2 rounded-2xl border border-[#d7ddd2] bg-[#f8faf7] p-1">
      <button
        type="button"
        onClick={() => setMode("login")}
        className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
          mode === "login"
            ? "bg-[#eef4ea] text-[#6f9a61]"
            : "text-[#707877] hover:text-[#20302c]"
        }`}
      >
        Вход
      </button>

      <button
        type="button"
        onClick={() => setMode("register")}
        className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
          mode === "register"
            ? "bg-[#eef4ea] text-[#6f9a61]"
            : "text-[#707877] hover:text-[#20302c]"
        }`}
      >
        Регистрация
      </button>
    </div>
  );
}

function RoleTabs({ value, onChange, options }) {
  return (
    <div
      className={`grid rounded-2xl border border-[#d7ddd2] bg-white p-1 ${
        options.length === 3 ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {options.map((item) => {
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`rounded-xl px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${
              isActive
                ? "bg-[#eef4ea] text-[#6f9a61]"
                : "text-[#6f7574] hover:text-[#20302c]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Divider({ text = "или" }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[#e3e7e0]" />
      <span className="text-sm font-semibold text-[#8b9290]">{text}</span>
      <div className="h-px flex-1 bg-[#e3e7e0]" />
    </div>
  );
}

function CategoryPicker({ selectedCategories, toggleCategory }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#20302c]">Категории услуг</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {AVAILABLE_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                isSelected
                  ? "border-[#8caf8a] bg-[#eef7ec] text-[#5f8d58]"
                  : "border-[#d8ddd2] bg-white text-[#55605c] hover:border-[#bfc8ba]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BrandPanel({ isAdminLogin }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border p-6 sm:p-8 lg:p-10 ${
        isAdminLogin
          ? "border-[#d6e0df] bg-gradient-to-br from-[#e9f1f0] via-[#dde9e7] to-[#ceded9]"
          : "border-[#dfe6d8] bg-gradient-to-br from-[#edf4e8] via-[#e6f0df] to-[#d9e8d0]"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
      <div
        className={`absolute -bottom-16 -left-12 h-40 w-40 rounded-full blur-2xl ${
          isAdminLogin ? "bg-[#b7cbca]/40" : "bg-[#bdd3b5]/40"
        }`}
      />

      <div className="relative z-10">
        <h1 className="text-4xl font-bold tracking-tight text-[#1b2a28] sm:text-5xl lg:text-6xl">
          BTLR
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-[#50615c] sm:text-lg">
          {isAdminLogin
            ? "Панель администратора для управления платформой, заказами и пользователями."
            : "Сервис для быстрого поиска мастеров и выполнения бытовых задач без лишних сложностей."}
        </p>

        <div className="mt-8 space-y-4">
          {(isAdminLogin
            ? [
                "Контроль заказов и активности пользователей",
                "Работа с жалобами и спорными ситуациями",
                "Управление выплатами мастерам",
              ]
            : [
                "Найдите мастера за пару кликов",
                "Выполняйте заказы или зарабатывайте как мастер",
                "Всё просто, быстро и без лишних действий",
              ]
          ).map((text) => (
            <div key={text} className="rounded-2xl bg-white/60 p-4">
              <p className="text-sm font-medium text-[#29413c]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const getRolePath = (role) => {
  if (role === "user") return "/user";
  if (role === "master") return "/master";
  if (role === "admin") return "/admin";
  return "/";
};

export default function UnifiedAuth({ onUserOrMasterSuccess, onAdminSuccess }) {
  const [mode, setMode] = useState("login");

  const [loginRole, setLoginRole] = useState("user");
  const [registerRole, setRegisterRole] = useState("user");

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [registerFullName, setRegisterFullName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const handleLoginRoleChange = (nextRole) => {
    setLoginRole(nextRole);
    setLoginPhone("");
    setLoginPassword("");
    setAdminLogin("");
    setRememberMe(false);
    clearRememberedLogin();
  };

  const handleRegisterRoleChange = (nextRole) => {
    setRegisterRole(nextRole);
    setSelectedCategories([]);
  };

  const switchToRegister = () => {
    setMode("register");
  };

  const switchToLogin = () => {
    setMode("login");
  };

  const handleRememberChange = () => {
    setRememberMe((prev) => {
      const nextValue = !prev;

      if (!nextValue) {
        clearRememberedLogin();
      }

      return nextValue;
    });
  };

  const handleLoginSubmit = async () => {
    try {
      if (loginRole === "admin") {
        if (!adminLogin.trim() || !loginPassword.trim()) {
          alert("Заполните логин и пароль");
          return;
        }

        setIsLoginLoading(true);
        await onAdminSuccess(adminLogin.trim(), loginPassword.trim());

        saveRememberedLogin({
          role: loginRole,
          phone: "",
          adminLogin,
          rememberMe,
        });

        window.location.href = getRolePath("admin");
        return;
      }

      if (!loginPhone.trim() || !loginPassword.trim()) {
        alert("Заполните телефон и пароль");
        return;
      }

      if (loginPhone.length < 12) {
        alert("Введите корректный номер телефона");
        return;
      }

      setIsLoginLoading(true);

      const authData = await loginRequest({
        role: loginRole,
        phone: loginPhone,
        password: loginPassword,
      });

      saveAuthData(authData, rememberMe);

      saveRememberedLogin({
        role: loginRole,
        phone: loginPhone,
        adminLogin: "",
        rememberMe,
      });

      if (typeof onUserOrMasterSuccess === "function") {
        onUserOrMasterSuccess(authData.role);
      }

      window.location.href = getRolePath(authData.role);
    } catch (error) {
      alert(error.message || "Ошибка входа");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      if (!registerPhone.trim() || !registerPassword.trim()) {
        alert("Заполните телефон и пароль");
        return;
      }

      if (!registerFullName.trim()) {
        alert("Введите имя");
        return;
      }

      if (registerPhone.length < 12) {
        alert("Введите корректный номер телефона");
        return;
      }

      if (registerPassword.length < 6) {
        alert("Пароль должен быть не короче 6 символов");
        return;
      }

      if (registerPassword !== registerConfirmPassword) {
        alert("Пароли не совпадают");
        return;
      }

      if (!acceptedTerms) {
        alert("Подтвердите согласие с условиями использования");
        return;
      }

      if (registerRole === "master" && selectedCategories.length === 0) {
        alert("Выберите хотя бы одну категорию");
        return;
      }

      setIsRegisterLoading(true);

      const authData = await registerRequest({
        role: registerRole,
        phone: registerPhone,
        password: registerPassword,
        fullName: registerFullName,
        categories: registerRole === "master" ? selectedCategories : [],
      });

      saveAuthData(authData, true);

      if (typeof onUserOrMasterSuccess === "function") {
        onUserOrMasterSuccess(authData.role);
      }

      window.location.href = getRolePath(authData.role);
    } catch (error) {
      alert(error.message || "Ошибка регистрации");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const isAdminLogin = mode === "login" && loginRole === "admin";

  const formTitle =
    mode === "login"
      ? isAdminLogin
        ? "Вход администратора"
        : "Вход"
      : "Регистрация";

  const formSubtitle =
    mode === "login"
      ? isAdminLogin
        ? "Авторизуйтесь для доступа к панели администратора"
        : "Войдите в свой аккаунт"
      : "Создайте новый аккаунт";

  const submitButtonText =
    mode === "login"
      ? isAdminLogin
        ? "Войти в админ-панель"
        : "Войти"
      : "Зарегистрироваться";

  return (
    <div className="min-h-[100dvh] bg-[#f3f5f1]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="grid min-h-[calc(100dvh-2rem)] grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          <BrandPanel isAdminLogin={isAdminLogin} />

          <div className="flex">
            <div className="w-full rounded-[32px] border border-[#e7e9e3] bg-[#fbfbfb] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-7 lg:p-8 xl:p-10">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 ${
                  isAdminLogin ? "bg-[#e9f1f0]" : "bg-[#eef2e7]"
                }`}
              >
                {mode === "login" ? (
                  isAdminLogin ? (
                    <ShieldCheck
                      className="h-9 w-9 text-[#648681] sm:h-11 sm:w-11"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <User
                      className="h-9 w-9 text-[#6f9a61] sm:h-11 sm:w-11"
                      strokeWidth={1.75}
                    />
                  )
                ) : (
                  <UserPlus
                    className="h-9 w-9 text-[#6f9a61] sm:h-11 sm:w-11"
                    strokeWidth={1.75}
                  />
                )}
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-3xl font-bold text-[#1f2d2b] sm:text-4xl">
                  {formTitle}
                </h2>
                <p className="mt-2 text-base text-[#7b8385] sm:text-lg">
                  {formSubtitle}
                </p>
              </div>

              <div className="mx-auto mt-6 max-w-xl space-y-5 sm:mt-8">
                <TopModeTabs mode={mode} setMode={setMode} />

                {mode === "login" ? (
                  <>
                    <RoleTabs
                      value={loginRole}
                      onChange={handleLoginRoleChange}
                      options={LOGIN_ROLE_OPTIONS}
                    />

                    {isAdminLogin ? (
                      <>
                        <div className="relative">
                          <ShieldCheck className={ICON_CLASSNAME} size={22} />
                          <input
                            type="text"
                            name="admin_login"
                            autoComplete="off"
                            value={adminLogin}
                            onChange={(e) => setAdminLogin(e.target.value)}
                            placeholder="Логин администратора"
                            className={INPUT_CLASSNAME}
                          />
                        </div>

                        <div className="relative">
                          <Lock className={ICON_CLASSNAME} size={22} />
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            name="admin_password"
                            autoComplete="new-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Пароль"
                            className={INPUT_CLASSNAME}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            className={TOGGLE_CLASSNAME}
                          >
                            {showLoginPassword ? (
                              <EyeOff size={22} />
                            ) : (
                              <Eye size={22} />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Phone className={ICON_CLASSNAME} size={22} />
                          <input
                            type="text"
                            name="login_phone"
                            autoComplete="off"
                            value={loginPhone}
                            onChange={(e) =>
                              setLoginPhone(formatPhoneInput(e.target.value))
                            }
                            placeholder="Телефон"
                            inputMode="tel"
                            maxLength={16}
                            className={INPUT_CLASSNAME}
                          />
                        </div>

                        <div className="relative">
                          <Lock className={ICON_CLASSNAME} size={22} />
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            name="login_password"
                            autoComplete="new-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Пароль"
                            className={INPUT_CLASSNAME}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            className={TOGGLE_CLASSNAME}
                          >
                            {showLoginPassword ? (
                              <EyeOff size={22} />
                            ) : (
                              <Eye size={22} />
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-3 text-sm text-[#4b5653] sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={handleRememberChange}
                          className="h-5 w-5 rounded border-[#b8c4b4] text-[#7da274] focus:ring-[#cfe1c7]"
                        />
                        <span>Запомнить меня</span>
                      </label>

                      <button
                        type="button"
                        className="text-left font-medium text-[#78a06f] transition hover:text-[#5f8d58] sm:text-right"
                      >
                        Забыли пароль?
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoginSubmit}
                      disabled={isLoginLoading}
                      className="w-full rounded-2xl bg-[#8fb18b] px-4 py-3.5 text-lg font-semibold text-white transition hover:bg-[#7fa37b] disabled:opacity-60 sm:text-xl"
                    >
                      {isLoginLoading ? "Вход..." : submitButtonText}
                    </button>

                    <Divider />

                    <button
                      type="button"
                      onClick={switchToRegister}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#8fb18b] bg-white px-4 py-3.5 text-lg font-semibold text-[#7a9f72] transition hover:bg-[#f5faf2] sm:text-xl"
                    >
                      <UserPlus size={24} />
                      Создать аккаунт
                    </button>
                  </>
                ) : (
                  <>
                    <RoleTabs
                      value={registerRole}
                      onChange={handleRegisterRoleChange}
                      options={REGISTER_ROLE_OPTIONS}
                    />

                    <div className="relative">
                      <User className={ICON_CLASSNAME} size={22} />
                      <input
                        type="text"
                        name="register_full_name"
                        autoComplete="off"
                        value={registerFullName}
                        onChange={(e) => setRegisterFullName(e.target.value)}
                        placeholder={
                          registerRole === "master" ? "Имя мастера" : "Ваше имя"
                        }
                        className={INPUT_CLASSNAME}
                        maxLength={50}
                      />
                    </div>

                    <div className="relative">
                      <Phone className={ICON_CLASSNAME} size={22} />
                      <input
                        type="text"
                        name="register_phone"
                        autoComplete="off"
                        value={registerPhone}
                        onChange={(e) =>
                          setRegisterPhone(formatPhoneInput(e.target.value))
                        }
                        placeholder="Телефон"
                        inputMode="tel"
                        maxLength={16}
                        className={INPUT_CLASSNAME}
                      />
                    </div>

                    <div className="relative">
                      <Lock className={ICON_CLASSNAME} size={22} />
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        name="register_password"
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Пароль"
                        className={INPUT_CLASSNAME}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((prev) => !prev)}
                        className={TOGGLE_CLASSNAME}
                      >
                        {showRegisterPassword ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className={ICON_CLASSNAME} size={22} />
                      <input
                        type={
                          showRegisterConfirmPassword ? "text" : "password"
                        }
                        name="register_confirm_password"
                        autoComplete="new-password"
                        value={registerConfirmPassword}
                        onChange={(e) =>
                          setRegisterConfirmPassword(e.target.value)
                        }
                        placeholder="Повторите пароль"
                        className={INPUT_CLASSNAME}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterConfirmPassword((prev) => !prev)
                        }
                        className={TOGGLE_CLASSNAME}
                      >
                        {showRegisterConfirmPassword ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>

                    {registerRole === "master" && (
                      <CategoryPicker
                        selectedCategories={selectedCategories}
                        toggleCategory={toggleCategory}
                      />
                    )}

                    <label className="flex items-start gap-3 text-sm text-[#4b5653]">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={() => setAcceptedTerms((prev) => !prev)}
                        className="mt-0.5 h-5 w-5 rounded border-[#b8c4b4] text-[#7da274] focus:ring-[#cfe1c7]"
                      />
                      <span>
                        Я согласен с{" "}
                        <span className="font-medium text-[#78a06f] underline underline-offset-2">
                          условиями использования
                        </span>
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleRegisterSubmit}
                      disabled={isRegisterLoading}
                      className="w-full rounded-2xl bg-[#8fb18b] px-4 py-3.5 text-lg font-semibold text-white transition hover:bg-[#7fa37b] disabled:opacity-60 sm:text-xl"
                    >
                      {isRegisterLoading ? "Регистрация..." : submitButtonText}
                    </button>

                    <Divider />

                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#8fb18b] bg-white px-4 py-3.5 text-lg font-semibold text-[#7a9f72] transition hover:bg-[#f5faf2] sm:text-xl"
                    >
                      <User size={24} />
                      Уже есть аккаунт? <span className="font-bold">Войти</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}