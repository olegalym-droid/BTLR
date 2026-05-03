import { useCallback, useEffect, useState } from "react";
import { adminLoginRequest } from "../lib/admin";
import {
  clearAdminSession,
  getStoredAdminSession,
  saveAdminSession,
} from "../lib/session";
import useAdminData from "./useAdminData";

export default function useAdminCabinet({ onLogout } = {}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [startupError, setStartupError] = useState("");

  const {
    adminOverview,
    adminActionLogs,
    pendingMasters,
    selectedMaster,
    setSelectedMaster,
    complaints,
    withdrawalRequests,
    successText,
    setSuccessText,
    loadAdminOverview,
    loadAdminActionLogs,
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    handleApproveMaster: approveMasterAction,
    updateComplaintStatus: updateComplaintStatusAction,
    updateWithdrawalStatus: updateWithdrawalStatusAction,
    resetAdminDataState,
  } = useAdminData();

  const loginWithCredentials = useCallback(async (adminLogin, adminPassword) => {
    await adminLoginRequest({
      login: adminLogin,
      password: adminPassword,
    });

    saveAdminSession(adminLogin, adminPassword);
    setStartupError("");

    await Promise.all([
      loadPendingMasters(adminLogin, adminPassword),
      loadAdminOverview(adminLogin, adminPassword),
      loadAdminActionLogs(adminLogin, adminPassword),
      loadComplaints(adminLogin, adminPassword),
      loadWithdrawalRequests(adminLogin, adminPassword),
    ]);

    setIsLoggedIn(true);
    setSuccessText("Вход администратора выполнен");
  }, [
    loadComplaints,
    loadAdminActionLogs,
    loadAdminOverview,
    loadPendingMasters,
    loadWithdrawalRequests,
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
      throw error;
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
      const timer = window.setTimeout(() => {
        setIsSessionChecking(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    let isMounted = true;

    const autoLogin = async () => {
      try {
        setIsLoading(true);

        await Promise.all([
          loadPendingMasters(stored.login, stored.password),
          loadAdminOverview(stored.login, stored.password),
          loadAdminActionLogs(stored.login, stored.password),
          loadComplaints(stored.login, stored.password),
          loadWithdrawalRequests(stored.login, stored.password),
        ]);

        if (!isMounted) return;

        saveAdminSession(stored.login, stored.password);
        setStartupError("");
        setLogin(stored.login);
        setPassword(stored.password);
        setIsLoggedIn(true);
      } catch (error) {
        if (!isMounted) return;

        console.warn("Не удалось автоматически загрузить админку:", error);
        saveAdminSession(stored.login, stored.password);
        setStartupError(error.message || "Не удалось загрузить админку");
        setLogin(stored.login);
        setPassword(stored.password);
        setIsLoggedIn(true);
        setSuccessText(
          "Данные админки временно не загрузились. Сессия сохранена, обновите страницу после запуска сервера.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsSessionChecking(false);
        }
      }
    };

    autoLogin();

    return () => {
      isMounted = false;
    };
  }, [
    loadComplaints,
    loadAdminActionLogs,
    loadAdminOverview,
    loadPendingMasters,
    loadWithdrawalRequests,
    setSuccessText,
  ]);

  const logout = () => {
    clearAdminSession();
    setLogin("");
    setPassword("");
    setIsLoggedIn(false);
    setStartupError("");
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
    isSessionChecking,
    startupError,
    adminOverview,
    adminActionLogs,
    pendingMasters,
    selectedMaster,
    setSelectedMaster,
    complaints,
    withdrawalRequests,
    successText,
    handleLogin,
    handleApproveMaster,
    loadAdminOverview,
    loadAdminActionLogs,
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    loginWithCredentials,
    updateComplaintStatus,
    updateWithdrawalStatus,
    logout,
  };
}
