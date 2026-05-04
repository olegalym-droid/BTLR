import { notFound } from "next/navigation";
import AdminPageShell from "../../../components/admin/AdminPageShell";
import { ADMIN_TABS } from "../../../lib/session";

export default async function AdminTabPage({ params }) {
  const { tab } = await params;

  if (!ADMIN_TABS.includes(tab)) {
    notFound();
  }

  return <AdminPageShell initialTab={tab} />;
}
