import { useMemo, useState } from "react";
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
  avatarFile,
  setAvatarFile,
  handleUploadAvatar,
  isAvatarLoading,
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  hasUploadedAllDocuments,
  isDocumentsLoading,
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
  activeSection,
  setActiveSection,
}) {
  const [ordersTab, setOrdersTab] = useState("search");

  const currentOrders = useMemo(
    () =>
      masterOrders.filter(
        (order) => order.status !== "completed" && order.status !== "paid",
      ),
    [masterOrders],
  );

  const completedOrders = useMemo(
    () =>
      masterOrders.filter(
        (order) => order.status === "completed" || order.status === "paid",
      ),
    [masterOrders],
  );

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 rounded-2xl border border-gray-300 bg-white p-2 shadow">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "profile"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Профиль
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("orders")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === "orders"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Заказы
          </button>
        </div>

        {activeSection === "profile" && (
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
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleUploadAvatar={handleUploadAvatar}
            isAvatarLoading={isAvatarLoading}
            idCardFront={idCardFront}
            setIdCardFront={setIdCardFront}
            idCardBack={idCardBack}
            setIdCardBack={setIdCardBack}
            selfiePhoto={selfiePhoto}
            setSelfiePhoto={setSelfiePhoto}
            handleUploadDocuments={handleUploadDocuments}
            hasUploadedAllDocuments={hasUploadedAllDocuments}
            isDocumentsLoading={isDocumentsLoading}
          />
        )}

        {activeSection === "orders" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 rounded-2xl border border-gray-300 bg-white p-2 shadow">
              <button
                type="button"
                onClick={() => setOrdersTab("search")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "search"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Поиск заказов
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("active")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "active"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Активные
              </button>

              <button
                type="button"
                onClick={() => setOrdersTab("completed")}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  ordersTab === "completed"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                Выполненные
              </button>
            </div>

            {ordersTab === "search" && (
              <MasterAvailableOrdersSection
                masterProfile={masterProfile}
                availableOrders={availableOrders}
                isAvailableLoading={isAvailableLoading}
                loadAvailableOrders={loadAvailableOrders}
                handleTakeOrder={handleTakeOrder}
                setAvailableOrders={setAvailableOrders}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "active" && (
              <MasterOrdersSection
                title="Активные заказы"
                emptyText="У вас нет активных заказов"
                masterProfile={masterProfile}
                masterOrders={currentOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                onOpenPhoto={setOpenedPhoto}
              />
            )}

            {ordersTab === "completed" && (
              <MasterOrdersSection
                title="Выполненные заказы"
                emptyText="У вас нет выполненных заказов"
                masterProfile={masterProfile}
                masterOrders={completedOrders}
                isMasterOrdersLoading={isMasterOrdersLoading}
                loadMasterOrders={loadMasterOrders}
                handleMasterStatusChange={handleMasterStatusChange}
                onOpenPhoto={setOpenedPhoto}
              />
            )}
          </div>
        )}
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
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