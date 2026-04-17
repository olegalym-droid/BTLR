import { WEEKDAY_OPTIONS, getWeekdayLabel } from "../../lib/masterSchedule";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const value = String(index).padStart(2, "0");
  return {
    value: `${value}:00`,
    label: `${value}:00`,
  };
});

export default function MasterScheduleSection({
  scheduleItems,
  scheduleForm,
  setScheduleForm,
  isScheduleLoading,
  isScheduleSaving,
  handleAddScheduleItem,
  handleSaveMasterSchedule,
  removeScheduleItem,
  successText,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">График работы</h2>
          <p className="text-sm text-gray-600">
            Укажите, в какие дни и часы вы обычно принимаете заказы
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">
              День недели
            </label>
            <select
              value={scheduleForm.weekday}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  weekday: Number(event.target.value),
                }))
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
            >
              {WEEKDAY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">С</label>
            <select
              value={scheduleForm.startTime}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  startTime: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
            >
              {HOUR_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">До</label>
            <select
              value={scheduleForm.endTime}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  endTime: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
            >
              {HOUR_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleAddScheduleItem}
            className="w-full rounded-2xl border border-black px-4 py-3 text-sm font-medium text-black"
          >
            Добавить слот
          </button>

          <button
            type="button"
            onClick={handleSaveMasterSchedule}
            disabled={isScheduleSaving}
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {isScheduleSaving ? "Сохранение..." : "Сохранить график"}
          </button>
        </div>

        {isScheduleLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Загрузка графика...
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            У вас пока нет добавленных рабочих слотов
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-black">
                    {getWeekdayLabel(item.weekday)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.start_time} — {item.end_time}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeScheduleItem(item)}
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}

        {successText && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successText}
          </div>
        )}
      </div>
    </div>
  );
}