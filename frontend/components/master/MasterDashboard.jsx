import MasterProfileSection from "./MasterProfileSection";
import MasterWalletSection from "./MasterWalletSection";
import MasterScheduleSection from "./MasterScheduleSection";
import MasterOrdersTabsSection from "./MasterOrdersTabsSection";

function SectionTabs({ activeSection, setActiveSection }) {
  return (
    <div className="grid grid-cols-4 rounded-2xl border border-gray-300 bg-white p-2 shadow">
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

      <button
        type="button"
        onClick={() => setActiveSection("wallet")}
        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
          activeSection === "wallet"
            ? "bg-black text-white"
            : "bg-white text-black"
        }`}
      >
        Кошелёк
      </button>
    </div>
  );
}

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
  scheduleForm,
  setScheduleForm,
  isScheduleLoading,
  isScheduleSaving,
  handleAddScheduleItem,
  handleSaveMasterSchedule,
  removeScheduleItem,
}) {
  return (
    <>
      <div className="space-y-6">
        <SectionTabs
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

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
          <MasterScheduleSection
            scheduleItems={scheduleItems}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            isScheduleLoading={isScheduleLoading}
            isScheduleSaving={isScheduleSaving}
            handleAddScheduleItem={handleAddScheduleItem}
            handleSaveMasterSchedule={handleSaveMasterSchedule}
            removeScheduleItem={removeScheduleItem}
            successText={successText}
          />
        )}

        {activeSection === "orders" && (
          <MasterOrdersTabsSection
            masterProfile={masterProfile}
            availableOrders={availableOrders}
            isAvailableLoading={isAvailableLoading}
            loadAvailableOrders={loadAvailableOrders}
            handleTakeOrder={handleTakeOrder}
            setAvailableOrders={setAvailableOrders}
            masterOrders={masterOrders}
            isMasterOrdersLoading={isMasterOrdersLoading}
            loadMasterOrders={loadMasterOrders}
            handleMasterStatusChange={handleMasterStatusChange}
            reportPhotos={reportPhotos}
            setReportPhotos={setReportPhotos}
            reportTargetOrderId={reportTargetOrderId}
            setReportTargetOrderId={setReportTargetOrderId}
            handleUploadOrderReport={handleUploadOrderReport}
            isReportUploading={isReportUploading}
            setOpenedPhoto={setOpenedPhoto}
          />
        )}

        {activeSection === "wallet" && (
          <MasterWalletSection masterProfile={masterProfile} />
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