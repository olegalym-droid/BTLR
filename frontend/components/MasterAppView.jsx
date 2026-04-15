import MasterPlaceholderScreen from "./screens/MasterPlaceholderScreen";

export default function MasterAppView({
  setIsAuthenticated,
  setSelectedRole,
}) {
  return (
    <MasterPlaceholderScreen
      onBack={() => {
        setIsAuthenticated(false);
        setSelectedRole(null);
      }}
      onLogout={() => {
        setIsAuthenticated(false);
        setSelectedRole(null);
      }}
    />
  );
}