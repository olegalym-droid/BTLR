import AdminLogin from "../admin/AdminLogin";
import AdminDashboard from "../admin/AdminDashboard";
import useAdminCabinet from "../../hooks/useAdminCabinet";

export default function AdminPlaceholderScreen({ onBack, onLogout }) {
  const admin = useAdminCabinet({ onLogout });

  if (admin.isLoggedIn) {
    return (
      <AdminDashboard
        pendingMasters={admin.pendingMasters}
        selectedMaster={admin.selectedMaster}
        setSelectedMaster={admin.setSelectedMaster}
        handleApproveMaster={admin.handleApproveMaster}

        complaints={admin.complaints}
        updateComplaintStatus={admin.updateComplaintStatus}

        isLoading={admin.isLoading}
        successText={admin.successText}
        logout={admin.logout}
      />
    );
  }

  return (
    <AdminLogin
      login={admin.login}
      setLogin={admin.setLogin}
      password={admin.password}
      setPassword={admin.setPassword}
      handleLogin={admin.handleLogin}
      isLoading={admin.isLoading}
      onBack={onBack}
    />
  );
}