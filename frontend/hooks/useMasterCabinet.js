import { useEffect } from "react";
import useMasterAuth from "./useMasterAuth";
import useMasterSession from "./useMasterSession";
import useMasterData from "./useMasterData";
import useMasterCabinetActions from "./useMasterCabinetActions";

export default function useMasterCabinet({ onLogout }) {
  const session = useMasterSession();
  const auth = useMasterAuth();
  const data = useMasterData();

  const {
    isLoggedIn,
    setIsLoggedIn,
    successText,
    setSuccessText,
    openedPhoto,
    setOpenedPhoto,
    activeSection,
    setActiveSection,
    loadStoredMaster,
    logoutMasterSession,
  } = session;

  const {
    mode,
    setMode,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedCategories,
    toggleCategory,
    isLoading,
    handleSubmit: submitMasterAuth,
    resetMasterAuthState,
  } = auth;

  const {
    masterProfile,
    setMasterProfile,
    fullName,
    setFullName,
    aboutMe,
    setAboutMe,
    experienceYears,
    setExperienceYears,
    workCity,
    setWorkCity,
    avatarFile,
    setAvatarFile,
    idCardFront,
    setIdCardFront,
    idCardBack,
    setIdCardBack,
    selfiePhoto,
    setSelfiePhoto,
    isAvatarLoading,
    isDocumentsLoading,
    hasUploadedAllDocuments,
    handleSaveMasterProfile: saveMasterProfileRequest,
    handleUploadAvatar: uploadAvatarRequest,
    handleUploadDocuments: uploadDocumentsRequest,
    availableOrders,
    setAvailableOrders,
    masterOrders,
    reportPhotos,
    setReportPhotos,
    reportTargetOrderId,
    setReportTargetOrderId,
    isAvailableLoading,
    isMasterOrdersLoading,
    isReportUploading,
    loadAvailableOrders,
    loadMasterOrders,
    handleTakeOrder: takeOrderRequest,
    handleMasterStatusChange: changeMasterStatusRequest,
    handleUploadOrderReport: uploadOrderReportRequest,
    getStatusSuccessText,
    scheduleItems,
    setScheduleItems,
    scheduleForm,
    setScheduleForm,
    isScheduleLoading,
    isScheduleSaving,
    addScheduleItem,
    removeScheduleItem,
    saveMasterSchedule: saveMasterScheduleRequest,
    loadMasterData,
    resetMasterDataState,
  } = data;

  const actions = useMasterCabinetActions({
    mode,
    fullName,
    masterProfile,
    onLogout,
    setIsLoggedIn,
    setSuccessText,
    submitMasterAuth,
    loadMasterData,
    saveMasterProfileRequest,
    uploadAvatarRequest,
    uploadDocumentsRequest,
    takeOrderRequest,
    changeMasterStatusRequest,
    uploadOrderReportRequest,
    saveMasterScheduleRequest,
    addScheduleItem,
    getStatusSuccessText,
    logoutMasterSession,
    resetMasterAuthState,
    resetMasterDataState,
  });

  useEffect(() => {
    const authUser = loadStoredMaster();

    if (authUser?.id) {
      loadMasterData(authUser.id)
        .then(() => setIsLoggedIn(true))
        .catch((error) =>
          alert(error.message || "Не удалось загрузить кабинет мастера"),
        );
    }
  }, []);

  return {
    // auth
    mode,
    setMode,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedCategories,
    toggleCategory,

    // profile
    aboutMe,
    setAboutMe,
    experienceYears,
    setExperienceYears,
    workCity,
    setWorkCity,

    // files
    avatarFile,
    setAvatarFile,
    idCardFront,
    setIdCardFront,
    idCardBack,
    setIdCardBack,
    selfiePhoto,
    setSelfiePhoto,

    // reports
    reportPhotos,
    setReportPhotos,
    reportTargetOrderId,
    setReportTargetOrderId,

    // schedule
    scheduleItems,
    setScheduleItems,
    scheduleForm,
    setScheduleForm,

    // state
    isLoading,
    isLoggedIn,
    masterProfile,
    setMasterProfile,
    availableOrders,
    setAvailableOrders,
    masterOrders,

    isAvailableLoading,
    isMasterOrdersLoading,
    isAvatarLoading,
    isDocumentsLoading,
    isReportUploading,
    isScheduleLoading,
    isScheduleSaving,

    hasUploadedAllDocuments,

    successText,
    openedPhoto,
    setOpenedPhoto,

    activeSection,
    setActiveSection,

    // actions
    ...actions,

    removeScheduleItem,
    loadAvailableOrders,
    loadMasterOrders,
  };
}