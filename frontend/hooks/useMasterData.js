import useMasterProfile from "./useMasterProfile";
import useMasterOrders from "./useMasterOrders";

export default function useMasterData() {
  const profile = useMasterProfile();
  const orders = useMasterOrders();

  const loadMasterData = async (masterId) => {
    const loadedProfile = await profile.loadMasterProfile(masterId);

    await orders.loadMasterOrders(masterId);

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
  };

  return {
    ...profile,
    ...orders,
    loadMasterData,
    resetMasterDataState,
  };
}