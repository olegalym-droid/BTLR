import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";

export default function AdminAppView({
  login,
  setLogin,
  password,
  setPassword,
  isLoggedIn,
  adminOverview,
  adminActionLogs,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  handleApproveMaster,
  handleLogin,
  isLoading,
  loadAdminActionLogs,
  loadAdminOverview,
  updateComplaintStatus,
  updateWithdrawalStatus,
  logout,
}) {
  if (!isLoggedIn) {
    return (
      <AdminLogin
        login={login}
        setLogin={setLogin}
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        isLoading={isLoading}
        onBack={() => window.location.replace("/")}
      />
    );
  }

  return (
    <AdminDashboard
      pendingMasters={pendingMasters}
      adminOverview={adminOverview}
      adminActionLogs={adminActionLogs}
      selectedMaster={selectedMaster}
      setSelectedMaster={setSelectedMaster}
      complaints={complaints}
      withdrawalRequests={withdrawalRequests}
      successText={successText}
      isLoading={isLoading}
      handleApproveMaster={handleApproveMaster}
      loadAdminActionLogs={loadAdminActionLogs}
      loadAdminOverview={loadAdminOverview}
      updateComplaintStatus={updateComplaintStatus}
      updateWithdrawalStatus={updateWithdrawalStatus}
      logout={logout}
    />
  );
}
