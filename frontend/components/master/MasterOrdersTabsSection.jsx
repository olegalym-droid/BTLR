import { useMemo, useState } from "react";
import MasterAvailableOrdersSection from "./MasterAvailableOrdersSection";
import MasterOrdersSection from "./MasterOrdersSection";
import {
  MASTER_ACTIVE_ORDER_STATUSES,
  MASTER_DONE_ORDER_STATUSES,
} from "../../lib/orders";

const TABS = [
  {
    key: "search",
    label: "Поиск заказов",
  },
  {
    key: "active",
    label: "Активные",
  },
  {
    key: "completed",
    label: "Выполненные",
  },
];

export default function MasterOrdersTabsSection({
  masterProfile,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  reportPhotos,
  setReportPhotos,
  reportTargetOrderId,
  setReportTargetOrderId,
  handleUploadOrderReport,
  isReportUploading,
  setOpenedPhoto,
}) {
  const [ordersTab, setOrdersTab] = useState("search");

  const currentOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_ACTIVE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

  const completedOrders = useMemo(
    () =>
      masterOrders.filter((order) =>
        MASTER_DONE_ORDER_STATUSES.includes(order.status),
      ),
    [masterOrders],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-gray-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TABS.map((tab) => {
            const isActive = ordersTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setOrdersTab(tab.key)}
                className={`min-h-[56px] rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#6f9f72] text-white shadow-sm"
                    : "bg-white text-[#26312c] hover:bg-[#f7faf6]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
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
          reportPhotos={reportPhotos}
          setReportPhotos={setReportPhotos}
          reportTargetOrderId={reportTargetOrderId}
          setReportTargetOrderId={setReportTargetOrderId}
          handleUploadOrderReport={handleUploadOrderReport}
          isReportUploading={isReportUploading}
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
          reportPhotos={reportPhotos}
          setReportPhotos={setReportPhotos}
          reportTargetOrderId={reportTargetOrderId}
          setReportTargetOrderId={setReportTargetOrderId}
          handleUploadOrderReport={handleUploadOrderReport}
          isReportUploading={isReportUploading}
          onOpenPhoto={setOpenedPhoto}
        />
      )}
    </div>
  );
}