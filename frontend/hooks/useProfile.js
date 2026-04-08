import { useEffect, useState } from "react";
import { DEFAULT_PROFILE, EMPTY_ADDRESS_FORM } from "../lib/constants";
import {
  getStoredProfile,
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

  const syncProfileFromStorage = () => {
    const storedProfile = getStoredProfile();
    setProfile(storedProfile);
    setAddress(getPrimaryAddressFromProfile(storedProfile));
  };

  const saveProfile = () => {
    localStorage.setItem("resident_profile", JSON.stringify(profile));
    setProfileSaved(true);
    setAddress(getPrimaryAddressFromProfile(profile));
  };

  const addAddress = () => {
    const fullAddress = buildAddressString(newAddressForm);

    if (
      !newAddressForm.city.trim() ||
      !newAddressForm.street.trim() ||
      !newAddressForm.house.trim()
    ) {
      alert("Заполни хотя бы город, улицу и дом");
      return;
    }

    const updatedAddresses = [...profile.addresses, fullAddress];

    setProfile((prev) => ({
      ...prev,
      addresses: updatedAddresses,
      primaryAddressIndex:
        updatedAddresses.length === 1 ? 0 : prev.primaryAddressIndex,
    }));

    setNewAddressForm(EMPTY_ADDRESS_FORM);
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
    setAddress((currentAddress) => {
      const primaryAddress = getPrimaryAddressFromProfile(updatedProfile);
      return currentAddress === profile.addresses[indexToRemove]
        ? primaryAddress
        : currentAddress;
    });
  };

  const setPrimaryAddress = (index) => {
    const updatedProfile = {
      ...profile,
      primaryAddressIndex: index,
    };

    setProfile(updatedProfile);
    setAddress(getPrimaryAddressFromProfile(updatedProfile));
  };

  const resetProfileState = () => {
    setProfile(DEFAULT_PROFILE);
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