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
  loadMasterOrdersRequest,
  assignOrderToMasterRequest,
  updateOrderStatusByMasterRequest,
  getStatusLabel,
} from "../../lib/orders";
import { formatPhoneInput } from "../../lib/profile";

const API_BASE_URL = "http://127.0.0.1:8000";

const AVAILABLE_CATEGORIES = [
  "Сантехника",
  "Электрика",
  "Уборка",
  "Окна и двери",
  "Сборка мебели",
  "Ремонт",
];

export default function MasterPlaceholderScreen({ onBack, onLogout }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [masterProfile, setMasterProfile] = useState(null);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [masterOrders, setMasterOrders] = useState([]);

  const [isAvailableLoading, setIsAvailableLoading] = useState(false);
  const [isMasterOrdersLoading, setIsMasterOrdersLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [openedPhoto, setOpenedPhoto] = useState(null);

  const loadAvailableOrders = async (masterId) => {
    try {
      setIsAvailableLoading(true);
      const resolvedMasterId =
        masterId || masterProfile?.id || getStoredAuthUser()?.id;

      if (!resolvedMasterId) {
        throw new Error("Мастер не авторизован");
      }

      const orders = await loadAvailableOrdersRequest(resolvedMasterId);
      setAvailableOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки доступных заказов:", error);
      setAvailableOrders([]);
    } finally {
      setIsAvailableLoading(false);
    }
  };

  const loadMasterOrders = async (masterId) => {
    try {
      setIsMasterOrdersLoading(true);
      const orders = await loadMasterOrdersRequest(masterId);
      setMasterOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки заказов мастера:", error);
      setMasterOrders([]);
    } finally {
      setIsMasterOrdersLoading(false);
    }
  };

  const loadMasterData = async (masterId) => {
    try {
      const profile = await loadMasterProfileRequest(masterId);
      setMasterProfile(profile);

      await Promise.all([
        loadAvailableOrders(masterId),
        loadMasterOrders(masterId),
      ]);

      return profile;
    } catch (error) {
      console.error("Ошибка загрузки мастера:", error);
      throw error;
    }
  };

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (authUser?.id && authUser.role === "master") {
      loadMasterData(authUser.id)
        .then(() => setIsLoggedIn(true))
        .catch((error) =>
          alert(error.message || "Не удалось загрузить кабинет мастера"),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

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

      if (selectedCategories.length === 0) {
        alert("Выберите хотя бы одну категорию");
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
          categories: selectedCategories,
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

      await assignOrderToMasterRequest(orderId, masterProfile.id);

      await Promise.all([
        loadAvailableOrders(masterProfile.id),
        loadMasterOrders(masterProfile.id),
      ]);

      setSuccessText("Заказ успешно принят");
    } catch (error) {
      console.error("Ошибка принятия заказа:", error);
      alert(error.message || "Не удалось взять заказ");
    }
  };

  const handleMasterStatusChange = async (orderId, status) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      const updatedOrder = await updateOrderStatusByMasterRequest({
        orderId,
        status,
        masterId: masterProfile.id,
      });

      setMasterOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? { ...updatedOrder } : order,
        ),
      );

      if (status === "on_the_way") {
        setSuccessText("Статус обновлён: мастер выехал");
      } else if (status === "on_site") {
        setSuccessText("Статус обновлён: мастер на месте");
      } else if (status === "completed") {
        setSuccessText("Заказ завершён");
      } else {
        setSuccessText("Статус заказа обновлён");
      }
    } catch (error) {
      console.error("Ошибка смены статуса:", error);
      alert(error.message || "Не удалось обновить статус");
    }
  };

  const logout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setMasterProfile(null);
    setAvailableOrders([]);
    setMasterOrders([]);
    setPhone("");
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setSelectedCategories([]);
    setSuccessText("");
    setMode("login");

    if (onLogout) {
      onLogout();
    }
  };

  const renderOrderPhotos = (order) => {
    if (!order.photos?.length) return null;

    return (
      <div className="grid grid-cols-2 gap-2">
        {order.photos.map((photo) => {
          const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenedPhoto(photoUrl)}
              className="block"
            >
              <img
                src={photoUrl}
                alt="Фото заявки"
                className="h-28 w-full rounded-xl border object-cover"
              />
            </button>
          );
        })}
      </div>
    );
  };

  const renderMasterOrderAction = (order) => {
    if (order.status === "assigned") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "on_the_way")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Выехал
        </button>
      );
    }

    if (order.status === "on_the_way") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "on_site")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          На месте
        </button>
      );
    }

    if (order.status === "on_site") {
      return (
        <button
          onClick={() => handleMasterStatusChange(order.id, "completed")}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Завершить
        </button>
      );
    }

    if (order.status === "completed") {
      return (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Ожидает оплату от пользователя
        </div>
      );
    }

    if (order.status === "paid") {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Заказ оплачен
        </div>
      );
    }

    return null;
  };

  if (isLoggedIn) {
    return (
      <>
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

            {masterProfile?.master_categories?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">Категории:</p>
                <div className="flex flex-wrap gap-2">
                  {masterProfile.master_categories.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800"
                    >
                      {item.category_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                onClick={() => loadAvailableOrders(masterProfile?.id)}
                className="rounded-xl border px-3 py-2 text-sm text-black"
              >
                Обновить
              </button>
            </div>

            {isAvailableLoading && (
              <p className="text-sm text-gray-600">Загрузка заказов...</p>
            )}

            {!isAvailableLoading && availableOrders.length === 0 && (
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-black">
                        {order.service_name}
                      </p>
                      <p className="text-sm text-gray-700">{order.category}</p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800">{order.description}</p>

                  {renderOrderPhotos(order)}

                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-black">Адрес:</span>{" "}
                    {order.address}
                  </p>

                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-black">Дата:</span>{" "}
                    {order.scheduled_at}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTakeOrder(order.id)}
                      className="w-full rounded-xl bg-black py-3 text-white"
                    >
                      Взять заказ
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAvailableOrders((prev) =>
                          prev.filter((item) => item.id !== order.id),
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 py-3 text-black"
                    >
                      Пропустить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-black">Мои заказы</h2>

              <button
                type="button"
                onClick={() =>
                  masterProfile?.id && loadMasterOrders(masterProfile.id)
                }
                className="rounded-xl border px-3 py-2 text-sm text-black"
              >
                Обновить
              </button>
            </div>

            {isMasterOrdersLoading && (
              <p className="text-sm text-gray-600">
                Загрузка заказов мастера...
              </p>
            )}

            {!isMasterOrdersLoading && masterOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-gray-600">
                У вас пока нет принятых заказов
              </div>
            )}

            <div className="space-y-3">
              {masterOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-black">
                        {order.service_name}
                      </p>
                      <p className="text-sm text-gray-700">{order.category}</p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800">{order.description}</p>

                  {renderOrderPhotos(order)}

                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-black">Адрес:</span>{" "}
                    {order.address}
                  </p>

                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-black">Дата:</span>{" "}
                    {order.scheduled_at}
                  </p>

                  {order.price && (
                    <p className="text-sm font-medium text-black">
                      Сумма: {order.price}
                    </p>
                  )}

                  {renderMasterOrderAction(order)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {openedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setOpenedPhoto(null)}
          >
            <img
              src={openedPhoto}
              alt="Открытое фото"
              className="max-h-[90vh] max-w-[90vw] rounded-xl"
            />
          </div>
        )}
      </>
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
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setSuccessText("");
            setSelectedCategories([]);
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
