import { CheckCircle2, ClipboardList, ArrowLeft, Sparkles } from "lucide-react";

export default function SuccessScreen({ onGoToOrders, onBackToServices }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#25302c]">Заявка отправлена</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Мы уже начали искать для вас подходящего мастера
        </p>
      </div>

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#eef6ea] text-[#6f9a61] shadow-sm sm:h-28 sm:w-28">
            <CheckCircle2 size={42} strokeWidth={2.2} />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-[#25302c] sm:text-4xl">
              Заявка принята
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Ищем для вас мастера. Обычно это занимает совсем немного времени.
              Как только появятся отклики или изменится статус заказа, вы увидите это в уведомлениях и в разделе заказов.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <div className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#6f9a61]">
                <Sparkles size={20} />
              </div>
              <p className="text-sm font-semibold text-[#25302c]">
                Заявка сохранена
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Все введённые данные уже отправлены и закреплены за вашим заказом.
              </p>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#6f9a61]">
                <ClipboardList size={20} />
              </div>
              <p className="text-sm font-semibold text-[#25302c]">
                Статус обновится
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Когда мастер откликнется, вы сможете открыть заказ и посмотреть детали.
              </p>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#6f9a61]">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm font-semibold text-[#25302c]">
                Всё под контролем
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Вы всегда можете вернуться к услугам или сразу перейти в список заказов.
              </p>
            </div>
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
              Назад к услугам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}