import {
  CalendarDays,
  Clock,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  WEEKDAY_OPTIONS,
  getWeekdayLabel,
} from "../../lib/masterSchedule";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0") + ":00"
);

const INPUT_CLASS =
  "w-full min-h-[58px] appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-semibold text-[#151c23] outline-none transition focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]";

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#26312c]">{label}</span>

      <div className="relative">
        {Icon && (
          <Icon
            size={21}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5f9557]"
          />
        )}

        {children}
      </div>
    </label>
  );
}

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
  const updateForm = (key, value) => {
    setScheduleForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf4e8] px-4 py-2 text-sm font-semibold text-[#5f9557]">
          <CalendarDays size={17} />
          Рабочее время
        </div>

        <h2 className="mt-4 text-3xl font-bold text-[#151c23]">
          График работы
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Укажите часы работы (без минут)
        </p>
      </div>

      {successText && (
        <div className="mb-5 rounded-2xl border border-[#cfe6d2] bg-[#f1f8f1] px-4 py-3 text-sm font-semibold text-[#407a45]">
          {successText}
        </div>
      )}

      <div className="rounded-[28px] border border-gray-200 bg-[#fbfdfb] p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          
          {/* День */}
          <Field label="День недели" icon={CalendarDays}>
            <select
              value={scheduleForm.weekday}
              onChange={(e) =>
                updateForm("weekday", Number(e.target.value))
              }
              className={`${INPUT_CLASS} pl-12`}
            >
              {WEEKDAY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          {/* С */}
          <Field label="С" icon={Clock}>
            <select
              value={scheduleForm.startTime}
              onChange={(e) => updateForm("startTime", e.target.value)}
              className={`${INPUT_CLASS} pl-12`}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>

          {/* До */}
          <Field label="До" icon={Clock}>
            <select
              value={scheduleForm.endTime}
              onChange={(e) => updateForm("endTime", e.target.value)}
              className={`${INPUT_CLASS} pl-12`}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            onClick={handleAddScheduleItem}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#8ebf8c] text-[#5f9557] font-bold"
          >
            <Plus size={20} />
            Добавить слот
          </button>

          <button
            onClick={handleSaveMasterSchedule}
            disabled={isScheduleSaving}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] text-white font-bold"
          >
            <Save size={20} />
            {isScheduleSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Список */}
      <div className="mt-6 space-y-3">
        {scheduleItems.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center rounded-2xl border p-4"
          >
            <div>
              <div className="font-bold">
                {getWeekdayLabel(Number(item.weekday))}
              </div>
              <div className="text-sm text-gray-500">
                {item.start_time} — {item.end_time}
              </div>
            </div>

            <button
              onClick={() => removeScheduleItem(item)}
              className="text-red-500 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Удалить
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}