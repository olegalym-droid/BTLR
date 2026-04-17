import { useState } from "react";
import AdminMastersSection from "./AdminMastersSection";
import AdminComplaintsSection from "./AdminComplaintsSection";
import AdminWithdrawalsSection from "./AdminWithdrawalsSection";

export default function AdminDashboard({
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  complaints,
  withdrawalRequests,
  successText,
  isLoading,
  handleApproveMaster,
  updateComplaintStatus,
  updateWithdrawalStatus,
  logout,
}) {
  const [activeTab, setActiveTab] = useState("masters");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-300 bg-white p-5 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-black">
            Панель администратора
          </h1>
          <p className="text-sm text-gray-600">
            Проверка мастеров, жалобы и заявки на вывод средств
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-black"
        >
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-3xl border border-gray-300 bg-white p-2 shadow md:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveTab("masters")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "masters"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Мастера
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("complaints")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "complaints"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Жалобы
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("withdrawals")}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "withdrawals"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Выводы
        </button>
      </div>

      {successText && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successText}
        </div>
      )}

      {activeTab === "masters" && (
        <AdminMastersSection
          pendingMasters={pendingMasters}
          selectedMaster={selectedMaster}
          setSelectedMaster={setSelectedMaster}
          isLoading={isLoading}
          handleApproveMaster={handleApproveMaster}
        />
      )}

      {activeTab === "complaints" && (
        <AdminComplaintsSection
          complaints={complaints}
          isLoading={isLoading}
          updateComplaintStatus={updateComplaintStatus}
        />
      )}

      {activeTab === "withdrawals" && (
        <AdminWithdrawalsSection
          withdrawalRequests={withdrawalRequests}
          isLoading={isLoading}
          updateWithdrawalStatus={updateWithdrawalStatus}
        />
      )}
    </div>
  );
}