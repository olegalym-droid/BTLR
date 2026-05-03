import { CheckCircle2, ChevronLeft, UserRound } from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

const PANEL_CLASSNAME =
  "rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6";
const PRIMARY_BUTTON_CLASSNAME =
  "inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[18px] bg-[#4f7f56] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#416f48] disabled:opacity-60";
const SECONDARY_BUTTON_CLASSNAME =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#374151] shadow-sm transition hover:bg-[#f8faf8]";

function MasterAvatar() {
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#edf4ed] text-[#4f7f56] sm:size-24">
      <UserRound size={42} strokeWidth={2} />
    </div>
  );
}

function ImagePreview({ title, src, alt }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-[#111827]">{title}</p>
      <img
        src={src}
        alt={alt}
        className="max-h-[520px] w-full rounded-[20px] border border-gray-200 object-cover shadow-sm"
      />
    </div>
  );
}

export default function AdminMastersSection({
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  handleApproveMaster,
  isLoading,
}) {
  const openMaster = (master) => {
    setSelectedMaster(master);
  };

  if (selectedMaster) {
    const frontUrl = selectedMaster.id_card_front_path
      ? `${API_BASE_URL}/${selectedMaster.id_card_front_path}`
      : null;

    const backUrl = selectedMaster.id_card_back_path
      ? `${API_BASE_URL}/${selectedMaster.id_card_back_path}`
      : null;

    const selfieUrl = selectedMaster.selfie_photo_path
      ? `${API_BASE_URL}/${selectedMaster.selfie_photo_path}`
      : null;

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedMaster(null)}
          className={SECONDARY_BUTTON_CLASSNAME}
        >
          <ChevronLeft size={18} />
          Назад к списку
        </button>

        <div className={`${PANEL_CLASSNAME} space-y-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">
                Проверка мастера
              </h2>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Проверь данные профиля и документы перед одобрением
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-[#4f7f56]">
              На проверке
            </span>
          </div>

          <div className="flex flex-col gap-5 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-5 sm:flex-row sm:items-center">
            <MasterAvatar />
            <div className="min-w-0 space-y-2">
              <h3 className="break-words text-2xl font-bold text-[#111827]">
                {selectedMaster.full_name || "Без имени"}
              </h3>
              <p className="text-base font-semibold text-gray-500">
                {selectedMaster.phone || "Телефон не указан"}
              </p>
            </div>
          </div>

          {selectedMaster.master_categories?.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#111827]">Категории</p>
              <div className="flex flex-wrap gap-2">
                {selectedMaster.master_categories.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-[#4f7f56]"
                  >
                    {item.category_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {frontUrl && (
              <ImagePreview
                title="Удостоверение — лицевая сторона"
                src={frontUrl}
                alt="Лицевая сторона удостоверения"
              />
            )}

            {backUrl && (
              <ImagePreview
                title="Удостоверение — обратная сторона"
                src={backUrl}
                alt="Обратная сторона удостоверения"
              />
            )}

            {selfieUrl && (
              <ImagePreview
                title="Фото лица"
                src={selfieUrl}
                alt="Фото лица мастера"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              handleApproveMaster(selectedMaster.id, selectedMaster.full_name)
            }
            disabled={isLoading}
            className={PRIMARY_BUTTON_CLASSNAME}
          >
            <CheckCircle2 size={20} />
            {isLoading ? "Подтверждение..." : "Одобрить мастера"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${PANEL_CLASSNAME} space-y-5`}>
      <div>
        <h2 className="text-2xl font-bold text-[#111827]">
          Мастера на проверке
        </h2>
        <p className="mt-2 text-sm font-semibold text-gray-500">
          Открой карточку мастера, чтобы проверить документы
        </p>
      </div>

      {pendingMasters.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-gray-300 bg-[#fbfcfb] p-5 text-sm font-semibold text-gray-500">
          Сейчас нет мастеров, ожидающих проверки
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMasters.map((master) => (
            <button
              key={master.id}
              type="button"
              onClick={() => openMaster(master)}
              className="flex w-full flex-col gap-4 rounded-[22px] border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-green-200 hover:bg-[#fbfcfb] sm:flex-row sm:items-center"
            >
              <MasterAvatar />

              <div className="min-w-0 flex-1">
                <p className="break-words text-xl font-bold text-[#111827]">
                  {master.full_name || "Без имени"}
                </p>
                <p className="mt-1 text-base font-semibold text-gray-500">
                  {master.phone || "Телефон не указан"}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#111827]">
                  Статус:{" "}
                  <span className="text-[#4f7f56]">
                    {master.verification_status === "pending"
                      ? "На проверке"
                      : master.verification_status}
                  </span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
