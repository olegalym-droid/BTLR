import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROFILE, EMPTY_ADDRESS_FORM } from "../lib/constants";
import {
  getStoredProfile,
  saveStoredProfile,
  getPrimaryAddressFromProfile,
  buildAddressString,
} from "../lib/profile";

export default function useProfile() {
  const [profile, setProfile] = useState(getStoredProfile);
  const [address, setAddress] = useState(() =>
    getPrimaryAddressFromProfile(getStoredProfile()),
  );
  const [newAddressForm, setNewAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!profileSaved) return;

    const timer = setTimeout(() => setProfileSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [profileSaved]);

  const syncProfileFromStorage = useCallback(() => {
    const storedProfile = getStoredProfile();
    setProfile(storedProfile);
    setAddress(getPrimaryAddressFromProfile(storedProfile));
  }, []);

  const saveProfile = () => {
    saveStoredProfile(profile);
    setProfileSaved(true);
    setAddress(getPrimaryAddressFromProfile(profile));
  };

  const addAddress = () => {
    const city = String(newAddressForm.city || "").trim();
    const street = String(newAddressForm.street || "").trim();
    const house = String(newAddressForm.house || "").trim();

    if (!city || !street || !house) {
      alert("Заполни хотя бы город, улицу и дом");
      return;
    }

    const fullAddress = buildAddressString({
      city,
      street,
      house,
      apartment: newAddressForm.apartment || "",
    });

    const hasDuplicate = profile.addresses.some(
      (item) => String(item).trim().toLowerCase() === fullAddress.toLowerCase(),
    );

    if (hasDuplicate) {
      alert("Такой адрес уже есть");
      return;
    }

    const updatedProfile = {
      ...profile,
      addresses: [...profile.addresses, fullAddress],
      primaryAddressIndex:
        profile.addresses.length === 0 ? 0 : profile.primaryAddressIndex,
    };

    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    setAddress(getPrimaryAddressFromProfile(updatedProfile));
    setNewAddressForm(EMPTY_ADDRESS_FORM);
    setProfileSaved(true);
  };

  const removeAddress = (indexToRemove) => {
    const updatedAddresses = profile.addresses.filter(
      (_, index) => index !== indexToRemove,
    );

    let nextPrimaryIndex = profile.primaryAddressIndex;

    if (updatedAddresses.length === 0) {
      nextPrimaryIndex = 0;
    } else if (indexToRemove === profile.primaryAddressIndex) {
      nextPrimaryIndex = 0;
    } else if (indexToRemove < profile.primaryAddressIndex) {
      nextPrimaryIndex = profile.primaryAddressIndex - 1;
    }

    const updatedProfile = {
      ...profile,
      addresses: updatedAddresses,
      primaryAddressIndex: nextPrimaryIndex,
    };

    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    setAddress(getPrimaryAddressFromProfile(updatedProfile));
    setProfileSaved(true);
  };

  const setPrimaryAddress = (index) => {
    const updatedProfile = {
      ...profile,
      primaryAddressIndex: index,
    };

    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    setAddress(getPrimaryAddressFromProfile(updatedProfile));
    setProfileSaved(true);
  };

  const resetProfileState = () => {
    setProfile({ ...DEFAULT_PROFILE, addresses: [] });
    setNewAddressForm(EMPTY_ADDRESS_FORM);
    setAddress("");
    setProfileSaved(false);
  };

  return {
    profile,
    setProfile,
    address,
    setAddress,
    newAddressForm,
    setNewAddressForm,
    profileSaved,
    saveProfile,
    addAddress,
    removeAddress,
    setPrimaryAddress,
    resetProfileState,
    syncProfileFromStorage,
  };
}
