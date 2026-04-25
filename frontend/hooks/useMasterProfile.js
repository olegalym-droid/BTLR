import { useCallback, useState } from "react";
import {
  loadMasterProfileRequest,
  updateMasterProfileRequest,
  uploadMasterAvatarRequest,
  uploadMasterDocumentsRequest,
} from "../lib/auth";

export default function useMasterProfile() {
  const [masterProfile, setMasterProfile] = useState(null);

  const [fullName, setFullName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [workCity, setWorkCity] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  const hasUploadedAllDocuments = Boolean(
    masterProfile?.id_card_front_path &&
      masterProfile?.id_card_back_path &&
      masterProfile?.selfie_photo_path,
  );

  const applyProfileToState = useCallback((profile) => {
    setMasterProfile(profile);
    setFullName(profile?.full_name || "");
    setAboutMe(profile?.about_me || "");
    setExperienceYears(
      profile?.experience_years === null ||
        profile?.experience_years === undefined
        ? ""
        : String(profile.experience_years),
    );
    setWorkCity(profile?.work_city || "");
  }, []);

  const loadMasterProfile = useCallback(async (masterId) => {
    const profile = await loadMasterProfileRequest(masterId);
    applyProfileToState(profile);
    return profile;
  }, [applyProfileToState]);

  const handleSaveMasterProfile = async () => {
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

    applyProfileToState(updatedProfile);
    return updatedProfile;
  };

  const handleUploadAvatar = async () => {
    if (!masterProfile?.id) {
      throw new Error("Профиль мастера не загружен");
    }

    if (!avatarFile) {
      throw new Error("Сначала выберите файл аватарки");
    }

    try {
      setIsAvatarLoading(true);

      const updatedProfile = await uploadMasterAvatarRequest({
        masterId: masterProfile.id,
        avatar: avatarFile,
      });

      setMasterProfile(updatedProfile);
      setAvatarFile(null);

      return updatedProfile;
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!masterProfile?.id) {
      throw new Error("Профиль мастера не загружен");
    }

    if (!idCardFront && !idCardBack && !selfiePhoto) {
      throw new Error("Выберите хотя бы один файл для загрузки");
    }

    try {
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

      return updatedProfile;
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const resetMasterProfileState = () => {
    setMasterProfile(null);

    setFullName("");
    setAboutMe("");
    setExperienceYears("");
    setWorkCity("");

    setAvatarFile(null);
    setIdCardFront(null);
    setIdCardBack(null);
    setSelfiePhoto(null);

    setIsAvatarLoading(false);
    setIsDocumentsLoading(false);
  };

  return {
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

    applyProfileToState,
    loadMasterProfile,
    handleSaveMasterProfile,
    handleUploadAvatar,
    handleUploadDocuments,
    resetMasterProfileState,
  };
}
