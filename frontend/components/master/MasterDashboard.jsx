import MasterProfileSection from "./MasterProfileSection";
import MasterAvailableOrdersSection from "./MasterAvailableOrdersSection";
import MasterOrdersSection from "./MasterOrdersSection";

export default function MasterDashboard({
  masterProfile,
  fullName,
  setFullName,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  workDistrict,
  setWorkDistrict,
  handleSaveMasterProfile,
  successText,
  logout,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  openedPhoto,
  setOpenedPhoto,
}) {
  return (
    <>
      <div className="space-y-6">
        <MasterProfileSection
          masterProfile={masterProfile}
          fullName={fullName}
          setFullName={setFullName}
          aboutMe={aboutMe}
          setAboutMe={setAboutMe}
          experienceYears={experienceYears}
          setExperienceYears={setExperienceYears}
          workCity={workCity}
          setWorkCity={setWorkCity}
          workDistrict={workDistrict}
          setWorkDistrict={setWorkDistrict}
          handleSaveMasterProfile={handleSaveMasterProfile}
          successText={successText}
          logout={logout}
        />

        <MasterAvailableOrdersSection
          masterProfile={masterProfile}
          availableOrders={availableOrders}
          isAvailableLoading={isAvailableLoading}
          loadAvailableOrders={loadAvailableOrders}
          handleTakeOrder={handleTakeOrder}
          setAvailableOrders={setAvailableOrders}
          onOpenPhoto={setOpenedPhoto}
        />

        <MasterOrdersSection
          masterProfile={masterProfile}
          masterOrders={masterOrders}
          isMasterOrdersLoading={isMasterOrdersLoading}
          loadMasterOrders={loadMasterOrders}
          handleMasterStatusChange={handleMasterStatusChange}
          onOpenPhoto={setOpenedPhoto}
        />
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </>
  );
}
