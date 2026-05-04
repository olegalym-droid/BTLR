import { notFound } from "next/navigation";
import MasterOrderPageShell from "../../../../components/orders/MasterOrderPageShell";

export default async function MasterOrderDetailsPage({ params }) {
  const { orderId } = await params;

  if (!/^\d+$/.test(String(orderId))) {
    notFound();
  }

  return <MasterOrderPageShell orderId={orderId} />;
}
