import AdminDashboard from "./admin/AdminDashboard";

export default function AdminAppView({
  isLoggedIn,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  handleApproveMaster,
  isLoading,
  updateComplaintStatus,
  updateWithdrawalStatus,
  logout,
}) {
  if (!isLoggedIn) {
    return null;
  }

  return (
    <AdminDashboard
      pendingMasters={pendingMasters}
      selectedMaster={selectedMaster}
      setSelectedMaster={setSelectedMaster}
      complaints={complaints}
      withdrawalRequests={withdrawalRequests}
      successText={successText}
      isLoading={isLoading}
      handleApproveMaster={handleApproveMaster}
      updateComplaintStatus={updateComplaintStatus}
      updateWithdrawalStatus={updateWithdrawalStatus}
      logout={logout}
    />
  );
}