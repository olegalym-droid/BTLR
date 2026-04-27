import { useCallback, useEffect, useState } from "react";
import { adminLoginRequest } from "../lib/admin";
import { clearAuthData } from "../lib/auth";
import useAdminData from "./useAdminData";

export default function useAdminCabinet({ onLogout }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const {
    pendingMasters,
    selectedMaster,
    setSelectedMaster,
    complaints,
    withdrawalRequests,
    successText,
    setSuccessText,
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    handleApproveMaster: approveMasterAction,
    updateComplaintStatus: updateComplaintStatusAction,
    updateWithdrawalStatus: updateWithdrawalStatusAction,
    resetAdminDataState,
  } = useAdminData();

  const saveAdminSession = useCallback((adminLogin, adminPassword) => {
    if (typeof window === "undefined") {
      return;
    }

    clearAuthData("user");
    clearAuthData("master");

    window.localStorage.removeItem("app_selected_role");
    window.localStorage.removeItem("app_active_tab");

    window.sessionStorage.setItem("admin_login", adminLogin);
    window.sessionStorage.setItem("admin_password", adminPassword);

    window.localStorage.removeItem("admin_login");
    window.localStorage.removeItem("admin_password");
  }, []);

  const clearAdminSession = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem("admin_login");
    window.sessionStorage.removeItem("admin_password");

    window.localStorage.removeItem("admin_login");
    window.localStorage.removeItem("admin_password");
  }, []);

  const getStoredAdminSession = useCallback(() => {
    if (typeof window === "undefined") {
      return {
        login: "",
        password: "",
      };
    }

    return {
      login:
        window.sessionStorage.getItem("admin_login") ||
        window.localStorage.getItem("admin_login") ||
        "",
      password:
        window.sessionStorage.getItem("admin_password") ||
        window.localStorage.getItem("admin_password") ||
        "",
    };
  }, []);

  const loginWithCredentials = useCallback(async (adminLogin, adminPassword) => {
    await adminLoginRequest({
      login: adminLogin,
      password: adminPassword,
    });

    saveAdminSession(adminLogin, adminPassword);

    await Promise.all([
      loadPendingMasters(adminLogin, adminPassword),
      loadComplaints(adminLogin, adminPassword),
      loadWithdrawalRequests(adminLogin, adminPassword),
    ]);

    setIsLoggedIn(true);
    setSuccessText("Вход администратора выполнен");
  }, [
    loadComplaints,
    loadPendingMasters,
    loadWithdrawalRequests,
    saveAdminSession,
    setSuccessText,
  ]);

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
      await approveMasterAction(masterId, setIsLoading);
    } catch (error) {
      alert(error.message || "Не удалось одобрить мастера");
    }
  };

  const updateComplaintStatus = async (complaintId, statusOrPayload) => {
    try {
      return await updateComplaintStatusAction(
        complaintId,
        statusOrPayload,
        setIsLoading,
      );
    } catch (error) {
      alert(error.message || "Не удалось обновить статус жалобы");
      throw error;
    }
  };

  const updateWithdrawalStatus = async (withdrawalId, status) => {
    try {
      return await updateWithdrawalStatusAction(
        withdrawalId,
        status,
        setIsLoading,
      );
    } catch (error) {
      alert(error.message || "Не удалось обновить статус заявки на вывод");
      throw error;
    }
  };

  useEffect(() => {
    const stored = getStoredAdminSession();

    if (!stored.login || !stored.password) {
      return;
    }

    let isMounted = true;

    const autoLogin = async () => {
      try {
        setIsLoading(true);

        await Promise.all([
          loadPendingMasters(stored.login, stored.password),
          loadComplaints(stored.login, stored.password),
          loadWithdrawalRequests(stored.login, stored.password),
        ]);

        if (!isMounted) return;

        saveAdminSession(stored.login, stored.password);
        setLogin(stored.login);
        setPassword(stored.password);
        setIsLoggedIn(true);
      } catch (error) {
        if (!isMounted) return;

        console.warn("Не удалось автоматически загрузить админку:", error);
        saveAdminSession(stored.login, stored.password);
        setLogin(stored.login);
        setPassword(stored.password);
        setIsLoggedIn(true);
        setSuccessText(
          "Данные админки временно не загрузились. Сессия сохранена, обновите страницу после запуска сервера.",
        );
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
  }, [
    clearAdminSession,
    getStoredAdminSession,
    loadComplaints,
    loadPendingMasters,
    loadWithdrawalRequests,
    saveAdminSession,
    setSuccessText,
  ]);

  const logout = () => {
    clearAdminSession();
    setLogin("");
    setPassword("");
    setIsLoggedIn(false);
    resetAdminDataState();

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
    complaints,
    withdrawalRequests,
    successText,
    handleLogin,
    handleApproveMaster,
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    loginWithCredentials,
    updateComplaintStatus,
    updateWithdrawalStatus,
    logout,
  };
}
