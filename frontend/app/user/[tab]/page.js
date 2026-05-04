import { notFound } from "next/navigation";
import UserAppShell from "../../../components/user/UserAppShell";
import { USER_TABS } from "../../../lib/session";

export default async function UserTabPage({ params }) {
  const { tab } = await params;

  if (!USER_TABS.includes(tab)) {
    notFound();
  }

  return <UserAppShell key={tab} initialTab={tab} />;
}
