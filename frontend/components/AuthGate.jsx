import UnifiedAuth from "./auth/UnifiedAuth";

export default function AuthGate({
  onUserOrMasterSuccess,
  onAdminSuccess,
}) {
  return (
    <UnifiedAuth
      onUserOrMasterSuccess={onUserOrMasterSuccess}
      onAdminSuccess={onAdminSuccess}
    />
  );
}
