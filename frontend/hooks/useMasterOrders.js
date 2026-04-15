import { useState } from "react";
import {
  loadAvailableOrdersRequest,
  loadMasterOrdersRequest,
  assignOrderToMasterRequest,
  updateOrderStatusByMasterRequest,
  uploadOrderReportRequest,
  ORDER_STATUSES,
} from "../lib/orders";

export default function useMasterOrders() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [masterOrders, setMasterOrders] = useState([]);

  const [reportPhotos, setReportPhotos] = useState([]);
  const [reportTargetOrderId, setReportTargetOrderId] = useState(null);

  const [isAvailableLoading, setIsAvailableLoading] = useState(false);
  const [isMasterOrdersLoading, setIsMasterOrdersLoading] = useState(false);
  const [isReportUploading, setIsReportUploading] = useState(false);

  const loadAvailableOrders = async (masterId) => {
    try {
      setIsAvailableLoading(true);

      if (!masterId) {
        throw new Error("Мастер не авторизован");
      }

      const orders = await loadAvailableOrdersRequest(masterId);
      setAvailableOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки доступных заказов:", error);
      setAvailableOrders([]);
      throw error;
    } finally {
      setIsAvailableLoading(false);
    }
  };

  const loadMasterOrders = async (masterId) => {
    try {
      setIsMasterOrdersLoading(true);

      if (!masterId) {
        throw new Error("Мастер не авторизован");
      }

      const orders = await loadMasterOrdersRequest(masterId);
      setMasterOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Ошибка загрузки заказов мастера:", error);
      setMasterOrders([]);
      throw error;
    } finally {
      setIsMasterOrdersLoading(false);
    }
  };

  const handleTakeOrder = async (masterId, orderId, offeredPrice = "") => {
    if (!masterId) {
      throw new Error("Профиль мастера не загружен");
    }

    await assignOrderToMasterRequest(orderId, masterId, offeredPrice);

    await Promise.all([
      loadAvailableOrders(masterId),
      loadMasterOrders(masterId),
    ]);
  };

  const handleMasterStatusChange = async (masterId, orderId, status) => {
    if (!masterId) {
      throw new Error("Профиль мастера не загружен");
    }

    const updatedOrder = await updateOrderStatusByMasterRequest({
      orderId,
      status,
      masterId,
    });

    setMasterOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrder.id ? { ...updatedOrder } : order,
      ),
    );

    return updatedOrder;
  };

  const handleUploadOrderReport = async (masterId, orderId) => {
    if (!masterId) {
      throw new Error("Профиль мастера не загружен");
    }

    if (!Array.isArray(reportPhotos) || reportPhotos.length === 0) {
      throw new Error("Сначала выберите фото отчёта");
    }

    try {
      setIsReportUploading(true);

      const updatedOrder = await uploadOrderReportRequest({
        orderId,
        masterId,
        photos: reportPhotos,
      });

      setMasterOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? { ...updatedOrder } : order,
        ),
      );

      setReportPhotos([]);
      setReportTargetOrderId(null);

      return updatedOrder;
    } finally {
      setIsReportUploading(false);
    }
  };

  const getStatusSuccessText = (status) => {
    if (status === ORDER_STATUSES.ON_THE_WAY) {
      return "Статус обновлён: мастер выехал";
    }

    if (status === ORDER_STATUSES.ON_SITE) {
      return "Статус обновлён: мастер на месте";
    }

    if (status === ORDER_STATUSES.COMPLETED) {
      return "Заказ завершён";
    }

    return "Статус заказа обновлён";
  };

  const resetMasterOrdersState = () => {
    setAvailableOrders([]);
    setMasterOrders([]);
    setReportPhotos([]);
    setReportTargetOrderId(null);
    setIsAvailableLoading(false);
    setIsMasterOrdersLoading(false);
    setIsReportUploading(false);
  };

  return {
    availableOrders,
    setAvailableOrders,
    masterOrders,

    reportPhotos,
    setReportPhotos,
    reportTargetOrderId,
    setReportTargetOrderId,

    isAvailableLoading,
    isMasterOrdersLoading,
    isReportUploading,

    loadAvailableOrders,
    loadMasterOrders,
    handleTakeOrder,
    handleMasterStatusChange,
    handleUploadOrderReport,
    getStatusSuccessText,
    resetMasterOrdersState,
  };
}