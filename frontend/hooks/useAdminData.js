import { useCallback, useState } from "react";
import {
  loadAdminActionLogsRequest,
  loadAdminOverviewRequest,
  loadPendingMastersRequest,
  loadComplaintsRequest,
  loadWithdrawalRequestsRequest,
  approveMasterRequest,
  updateComplaintStatusRequest,
  updateWithdrawalStatusRequest,
} from "../lib/admin";

export default function useAdminData() {
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminActionLogs, setAdminActionLogs] = useState([]);
  const [pendingMasters, setPendingMasters] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [successText, setSuccessText] = useState("");

  const loadAdminOverview = useCallback(async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const data = await loadAdminOverviewRequest(
      adminLoginArg,
      adminPasswordArg,
    );

    setAdminOverview(data);
    return data;
  }, []);

  const loadAdminActionLogs = useCallback(async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    try {
      const data = await loadAdminActionLogsRequest(
        adminLoginArg,
        adminPasswordArg,
      );

      setAdminActionLogs(data);
      return data;
    } catch (error) {
      console.warn("Не удалось загрузить журнал админки:", error);
      setAdminActionLogs([]);
      return [];
    }
  }, []);

  const loadPendingMasters = useCallback(async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const data = await loadPendingMastersRequest(
      adminLoginArg,
      adminPasswordArg,
    );

    setPendingMasters(data);

    setSelectedMaster((prev) => {
      if (!prev) return null;
      return data.find((item) => item.id === prev.id) || null;
    });

    return data;
  }, []);

  const loadComplaints = useCallback(async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const data = await loadComplaintsRequest(adminLoginArg, adminPasswordArg);
    setComplaints(data);
    return data;
  }, []);

  const loadWithdrawalRequests = useCallback(async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const data = await loadWithdrawalRequestsRequest(
      adminLoginArg,
      adminPasswordArg,
    );
    setWithdrawalRequests(data);
    return data;
  }, []);

  const handleApproveMaster = useCallback(async (masterId, setIsLoading) => {
    try {
      setIsLoading(true);
      setSuccessText("");

      await approveMasterRequest(masterId);

      await Promise.all([
        loadPendingMasters(),
        loadAdminOverview(),
        loadAdminActionLogs(),
      ]);
      setSelectedMaster(null);
      setSuccessText("Мастер успешно одобрен");
    } finally {
      setIsLoading(false);
    }
  }, [loadAdminActionLogs, loadAdminOverview, loadPendingMasters]);

  const updateComplaintStatus = useCallback(async (
    complaintId,
    statusOrPayload,
    setIsLoading,
  ) => {
    try {
      setIsLoading(true);
      setSuccessText("");

      const updatePayload =
        typeof statusOrPayload === "string"
          ? { status: statusOrPayload }
          : statusOrPayload || {};

      const data = await updateComplaintStatusRequest({
        complaintId,
        status: updatePayload.status,
        resolution: updatePayload.resolution,
        adminComment: updatePayload.adminComment,
      });

      setComplaints((prev) =>
        prev.map((item) =>
          item.id === complaintId ? { ...item, ...data } : item,
        ),
      );
      await Promise.all([loadAdminOverview(), loadAdminActionLogs()]);

      const statusTextMap = {
        new: "Жалоба помечена как новая",
        in_progress: "Жалоба взята в работу",
        needs_details: "По спору запрошены детали",
        resolved: "Жалоба решена",
        rejected: "Жалоба отклонена",
      };

      setSuccessText(statusTextMap[data.status] || "Статус жалобы обновлён");

      return data;
    } finally {
      setIsLoading(false);
    }
  }, [loadAdminActionLogs, loadAdminOverview]);

  const updateWithdrawalStatus = useCallback(async (
    withdrawalId,
    status,
    setIsLoading,
  ) => {
    try {
      setIsLoading(true);
      setSuccessText("");

      const data = await updateWithdrawalStatusRequest({
        withdrawalId,
        status,
      });

      setWithdrawalRequests((prev) =>
        prev.map((item) =>
          item.id === withdrawalId ? { ...item, status: data.status } : item,
        ),
      );
      await Promise.all([loadAdminOverview(), loadAdminActionLogs()]);

      const statusTextMap = {
        approved: "Заявка на вывод одобрена",
        rejected: "Заявка на вывод отклонена",
      };

      setSuccessText(
        statusTextMap[data.status] || "Статус заявки на вывод обновлён",
      );

      return data;
    } finally {
      setIsLoading(false);
    }
  }, [loadAdminActionLogs, loadAdminOverview]);

  const resetAdminDataState = useCallback(() => {
    setAdminOverview(null);
    setAdminActionLogs([]);
    setPendingMasters([]);
    setSelectedMaster(null);
    setComplaints([]);
    setWithdrawalRequests([]);
    setSuccessText("");
  }, []);

  return {
    adminOverview,
    setAdminOverview,
    adminActionLogs,
    setAdminActionLogs,
    pendingMasters,
    setPendingMasters,
    selectedMaster,
    setSelectedMaster,
    complaints,
    setComplaints,
    withdrawalRequests,
    setWithdrawalRequests,
    successText,
    setSuccessText,
    loadAdminOverview,
    loadAdminActionLogs,
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    handleApproveMaster,
    updateComplaintStatus,
    updateWithdrawalStatus,
    resetAdminDataState,
  };
}
