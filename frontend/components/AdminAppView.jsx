import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";

export default function AdminAppView({
  isAdminLoggedIn,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  adminSuccessText,
  handleApproveMaster,
  isAdminLoading,
  adminLogout,
  loginWithCredentials,
  updateComplaintStatus,
  updateWithdrawalStatus,
  setSelectedRole,
}) {
  const handleLogin = async (login, password) => {
    await loginWithCredentials(login, password);
  };

  const handleLogout = () => {
    adminLogout();

    if (typeof setSelectedRole === "function") {
      setSelectedRole(null);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <AdminLogin
        onLogin={handleLogin}
        isLoading={isAdminLoading}
      />
    );
  }

  return (
    <AdminDashboard
      pendingMasters={pendingMasters}
      selectedMaster={selectedMaster}
      setSelectedMaster={setSelectedMaster}
      complaints={complaints}
      withdrawalRequests={withdrawalRequests}
      successText={adminSuccessText}
      isLoading={isAdminLoading}
      handleApproveMaster={handleApproveMaster}
      updateComplaintStatus={updateComplaintStatus}
      updateWithdrawalStatus={updateWithdrawalStatus}
      logout={handleLogout}
    />
  );
}