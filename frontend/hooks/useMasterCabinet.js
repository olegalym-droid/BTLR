import { useEffect } from "react";
import useMasterAuth from "./useMasterAuth";
import useMasterSession from "./useMasterSession";
import useMasterData from "./useMasterData";

export default function useMasterCabinet({ onLogout }) {
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
  } = useMasterSession();

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
  } = useMasterAuth();

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
    loadMasterData,
    resetMasterDataState,
  } = useMasterData();

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

  const handleSubmit = async () => {
    try {
      setSuccessText("");

      const authData = await submitMasterAuth({
        fullName,
        onAuthSuccess: async (data) => {
          await loadMasterData(data.id);
        },
      });

      setIsLoggedIn(true);

      if (mode === "register") {
        setSuccessText("Регистрация мастера выполнена");
      } else {
        setSuccessText("Вход мастера выполнен");
      }

      return authData;
    } catch (error) {
      console.error("Ошибка авторизации мастера:", error);
      alert(error.message || "Ошибка авторизации");
      return null;
    }
  };

  const handleSaveMasterProfile = async () => {
    try {
      await saveMasterProfileRequest();
      setSuccessText("Профиль мастера сохранён");
    } catch (error) {
      console.error("Ошибка сохранения профиля мастера:", error);
      alert(error.message || "Не удалось сохранить профиль мастера");
    }
  };

  const handleUploadAvatar = async () => {
    try {
      await uploadAvatarRequest();
      setSuccessText("Аватарка обновлена");
    } catch (error) {
      console.error("Ошибка загрузки аватарки:", error);
      alert(error.message || "Не удалось загрузить аватарку");
    }
  };

  const handleUploadDocuments = async () => {
    try {
      await uploadDocumentsRequest();
      setSuccessText("Документы загружены и отправлены на проверку");

      if (masterProfile?.id) {
        await loadMasterData(masterProfile.id);
      }
    } catch (error) {
      console.error("Ошибка загрузки документов:", error);
      alert(error.message || "Не удалось загрузить документы");
    }
  };

  const handleTakeOrder = async (orderId, offeredPrice = "") => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      await takeOrderRequest(masterProfile.id, orderId, offeredPrice);
      setSuccessText("Отклик на заказ успешно отправлен");
    } catch (error) {
      console.error("Ошибка принятия заказа:", error);
      alert(error.message || "Не удалось отправить отклик");
    }
  };

  const handleMasterStatusChange = async (orderId, status) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      await changeMasterStatusRequest(masterProfile.id, orderId, status);
      setSuccessText(getStatusSuccessText(status));
    } catch (error) {
      console.error("Ошибка смены статуса:", error);
      alert(error.message || "Не удалось обновить статус");
    }
  };

  const handleUploadOrderReport = async (orderId) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      await uploadOrderReportRequest(masterProfile.id, orderId);
      setSuccessText("Фото-отчёт успешно загружен");
    } catch (error) {
      console.error("Ошибка загрузки фото-отчёта:", error);
      alert(error.message || "Не удалось загрузить фото-отчёт");
    }
  };

  const logout = () => {
    logoutMasterSession({
      onLogout,
      resetters: [resetMasterAuthState, resetMasterDataState],
    });
  };

  return {
    mode,
    setMode,
    phone,
    setPhone,
    fullName,
    setFullName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedCategories,
    toggleCategory,

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

    reportPhotos,
    setReportPhotos,
    reportTargetOrderId,
    setReportTargetOrderId,

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

    hasUploadedAllDocuments,

    successText,
    openedPhoto,
    setOpenedPhoto,

    activeSection,
    setActiveSection,

    handleSubmit,
    handleSaveMasterProfile,
    handleUploadAvatar,
    handleUploadDocuments,
    handleTakeOrder,
    handleMasterStatusChange,
    handleUploadOrderReport,
    loadAvailableOrders,
    loadMasterOrders,
    logout,
  };
}