export default function useMasterCabinetActions({
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
}) {
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

  const handleSaveMasterSchedule = async () => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      await saveMasterScheduleRequest(masterProfile.id);
      setSuccessText("График работы сохранён");
    } catch (error) {
      console.error("Ошибка сохранения графика:", error);
      alert(error.message || "Не удалось сохранить график работы");
    }
  };

  const handleAddScheduleItem = () => {
    try {
      addScheduleItem();
      setSuccessText("Слот добавлен в график");
    } catch (error) {
      console.error("Ошибка добавления слота:", error);
      alert(error.message || "Не удалось добавить слот");
    }
  };

  const logout = () => {
    logoutMasterSession({
      resetters: [resetMasterAuthState, resetMasterDataState],
    });

    if (typeof window !== "undefined") {
      const keysToRemove = [
        "isAuth",
        "auth_user",
        "isAuth_master",
        "auth_user_master",
        "isAuth_user",
        "auth_user_user",
        "app_selected_role",
        "app_active_tab",
        "app_master_active_section",
        "admin_login",
        "admin_password",
      ];

      keysToRemove.forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });

      window.location.replace("/");
      return;
    }

    if (onLogout) {
      onLogout();
    }
  };

  return {
    handleSubmit,
    handleSaveMasterProfile,
    handleUploadAvatar,
    handleUploadDocuments,
    handleTakeOrder,
    handleMasterStatusChange,
    handleUploadOrderReport,
    handleSaveMasterSchedule,
    handleAddScheduleItem,
    logout,
  };
}
