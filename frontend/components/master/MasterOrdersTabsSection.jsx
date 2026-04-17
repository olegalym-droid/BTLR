import { useMemo, useState } from "react";
import MasterAvailableOrdersSection from "./MasterAvailableOrdersSection";
import MasterOrdersSection from "./MasterOrdersSection";
import {
  MASTER_ACTIVE_ORDER_STATUSES,
  MASTER_DONE_ORDER_STATUSES,
} from "../../lib/orders";

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