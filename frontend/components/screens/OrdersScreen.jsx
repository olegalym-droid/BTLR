import OrderCard from "../OrderCard";

export default function OrdersScreen({
  activeOrders,
  completedOrders,
  getStatusLabel,
  setSelectedOrder,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Мои заказы</h1>
        <p className="mt-1 text-sm text-gray-700">
          Активные и завершённые заявки
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xl font-semibold text-black">Активные</h2>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-gray-700">
            Нет активных заказов
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusLabel={getStatusLabel}
                onClick={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-xl font-semibold text-black">Завершённые</h2>

        {completedOrders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-gray-700">
            Нет завершённых заказов
          </div>
        ) : (
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusLabel={getStatusLabel}
                onClick={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}