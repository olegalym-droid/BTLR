import AdminMastersSection from "./AdminMastersSection";

export default function AdminDashboard({
  pendingMasters,
  selectedMaster,
  setSelectedMaster,
  handleApproveMaster,
  isLoading,
  successText,
  logout,
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-white p-6 shadow space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-black">Кабинет администратора</h1>

          <button
            onClick={logout}
            className="rounded-xl border px-4 py-2 text-black"
          >
            Выйти
          </button>
        </div>

        {successText && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successText}
          </div>
        )}
      </div>

      <AdminMastersSection
        pendingMasters={pendingMasters}
        selectedMaster={selectedMaster}
        setSelectedMaster={setSelectedMaster}
        handleApproveMaster={handleApproveMaster}
        isLoading={isLoading}
      />
    </div>
  );
}