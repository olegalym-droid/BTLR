import { useEffect, useState } from "react";
import { adminLoginRequest } from "../lib/admin";
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

  const loginWithCredentials = async (adminLogin, adminPassword) => {
    await adminLoginRequest({
      login: adminLogin,
      password: adminPassword,
    });

    localStorage.setItem("admin_login", adminLogin);
    localStorage.setItem("admin_password", adminPassword);

    await Promise.all([
      loadPendingMasters(adminLogin, adminPassword),
      loadComplaints(adminLogin, adminPassword),
      loadWithdrawalRequests(adminLogin, adminPassword),
    ]);

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
      await approveMasterAction(masterId, setIsLoading);
    } catch (error) {
      alert(error.message || "Не удалось одобрить мастера");
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      return await updateComplaintStatusAction(
        complaintId,
        status,
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
    const storedLogin = localStorage.getItem("admin_login");
    const storedPassword = localStorage.getItem("admin_password");

    if (!storedLogin || !storedPassword) {
      return;
    }

    let isMounted = true;

    const autoLogin = async () => {
      try {
        setIsLoading(true);

        await Promise.all([
          loadPendingMasters(storedLogin, storedPassword),
          loadComplaints(storedLogin, storedPassword),
          loadWithdrawalRequests(storedLogin, storedPassword),
        ]);

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