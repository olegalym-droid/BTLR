import { useCallback, useState } from "react";
import {
  loadPendingMastersRequest,
  loadComplaintsRequest,
  loadWithdrawalRequestsRequest,
  approveMasterRequest,
  updateComplaintStatusRequest,
  updateWithdrawalStatusRequest,
} from "../lib/admin";

export default function useAdminData() {
  const [pendingMasters, setPendingMasters] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [successText, setSuccessText] = useState("");

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

      await loadPendingMasters();
      setSelectedMaster(null);
      setSuccessText("Мастер успешно одобрен");
    } finally {
      setIsLoading(false);
    }
  }, [loadPendingMasters]);

  const updateComplaintStatus = useCallback(async (complaintId, status, setIsLoading) => {
    try {
      setIsLoading(true);
      setSuccessText("");

      const data = await updateComplaintStatusRequest({
        complaintId,
        status,
      });

      setComplaints((prev) =>
        prev.map((item) =>
          item.id === complaintId ? { ...item, status: data.status } : item,
        ),
      );

      const statusTextMap = {
        new: "Жалоба помечена как новая",
        in_progress: "Жалоба взята в работу",
        resolved: "Жалоба решена",
        rejected: "Жалоба отклонена",
      };

      setSuccessText(statusTextMap[data.status] || "Статус жалобы обновлён");

      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, []);

  const resetAdminDataState = useCallback(() => {
    setPendingMasters([]);
    setSelectedMaster(null);
    setComplaints([]);
    setWithdrawalRequests([]);
    setSuccessText("");
  }, []);

  return {
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
    loadPendingMasters,
    loadComplaints,
    loadWithdrawalRequests,
    handleApproveMaster,
    updateComplaintStatus,
    updateWithdrawalStatus,
    resetAdminDataState,
  };
}
