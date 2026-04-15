import AuthGate from "./AuthGate";
import AdminDashboard from "./admin/AdminDashboard";

export default function AdminAppView({
  isAdminLoggedIn,
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  adminSuccessText,
  handleApproveMaster,
  isAdminLoading,
  adminLogout,
  loginWithCredentials,
  updateComplaintStatus,
  setSelectedRole,
  handleAuthSuccess,
  setIsAuthenticated,
}) {
  if (!isAdminLoggedIn) {
    return (
      <AuthGate
        handleAuthSuccess={handleAuthSuccess}
        setSelectedRole={setSelectedRole}
        setIsAuthenticated={setIsAuthenticated}
        loginWithCredentials={loginWithCredentials}
      />
    );
  }

  return (
    <AdminDashboard
      pendingMasters={pendingMasters}
      selectedMaster={selectedMaster}
      setSelectedMaster={setSelectedMaster}
      handleApproveMaster={handleApproveMaster}
      complaints={complaints}
      updateComplaintStatus={updateComplaintStatus}
      isLoading={isAdminLoading}
      successText={adminSuccessText}
      logout={() => {
        adminLogout();
        setSelectedRole(null);
      }}
    />
  );
}