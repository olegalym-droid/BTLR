import { notFound } from "next/navigation";
import UserOrderPageShell from "../../../../components/orders/UserOrderPageShell";

export default async function UserOrderDetailsPage({ params }) {
  const { orderId } = await params;

  if (!/^\d+$/.test(String(orderId))) {
    notFound();
  }

  return <UserOrderPageShell orderId={orderId} />;
}
