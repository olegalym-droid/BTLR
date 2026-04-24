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

        if (role === "master") {
          window.location.replace("/master");
          return;
        }

        setSelectedRole(role);
        setIsAuthenticated(true);
      }}
      onAdminSuccess={async (login, password) => {
        await loginWithCredentials(login, password);
        window.location.replace("/admin");
      }}
    />
  );
}