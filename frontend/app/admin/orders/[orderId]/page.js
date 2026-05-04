import { notFound } from "next/navigation";
import AdminOrderPageShell from "../../../../components/orders/AdminOrderPageShell";

export default async function AdminOrderDetailsPage({ params }) {
  const { orderId } = await params;

  if (!/^\d+$/.test(String(orderId))) {
    notFound();
  }

  return <AdminOrderPageShell orderId={orderId} />;
}
