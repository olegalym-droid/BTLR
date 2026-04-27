import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";

export default function AdminAppView({
  login,
  setLogin,
  password,
  setPassword,
  isLoggedIn,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  handleApproveMaster,
  handleLogin,
  isLoading,
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
