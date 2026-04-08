export default function SuccessScreen({ onGoToOrders, onBackToServices }) {
  return (
    <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="text-6xl">⏳</div>
      <h1 className="text-2xl font-bold text-black">Заявка принята</h1>
      <p className="text-gray-700">
        Ищем для вас мастера, это может занять пару минут
      </p>

      <button
        onClick={onGoToOrders}
        className="w-full rounded-lg bg-black py-3 text-white"
      >
        Перейти к заказам
      </button>

      <button
        onClick={onBackToServices}
        className="w-full rounded-lg border border-gray-300 py-3 text-black"
      >
        Назад к услугам
      </button>
    </div>
  );
}