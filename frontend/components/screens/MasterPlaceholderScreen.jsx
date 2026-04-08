import { useEffect, useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
  getStoredAuthUser,
  loadMasterProfileRequest,
  clearAuthData,
} from "../../lib/auth";
import {
  loadAvailableOrdersRequest,
  assignOrderToMasterRequest,
} from "../../lib/orders";
import { formatPhoneInput } from "../../lib/profile";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function MasterPlaceholderScreen({ onBack }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [masterProfile, setMasterProfile] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [successText, setSuccessText] = useState("");

  const loadAvailableOrders = async () => {
    try {
      setIsOrdersLoading(true);
      const orders = await loadAvailableOrdersRequest();
      setAvailableOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
      setAvailableOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const loadMasterData = async (masterId) => {
    try {
      const profile = await loadMasterProfileRequest(masterId);
      setMasterProfile(profile);
      await loadAvailableOrders();
      return profile;
    } catch (error) {
      console.error("Ошибка загрузки мастера:", error);
      throw error;
    }
  };

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (authUser?.id && authUser.role === "master") {
      (async () => {
        try {
          await loadMasterData(authUser.id);
          setIsLoggedIn(true);
        } catch (error) {
          alert(error.message || "Не удалось загрузить кабинет мастера");
        }
      })();
    }
  }, []);

  const validateForm = () => {
    if (!phone || !password) {
      alert("Заполни телефон и пароль");
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
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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
      await loadMasterData(authData.id);
      setIsLoggedIn(true);

      if (mode === "register") {
        setSuccessText("Регистрация мастера выполнена");
      } else {
        setSuccessText("Вход мастера выполнен");
      }
    } catch (error) {
      console.error("Ошибка авторизации мастера:", error);
      alert(error.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeOrder = async (orderId) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      const updatedOrder = await assignOrderToMasterRequest(
        orderId,
        masterProfile.id,
      );

      setAvailableOrders((prev) =>
        prev.filter((order) => order.id !== updatedOrder.id),
      );

      setSuccessText("Заказ успешно принят");
    } catch (error) {
      console.error("Ошибка принятия заказа:", error);
      alert(error.message || "Не удалось взять заказ");
    }
  };

  const logout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setMasterProfile(null);
    setAvailableOrders([]);
    setPhone("");
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setSuccessText("");
    setMode("login");
  };

  if (isLoggedIn) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow space-y-3">
          <h1 className="text-2xl font-bold text-black">Кабинет мастера</h1>

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
            {masterProfile?.verification_status === "pending"
              ? "На проверке"
              : masterProfile?.verification_status === "approved"
                ? "Подтвержден"
                : masterProfile?.verification_status || "Неизвестно"}
          </p>

          <p className="text-sm text-gray-700">
            <span className="font-medium text-black">Рейтинг:</span>{" "}
            {masterProfile?.rating ?? 0}
          </p>

          <p className="text-sm text-gray-700">
            <span className="font-medium text-black">Выполнено заказов:</span>{" "}
            {masterProfile?.completed_orders_count ?? 0}
          </p>

          {successText && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successText}
            </div>
          )}

          <button
            onClick={logout}
            className="w-full rounded-xl border py-3 text-black"
          >
            Выйти
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-black">
              Доступные заказы
            </h2>

            <button
              type="button"
              onClick={loadAvailableOrders}
              className="rounded-xl border px-3 py-2 text-sm text-black"
            >
              Обновить
            </button>
          </div>

          {isOrdersLoading && (
            <p className="text-sm text-gray-600">Загрузка заказов...</p>
          )}

          {!isOrdersLoading && availableOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-gray-600">
              Сейчас доступных заказов нет
            </div>
          )}

          <div className="space-y-3">
            {availableOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border p-4 space-y-3"
              >
                <p className="font-semibold text-black">{order.service_name}</p>
                <p className="text-sm text-gray-700">{order.category}</p>
                <p className="text-sm text-gray-800">{order.description}</p>

                {order.photos?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {order.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={`${API_BASE_URL}/${photo.file_path}`}
                        alt="Фото заявки"
                        className="h-28 w-full rounded-xl border object-cover"
                      />
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-700">
                  <span className="font-medium text-black">Адрес:</span>{" "}
                  {order.address}
                </p>

                <p className="text-sm text-gray-700">
                  <span className="font-medium text-black">Дата:</span>{" "}
                  {order.scheduled_at}
                </p>

                <button
                  onClick={() => handleTakeOrder(order.id)}
                  className="mt-2 w-full rounded-xl bg-black py-3 text-white"
                >
                  Взять заказ
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setSuccessText("");
          }}
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