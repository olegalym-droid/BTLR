import { useState } from "react";
import {
  loadPendingMastersRequest,
  loadComplaintsRequest,
  approveMasterRequest,
  updateComplaintStatusRequest,
} from "../lib/admin";

export default function useAdminData() {
  const [pendingMasters, setPendingMasters] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [successText, setSuccessText] = useState("");

  const loadPendingMasters = async (
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
  };

  const loadComplaints = async (
    adminLoginArg = null,
    adminPasswordArg = null,
  ) => {
    const data = await loadComplaintsRequest(adminLoginArg, adminPasswordArg);
    setComplaints(data);
    return data;
  };

  const handleApproveMaster = async (masterId, setIsLoading) => {
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
  };

  const updateComplaintStatus = async (complaintId, status, setIsLoading) => {
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
  };

  const resetAdminDataState = () => {
    setPendingMasters([]);
    setSelectedMaster(null);
    setComplaints([]);
    setSuccessText("");
  };

  return {
    pendingMasters,
    setPendingMasters,
    selectedMaster,
    setSelectedMaster,
    complaints,
    setComplaints,
    successText,
    setSuccessText,
    loadPendingMasters,
    loadComplaints,
    handleApproveMaster,
    updateComplaintStatus,
    resetAdminDataState,
  };
}