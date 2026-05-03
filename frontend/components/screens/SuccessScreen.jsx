import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

function NextStepCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#6f9a61]">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-[#25302c]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{text}</p>
    </div>
  );
}

export default function SuccessScreen({ onGoToOrders, onBackToServices }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#25302c]">
          Заявка отправлена
        </h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Теперь подходящие мастера увидят заказ и смогут откликнуться.
        </p>
      </div>

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#eef6ea] text-[#6f9a61] shadow-sm sm:h-28 sm:w-28">
            <CheckCircle2 size={42} strokeWidth={2.2} />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-[#25302c] sm:text-4xl">
              Что дальше
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Следите за заказом в разделе “Заказы”. Когда мастер откликнется,
              вы увидите его цену и публичный профиль, а затем сможете выбрать
              исполнителя.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <NextStepCard
              icon={SearchCheck}
              title="Ищем мастера"
              text="Заявка попала к мастерам, которые подходят по категории и графику."
            />

            <NextStepCard
              icon={MessageCircle}
              title="Ждём отклики"
              text="Если мастер предложит свою цену, вы увидите это в заказе и уведомлениях."
            />

            <NextStepCard
              icon={ShieldCheck}
              title="Оплата под контролем"
              text="После выполнения заказа оплату можно будет провести через карточку заказа."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onGoToOrders}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7fb276] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#6fa565]"
            >
              <ClipboardList size={18} />
              Перейти к заказам
            </button>

            <button
              type="button"
              onClick={onBackToServices}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base font-semibold text-[#25302c] transition hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Создать ещё заявку
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
