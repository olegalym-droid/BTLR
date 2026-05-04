import { notFound } from "next/navigation";
import MasterPageShell from "../../../components/master/MasterPageShell";
import { MASTER_SECTIONS } from "../../../lib/session";

export default async function MasterSectionPage({ params }) {
  const { section } = await params;

  if (!MASTER_SECTIONS.includes(section)) {
    notFound();
  }

  return <MasterPageShell initialSection={section} />;
}
