import MasterDashboard from "./master/MasterDashboard";

export default function MasterAppView(props) {
  const { isLoggedIn, masterProfile } = props;

  if (!isLoggedIn || !masterProfile) {
    return <div className="min-h-[70vh] bg-white" />;
  }

  return <MasterDashboard {...props} />;
}