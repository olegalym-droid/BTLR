import { useMemo, useState } from "react";
import MasterProfileSection from "./MasterProfileSection";
import MasterAvailableOrdersSection from "./MasterAvailableOrdersSection";
import MasterOrdersSection from "./MasterOrdersSection";
import {
  MASTER_ACTIVE_ORDER_STATUSES,
  MASTER_DONE_ORDER_STATUSES,
} from "../../lib/orders";
import {
  WEEKDAY_OPTIONS,
  getWeekdayLabel,
} from "../../lib/masterSchedule";

export default function MasterDashboard({
  masterProfile,
  fullName,
  setFullName,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  workDistrict,
  setWorkDistrict,
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
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  reportPhotos,
  setReportPhotos,
  reportTargetOrderId,
  setReportTargetOrderId,
  handleUploadOrderReport,
  isReportUploading,
  openedPhoto,
  setOpenedPhoto,
  activeSection,
  setActiveSection,
  scheduleItems,
  setScheduleItems,
  scheduleForm,
  setScheduleForm,
  isScheduleLoading,
  isScheduleSaving,
  handleAddScheduleItem,
  handleSaveMasterSchedule,
  removeScheduleItem,
}) {
  const [ordersTab, setOrdersTab] = useState("search");

  const currentOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_ACTIVE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

  const completedOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_DONE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-2 shadow">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "profile"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Профиль
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("schedule")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "schedule"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            График
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("orders")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "orders"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Заказы
          </button>
        </div>

        {activeSection === "profile" && (
          <MasterProfileSection
            masterProfile={masterProfile}
            fullName={fullName}
            setFullName={setFullName}
            aboutMe={aboutMe}
            setAboutMe={setAboutMe}
            experienceYears={experienceYears}
            setExperienceYears={setExperienceYears}
            workCity={workCity}
            setWorkCity={setWorkCity}
            workDistrict={workDistrict}
            setWorkDistrict={setWorkDistrict}
            handleSaveMasterProfile={handleSaveMasterProfile}
            successText={successText}
            logout={logout}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleUploadAvatar={handleUploadAvatar}
            isAvatarLoading={isAvatarLoading}
            idCardFront={idCardFront}
            setIdCardFront={setIdCardFront}
            idCardBack={idCardBack}
            setIdCardBack={setIdCardBack}
            selfiePhoto={selfiePhoto}
            setSelfiePhoto={setSelfiePhoto}
            handleUploadDocuments={handleUploadDocuments}
            hasUploadedAllDocuments={hasUploadedAllDocuments}
            isDocumentsLoading={isDocumentsLoading}
          />
        )}

        {activeSection === "schedule" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-black">
                  График работы
                </h2>
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
                  <label className="text-sm font-medium text-black">
                    С
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    До
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        endTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-black outline-none"
                  />
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
        )}

        {activeSection === "orders" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-2 shadow">
              <button
                type="button"
                onClick={() => setOrdersTab("search")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "search"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Поиск заказов
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("active")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "active"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Активные
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("completed")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "completed"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Выполненные
              </button>
            </div>

            {ordersTab === "search" && (
              <MasterAvailableOrdersSection
                masterProfile={masterProfile}
                availableOrders={availableOrders}
                isAvailableLoading={isAvailableLoading}
                loadAvailableOrders={loadAvailableOrders}
                handleTakeOrder={handleTakeOrder}
                setAvailableOrders={setAvailableOrders}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "active" && (
              <MasterOrdersSection
                title="Активные заказы"
                emptyText="У вас нет активных заказов"
                masterProfile={masterProfile}
                masterOrders={currentOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                reportPhotos={reportPhotos}
                setReportPhotos={setReportPhotos}
                reportTargetOrderId={reportTargetOrderId}
                setReportTargetOrderId={setReportTargetOrderId}
                handleUploadOrderReport={handleUploadOrderReport}
                isReportUploading={isReportUploading}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "completed" && (
              <MasterOrdersSection
                title="Выполненные заказы"
                emptyText="У вас нет выполненных заказов"
                masterProfile={masterProfile}
                masterOrders={completedOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                reportPhotos={reportPhotos}
                setReportPhotos={setReportPhotos}
                reportTargetOrderId={reportTargetOrderId}
                setReportTargetOrderId={setReportTargetOrderId}
                handleUploadOrderReport={handleUploadOrderReport}
                isReportUploading={isReportUploading}
                onOpenPhoto={setOpenedPhoto}
              />
            )}
          </div>
        )}
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </>
  );
}