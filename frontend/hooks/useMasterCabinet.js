import { useEffect, useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
  getStoredAuthUser,
  loadMasterProfileRequest,
  updateMasterProfileRequest,
  uploadMasterAvatarRequest,
  uploadMasterDocumentsRequest,
  clearAuthData,
} from "../lib/auth";
import {
  loadAvailableOrdersRequest,
  loadMasterOrdersRequest,
  assignOrderToMasterRequest,
  updateOrderStatusByMasterRequest,
} from "../lib/orders";

export default function useMasterCabinet({ onLogout }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [aboutMe, setAboutMe] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [workCity, setWorkCity] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [masterProfile, setMasterProfile] = useState(null);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [masterOrders, setMasterOrders] = useState([]);

  const [isAvailableLoading, setIsAvailableLoading] = useState(false);
  const [isMasterOrdersLoading, setIsMasterOrdersLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [openedPhoto, setOpenedPhoto] = useState(null);

  const [activeSection, setActiveSection] = useState("profile");

  const hasUploadedAllDocuments = Boolean(
    masterProfile?.id_card_front_path &&
      masterProfile?.id_card_back_path &&
      masterProfile?.selfie_photo_path,
  );

  const loadAvailableOrders = async (masterId) => {
    try {
      setIsAvailableLoading(true);

      const resolvedMasterId =
        masterId || masterProfile?.id || getStoredAuthUser()?.id;

      if (!resolvedMasterId) {
        throw new Error("Мастер не авторизован");
      }

      const orders = await loadAvailableOrdersRequest(resolvedMasterId);
      setAvailableOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки доступных заказов:", error);
      setAvailableOrders([]);
    } finally {
      setIsAvailableLoading(false);
    }
  };

  const loadMasterOrders = async (masterId) => {
    try {
      setIsMasterOrdersLoading(true);

      const resolvedMasterId =
        masterId || masterProfile?.id || getStoredAuthUser()?.id;

      if (!resolvedMasterId) {
        throw new Error("Мастер не авторизован");
      }

      const orders = await loadMasterOrdersRequest(resolvedMasterId);
      setMasterOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки заказов мастера:", error);
      setMasterOrders([]);
    } finally {
      setIsMasterOrdersLoading(false);
    }
  };

  const loadMasterData = async (masterId) => {
    try {
      const profile = await loadMasterProfileRequest(masterId);
      setMasterProfile(profile);

      setFullName(profile.full_name || "");
      setAboutMe(profile.about_me || "");
      setExperienceYears(
        profile.experience_years === null ||
          profile.experience_years === undefined
          ? ""
          : String(profile.experience_years),
      );
      setWorkCity(profile.work_city || "");

      await Promise.all([
        loadAvailableOrders(masterId),
        loadMasterOrders(masterId),
      ]);

      return profile;
    } catch (error) {
      console.error("Ошибка загрузки мастера:", error);
      throw error;
    }
  };

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (authUser?.id && authUser.role === "master") {
      loadMasterData(authUser.id)
        .then(() => setIsLoggedIn(true))
        .catch((error) =>
          alert(error.message || "Не удалось загрузить кабинет мастера"),
        );
    }
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const validateForm = () => {
    if (!phone || !password) {
      alert("Заполни телефон и пароль");
      return false;
    }

    if (phone.length < 12) {
      alert("Введите корректный номер телефона");
      return false;
    }

    if (password.length < 6) {
      alert("Пароль должен быть не короче 6 символов");
      return false;
    }

    if (mode === "register") {
      if (!fullName.trim()) {
        alert("Введите имя");
        return false;
      }

      if (password !== confirmPassword) {
        alert("Пароли не совпадают");
        return false;
      }

      if (selectedCategories.length === 0) {
        alert("Выберите хотя бы одну категорию");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setSuccessText("");

      let authData;

      if (mode === "register") {
        authData = await registerRequest({
          role: "master",
          phone,
          password,
          fullName,
          categories: selectedCategories,
        });
      } else {
        authData = await loginRequest({
          role: "master",
          phone,
          password,
        });
      }

      saveAuthData(authData);
      await loadMasterData(authData.id);
      setIsLoggedIn(true);

      if (mode === "register") {
        setSuccessText("Регистрация мастера выполнена");
      } else {
        setSuccessText("Вход мастера выполнен");
      }
    } catch (error) {
      console.error("Ошибка авторизации мастера:", error);
      alert(error.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMasterProfile = async () => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      if (!fullName.trim()) {
        throw new Error("Введите имя");
      }

      const normalizedExperience =
        String(experienceYears).trim() === ""
          ? ""
          : String(Number(experienceYears));

      if (
        normalizedExperience !== "" &&
        (Number.isNaN(Number(experienceYears)) || Number(experienceYears) < 0)
      ) {
        throw new Error("Опыт должен быть числом 0 или больше");
      }

      const updatedProfile = await updateMasterProfileRequest({
        masterId: masterProfile.id,
        fullName: fullName.trim(),
        aboutMe,
        experienceYears: normalizedExperience,
        workCity,
      });

      setMasterProfile(updatedProfile);
      setFullName(updatedProfile.full_name || "");
      setAboutMe(updatedProfile.about_me || "");
      setExperienceYears(
        updatedProfile.experience_years === null ||
          updatedProfile.experience_years === undefined
          ? ""
          : String(updatedProfile.experience_years),
      );
      setWorkCity(updatedProfile.work_city || "");
      setSuccessText("Профиль мастера сохранён");
    } catch (error) {
      console.error("Ошибка сохранения профиля мастера:", error);
      alert(error.message || "Не удалось сохранить профиль мастера");
    }
  };

  const handleUploadAvatar = async () => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      if (!avatarFile) {
        throw new Error("Сначала выберите файл аватарки");
      }

      setIsAvatarLoading(true);

      const updatedProfile = await uploadMasterAvatarRequest({
        masterId: masterProfile.id,
        avatar: avatarFile,
      });

      setMasterProfile(updatedProfile);
      setAvatarFile(null);
      setSuccessText("Аватарка обновлена");
    } catch (error) {
      console.error("Ошибка загрузки аватарки:", error);
      alert(error.message || "Не удалось загрузить аватарку");
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      if (!idCardFront && !idCardBack && !selfiePhoto) {
        throw new Error("Выберите хотя бы один файл для загрузки");
      }

      setIsDocumentsLoading(true);

      const updatedProfile = await uploadMasterDocumentsRequest({
        masterId: masterProfile.id,
        idCardFront,
        idCardBack,
        selfiePhoto,
      });

      setMasterProfile(updatedProfile);
      setIdCardFront(null);
      setIdCardBack(null);
      setSelfiePhoto(null);
      setSuccessText("Документы загружены и отправлены на проверку");
    } catch (error) {
      console.error("Ошибка загрузки документов:", error);
      alert(error.message || "Не удалось загрузить документы");
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const handleTakeOrder = async (orderId) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      await assignOrderToMasterRequest(orderId, masterProfile.id);

      await Promise.all([
        loadAvailableOrders(masterProfile.id),
        loadMasterOrders(masterProfile.id),
      ]);

      setSuccessText("Заказ успешно принят");
    } catch (error) {
      console.error("Ошибка принятия заказа:", error);
      alert(error.message || "Не удалось взять заказ");
    }
  };

  const handleMasterStatusChange = async (orderId, status) => {
    try {
      if (!masterProfile?.id) {
        throw new Error("Профиль мастера не загружен");
      }

      const updatedOrder = await updateOrderStatusByMasterRequest({
        orderId,
        status,
        masterId: masterProfile.id,
      });

      setMasterOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? { ...updatedOrder } : order,
        ),
      );

      if (status === "on_the_way") {
        setSuccessText("Статус обновлён: мастер выехал");
      } else if (status === "on_site") {
        setSuccessText("Статус обновлён: мастер на месте");
      } else if (status === "completed") {
        setSuccessText("Заказ завершён");
      } else {
        setSuccessText("Статус заказа обновлён");
      }
    } catch (error) {
      console.error("Ошибка смены статуса:", error);
      alert(error.message || "Не удалось обновить статус");
    }
  };

  const logout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setMasterProfile(null);
    setAvailableOrders([]);
    setMasterOrders([]);
    setPhone("");
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setSelectedCategories([]);
    setAboutMe("");
    setExperienceYears("");
    setWorkCity("");
    setAvatarFile(null);
    setIdCardFront(null);
    setIdCardBack(null);
    setSelfiePhoto(null);
    setSuccessText("");
    setMode("login");
    setOpenedPhoto(null);
    setActiveSection("profile");

    if (onLogout) {
      onLogout();
    }
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

    isLoading,
    isLoggedIn,
    masterProfile,

    availableOrders,
    setAvailableOrders,
    masterOrders,

    isAvailableLoading,
    isMasterOrdersLoading,
    isAvatarLoading,
    isDocumentsLoading,

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
    loadAvailableOrders,
    loadMasterOrders,
    logout,
  };
}