import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  IdCard,
  ImagePlus,
  LogOut,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Upload,
  User,
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

const GREEN = "#6f9f72";

function getStatusInfo(status) {
  if (status === "approved") {
    return {
      label: "Подтверждён",
      title: "Профиль подтверждён",
      text: "Вы можете брать заказы и работать с клиентами.",
      className: "border-[#cfe6d2] bg-[#f1f8f1] text-[#407a45]",
      Icon: CheckCircle2,
    };
  }

  if (status === "pending") {
    return {
      label: "На проверке",
      title: "Документы на проверке",
      text: "Администратор проверит данные мастера.",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      Icon: Clock,
    };
  }

  return {
    label: "Не подтверждён",
    title: "Нужно пройти проверку",
    text: "Заполните профиль и загрузите документы.",
    className: "border-gray-200 bg-gray-50 text-gray-700",
    Icon: ShieldCheck,
  };
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f1f6ef] text-[#5f9557]">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </div>
        <div className="mt-1 break-words text-sm font-semibold text-[#26312c]">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#1f2933]">{label}</span>
      {children}
    </label>
  );
}

function FilePicker({ label, value, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-gray-300 bg-white p-4 transition hover:border-[#72a06d] hover:bg-[#f8fbf7]">
      <span className="flex items-center gap-2 text-sm font-semibold text-[#26312c]">
        <ImagePlus size={18} className="text-[#5f9557]" />
        {label}
      </span>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="hidden"
      />

      <span className="text-xs font-medium text-gray-500">
        {value?.name || "Файл не выбран"}
      </span>
    </label>
  );
}

export default function MasterProfileSection({
  masterProfile,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  handleSaveMasterProfile,
  successText,
  logout,
  avatarFile,
  setAvatarFile,
  handleUploadAvatar,
  isAvatarLoading,
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  hasUploadedAllDocuments,
  isDocumentsLoading,
}) {
  const avatarUrl = masterProfile?.avatar_path
    ? `${API_BASE_URL}/${masterProfile.avatar_path}`
    : null;

  const frontUrl = masterProfile?.id_card_front_path
    ? `${API_BASE_URL}/${masterProfile.id_card_front_path}`
    : null;

  const backUrl = masterProfile?.id_card_back_path
    ? `${API_BASE_URL}/${masterProfile.id_card_back_path}`
    : null;

  const selfieUrl = masterProfile?.selfie_photo_path
    ? `${API_BASE_URL}/${masterProfile.selfie_photo_path}`
    : null;

  const status = masterProfile?.verification_status;
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.Icon;
  const isApproved = status === "approved";
  const displayName = masterProfile?.full_name || "Не указано";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#f4faf3] via-white to-white px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf4e8] px-4 py-2 text-sm font-semibold text-[#5f9557]">
                <User size={17} />
                Кабинет мастера
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#151c23]">
                Профиль мастера
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Здесь можно обновить данные, аватарку и документы для проверки.
              </p>
            </div>

            <div
              className={`flex items-start gap-3 rounded-3xl border px-4 py-4 ${statusInfo.className}`}
            >
              <StatusIcon size={22} className="mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-bold">{statusInfo.title}</div>
                <div className="mt-1 text-sm opacity-90">{statusInfo.text}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[330px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-[28px] border border-gray-200 bg-[#fbfdfb] p-5">
              <div className="flex flex-col items-center text-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Аватар мастера"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-[#eef6ea] text-[#5f9557] shadow-md">
                    <User size={42} />
                  </div>
                )}

                <h3 className="mt-4 text-xl font-bold text-[#151c23]">
                  {masterProfile?.full_name || "Без имени"}
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  {masterProfile?.phone || "Телефон не указан"}
                </p>

                <span className="mt-4 rounded-full bg-[#edf6eb] px-4 py-2 text-xs font-bold text-[#5f9557]">
                  {statusInfo.label}
                </span>

                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Имя и телефон берутся из регистрации. Ниже редактируется
                  только публичный профиль мастера.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <FilePicker
                  label="Выбрать аватарку"
                  value={avatarFile}
                  onChange={setAvatarFile}
                />

                <button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={isAvatarLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#8ebf8c] bg-white px-4 py-3 text-sm font-bold text-[#5f9557] transition hover:bg-[#f1f8f1] disabled:opacity-60"
                >
                  <Upload size={18} />
                  {isAvatarLoading ? "Загрузка..." : "Загрузить аватарку"}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-[#fbfdfb] p-4">
              <div className="grid gap-3">
                <InfoRow
                  icon={Phone}
                  label="Телефон"
                  value={masterProfile?.phone || "Не указан"}
                />
                <InfoRow
                  icon={ShieldCheck}
                  label="Статус"
                  value={statusInfo.label}
                />
                <InfoRow
                  icon={Star}
                  label="Рейтинг"
                  value={String(masterProfile?.rating ?? 0)}
                />
                <InfoRow
                  icon={BriefcaseBusiness}
                  label="Заказов выполнено"
                  value={String(masterProfile?.completed_orders_count ?? 0)}
                />
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            {successText && (
              <div className="rounded-2xl border border-[#cfe6d2] bg-[#f1f8f1] px-4 py-3 text-sm font-semibold text-[#407a45]">
                {successText}
              </div>
            )}

            {masterProfile?.master_categories?.length > 0 && (
              <div className="rounded-[28px] border border-gray-200 bg-white p-5">
                <div className="text-sm font-bold text-[#151c23]">
                  Категории
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {masterProfile.master_categories.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-[#eef6ea] px-4 py-2 text-xs font-bold text-[#5f9557]"
                    >
                      {item.category_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
                  <User size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#151c23]">
                    Публичный профиль
                  </h3>
                  <p className="text-sm text-gray-500">
                    Эти данные видит клиент при выборе мастера: описание, опыт,
                    город и категории.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-[#fbfcfb] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f1f6ef] text-[#5f9557]">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Имя и фамилия из аккаунта
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#26312c]">
                        {displayName}
                      </p>
                    </div>
                  </div>
                </div>

                <Field label="О себе">
                  <textarea
                    value={aboutMe}
                    onChange={(event) => setAboutMe(event.target.value)}
                    placeholder="Расскажите о себе, опыте и услугах"
                    rows={4}
                    className="w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Опыт работы">
                    <input
                      type="number"
                      min="0"
                      value={experienceYears}
                      onChange={(event) =>
                        setExperienceYears(event.target.value)
                      }
                      placeholder="Например: 3"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                    />
                  </Field>

                  <Field label="Город">
                    <div className="relative">
                      <MapPin
                        size={19}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5f9557]"
                      />
                      <input
                        value={workCity}
                        onChange={(event) => setWorkCity(event.target.value)}
                        placeholder="Например: Астана"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-4 text-sm font-medium text-[#151c23] outline-none transition placeholder:text-gray-400 focus:border-[#72a06d] focus:ring-4 focus:ring-[#eef6ea]"
                      />
                    </div>
                  </Field>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveMasterProfile}
                  className="flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5f9557]"
                >
                  <Save size={19} />
                  Сохранить профиль
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  <LogOut size={19} />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isApproved && (
        <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
              <IdCard size={23} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#151c23]">Документы</h3>
              <p className="text-sm text-gray-500">
                Загрузите удостоверение и фото лица для проверки.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FilePicker
              label="Удостоверение — лицевая"
              value={idCardFront}
              onChange={setIdCardFront}
            />
            <FilePicker
              label="Удостоверение — обратная"
              value={idCardBack}
              onChange={setIdCardBack}
            />
            <FilePicker
              label="Фото лица"
              value={selfiePhoto}
              onChange={setSelfiePhoto}
            />
          </div>

          <button
            type="button"
            onClick={handleUploadDocuments}
            disabled={isDocumentsLoading}
            className="mt-5 flex w-full min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#151c23] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
          >
            <Upload size={19} />
            {isDocumentsLoading ? "Загрузка..." : "Загрузить документы"}
          </button>

          {hasUploadedAllDocuments && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {frontUrl && (
                <img
                  src={frontUrl}
                  alt="Лицевая сторона удостоверения"
                  className="h-56 w-full rounded-2xl border border-gray-200 object-cover"
                />
              )}

              {backUrl && (
                <img
                  src={backUrl}
                  alt="Обратная сторона удостоверения"
                  className="h-56 w-full rounded-2xl border border-gray-200 object-cover"
                />
              )}

              {selfieUrl && (
                <img
                  src={selfieUrl}
                  alt="Фото лица мастера"
                  className="h-56 w-full rounded-2xl border border-gray-200 object-cover"
                />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
