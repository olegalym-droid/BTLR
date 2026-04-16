import MasterAuthForm from "../master/MasterAuthForm";
import MasterDashboard from "../master/MasterDashboard";
import useMasterCabinet from "../../hooks/useMasterCabinet";

export default function MasterPlaceholderScreen({ onBack, onLogout }) {
  const master = useMasterCabinet({ onLogout });

  if (master.isLoggedIn) {
    return (
      <MasterDashboard
        masterProfile={master.masterProfile}
        fullName={master.fullName}
        setFullName={master.setFullName}
        aboutMe={master.aboutMe}
        setAboutMe={master.setAboutMe}
        experienceYears={master.experienceYears}
        setExperienceYears={master.setExperienceYears}
        workCity={master.workCity}
        setWorkCity={master.setWorkCity}
        handleSaveMasterProfile={master.handleSaveMasterProfile}
        successText={master.successText}
        logout={master.logout}
        avatarFile={master.avatarFile}
        setAvatarFile={master.setAvatarFile}
        handleUploadAvatar={master.handleUploadAvatar}
        isAvatarLoading={master.isAvatarLoading}
        idCardFront={master.idCardFront}
        setIdCardFront={master.setIdCardFront}
        idCardBack={master.idCardBack}
        setIdCardBack={master.setIdCardBack}
        selfiePhoto={master.selfiePhoto}
        setSelfiePhoto={master.setSelfiePhoto}
        handleUploadDocuments={master.handleUploadDocuments}
        hasUploadedAllDocuments={master.hasUploadedAllDocuments}
        isDocumentsLoading={master.isDocumentsLoading}
        availableOrders={master.availableOrders}
        isAvailableLoading={master.isAvailableLoading}
        loadAvailableOrders={master.loadAvailableOrders}
        handleTakeOrder={master.handleTakeOrder}
        setAvailableOrders={master.setAvailableOrders}
        masterOrders={master.masterOrders}
        isMasterOrdersLoading={master.isMasterOrdersLoading}
        loadMasterOrders={master.loadMasterOrders}
        handleMasterStatusChange={master.handleMasterStatusChange}
        reportPhotos={master.reportPhotos}
        setReportPhotos={master.setReportPhotos}
        reportTargetOrderId={master.reportTargetOrderId}
        setReportTargetOrderId={master.setReportTargetOrderId}
        handleUploadOrderReport={master.handleUploadOrderReport}
        isReportUploading={master.isReportUploading}
        openedPhoto={master.openedPhoto}
        setOpenedPhoto={master.setOpenedPhoto}
        activeSection={master.activeSection}
        setActiveSection={master.setActiveSection}
        scheduleItems={master.scheduleItems}
        setScheduleItems={master.setScheduleItems}
        scheduleForm={master.scheduleForm}
        setScheduleForm={master.setScheduleForm}
        isScheduleLoading={master.isScheduleLoading}
        isScheduleSaving={master.isScheduleSaving}
        handleAddScheduleItem={master.handleAddScheduleItem}
        handleSaveMasterSchedule={master.handleSaveMasterSchedule}
        removeScheduleItem={master.removeScheduleItem}
      />
    );
  }

  return (
    <MasterAuthForm
      mode={master.mode}
      setMode={master.setMode}
      phone={master.phone}
      setPhone={master.setPhone}
      fullName={master.fullName}
      setFullName={master.setFullName}
      password={master.password}
      setPassword={master.setPassword}
      confirmPassword={master.confirmPassword}
      setConfirmPassword={master.setConfirmPassword}
      selectedCategories={master.selectedCategories}
      toggleCategory={master.toggleCategory}
      handleSubmit={master.handleSubmit}
      isLoading={master.isLoading}
      successText={master.successText}
      onBack={onBack}
    />
  );
}