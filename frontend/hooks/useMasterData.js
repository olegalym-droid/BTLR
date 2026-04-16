import useMasterProfile from "./useMasterProfile";
import useMasterOrders from "./useMasterOrders";
import useMasterSchedule from "./useMasterSchedule";

export default function useMasterData() {
  const profile = useMasterProfile();
  const orders = useMasterOrders();
  const schedule = useMasterSchedule();

  const loadMasterData = async (masterId) => {
    const loadedProfile = await profile.loadMasterProfile(masterId);

    await Promise.all([
      orders.loadMasterOrders(masterId),
      schedule.loadMasterSchedule(masterId),
    ]);

    if (loadedProfile?.verification_status === "approved") {
      await orders.loadAvailableOrders(masterId);
    } else {
      orders.setAvailableOrders([]);
    }

    return loadedProfile;
  };

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