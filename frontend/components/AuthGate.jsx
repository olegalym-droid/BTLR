import UnifiedAuth from "./auth/UnifiedAuth";

export default function AuthGate({
  handleAuthSuccess,
  setSelectedRole,
  setIsAuthenticated,
  loginWithCredentials,
}) {
  return (
    <UnifiedAuth
      onUserOrMasterSuccess={(role) => {
        handleAuthSuccess();
        setSelectedRole(role);
        setIsAuthenticated(true);
      }}
      onAdminSuccess={async (login, password) => {
        await loginWithCredentials(login, password);
        setSelectedRole("admin");
      }}
    />
  );
}