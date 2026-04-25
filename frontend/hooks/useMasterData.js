import { useCallback } from "react";
import useMasterProfile from "./useMasterProfile";
import useMasterOrders from "./useMasterOrders";
import useMasterSchedule from "./useMasterSchedule";

export default function useMasterData() {
  const profile = useMasterProfile();
  const orders = useMasterOrders();
  const schedule = useMasterSchedule();

  const { loadMasterProfile } = profile;
  const {
    loadAvailableOrders,
    loadMasterOrders,
    setAvailableOrders,
  } = orders;
  const { loadMasterSchedule } = schedule;

  const loadMasterData = useCallback(async (masterId) => {
    const loadedProfile = await loadMasterProfile(masterId);

    await Promise.all([
      loadMasterOrders(masterId),
      loadMasterSchedule(masterId),
    ]);

    if (loadedProfile?.verification_status === "approved") {
      await loadAvailableOrders(masterId);
    } else {
      setAvailableOrders([]);
    }

    return loadedProfile;
  }, [
    loadAvailableOrders,
    loadMasterOrders,
    loadMasterProfile,
    loadMasterSchedule,
    setAvailableOrders,
  ]);

  const resetMasterDataState = () => {
    profile.resetMasterProfileState();
    orders.resetMasterOrdersState();
    schedule.resetMasterScheduleState();
  };

  return {
    ...profile,
    ...orders,
    ...schedule,
    loadMasterData,
    resetMasterDataState,
  };
}
