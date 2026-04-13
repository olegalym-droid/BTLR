import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function useAdminCabinet({ onLogout }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingMasters, setPendingMasters] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [successText, setSuccessText] = useState("");

  const getAdminHeaders = (adminLoginArg, adminPasswordArg) => {
    const storedLogin =
      adminLoginArg || localStorage.getItem("admin_login") || "";
    const storedPassword =
      adminPasswordArg || localStorage.getItem("admin_password") || "";

    return {
      "X-Admin-Login": storedLogin,
      "X-Admin-Password": storedPassword,
    };
  };

  const loadPendingMasters = async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const response = await fetch(`${API_BASE_URL}/admin/masters/pending`, {
      headers: getAdminHeaders(adminLoginArg, adminPasswordArg),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Не удалось загрузить мастеров");
    }

    setPendingMasters(Array.isArray(data) ? data : []);

    setSelectedMaster((prev) => {
      if (!prev) return null;
      return data.find((item) => item.id === prev.id) || null;
    });

    return data;
  };

  const loginWithCredentials = async (adminLogin, adminPassword) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: adminLogin,
        password: adminPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Ошибка входа администратора");
    }

    localStorage.setItem("admin_login", adminLogin);
    localStorage.setItem("admin_password", adminPassword);

    await loadPendingMasters(adminLogin, adminPassword);
    setIsLoggedIn(true);
    setSuccessText("Вход администратора выполнен");
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setSuccessText("");
      await loginWithCredentials(login, password);
    } catch (error) {
      alert(error.message || "Не удалось войти");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveMaster = async (masterId) => {
    try {
      setIsLoading(true);
      setSuccessText("");

      const response = await fetch(
        `${API_BASE_URL}/admin/masters/${masterId}/approve`,
        {
          method: "PUT",
          headers: getAdminHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Не удалось одобрить мастера");
      }

      await loadPendingMasters();
      setSelectedMaster(null);
      setSuccessText("Мастер успешно одобрен");
    } catch (error) {
      alert(error.message || "Не удалось одобрить мастера");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedLogin = localStorage.getItem("admin_login");
    const storedPassword = localStorage.getItem("admin_password");

    if (!storedLogin || !storedPassword) {
      return;
    }

    let isMounted = true;

    const autoLogin = async () => {
      try {
        setIsLoading(true);
        await loadPendingMasters(storedLogin, storedPassword);

        if (!isMounted) return;

        setLogin(storedLogin);
        setPassword(storedPassword);
        setIsLoggedIn(true);
      } catch (error) {
        if (!isMounted) return;

        localStorage.removeItem("admin_login");
        localStorage.removeItem("admin_password");
        setIsLoggedIn(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    autoLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_login");
    localStorage.removeItem("admin_password");
    setLogin("");
    setPassword("");
    setIsLoggedIn(false);
    setPendingMasters([]);
    setSelectedMaster(null);
    setSuccessText("");

    if (onLogout) {
      onLogout();
    }
  };

  return {
    login,
    setLogin,
    password,
    setPassword,
    isLoading,
    isLoggedIn,
    pendingMasters,
    selectedMaster,
    setSelectedMaster,
    successText,
    handleLogin,
    handleApproveMaster,
    loadPendingMasters,
    loginWithCredentials,
    logout,
  };
}