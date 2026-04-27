import { useEffect, useState } from "react";
import {
  updateOrderStatusRequest,
  confirmMasterForOrderRequest,
  rejectMasterForOrderRequest,
  createReviewRequest,
  createComplaintRequest,
  ORDER_STATUSES,
  COMPLAINT_REASONS,
  PAYMENT_BLOCKING_COMPLAINT_STATUSES,
} from "../lib/orders";

const REVIEW_COMMENT_MAX_LENGTH = 300;
const COMPLAINT_MAX_LENGTH = 1000;

export default function useOrderDetailsActions({
  selectedOrder,
  onStatusChange,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState(null);
  const [openedPhoto, setOpenedPhoto] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState(
    COMPLAINT_REASONS[0]?.value || "other",
  );
  const [complaintText, setComplaintText] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
    setRating(0);
    setComment("");
    setShowComplaintForm(false);
    setComplaintReason(COMPLAINT_REASONS[0]?.value || "other");
    setComplaintText("");
    setComplaintSubmitted(false);
    setProcessingOfferId(null);
    setIsPaying(false);
    setIsSubmittingReview(false);
    setIsSubmittingComplaint(false);
    setOpenedPhoto(null);
  }, [selectedOrder?.id]);

  const handlePay = async () => {
    try {
      setIsPaying(true);

      const updatedOrder = await updateOrderStatusRequest({
        orderId: selectedOrder.id,
        status: ORDER_STATUSES.PAID,
      });

      onStatusChange(updatedOrder);
    } catch (error) {
      console.error("Ошибка оплаты:", error);
      alert(error.message || "Не удалось обновить оплату");
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmMaster = async (offerId) => {
    try {
      setProcessingOfferId(offerId);

      const updatedOrder = await confirmMasterForOrderRequest({
        orderId: selectedOrder.id,
        offerId,
      });

      onStatusChange(updatedOrder);
    } catch (error) {
      console.error("Ошибка подтверждения мастера:", error);
      alert(error.message || "Не удалось выбрать мастера");
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleRejectMaster = async (offerId) => {
    try {
      setProcessingOfferId(offerId);

      const updatedOrder = await rejectMasterForOrderRequest({
        orderId: selectedOrder.id,
        offerId,
      });

      onStatusChange(updatedOrder);
    } catch (error) {
      console.error("Ошибка отклонения мастера:", error);
      alert(error.message || "Не удалось отклонить мастера");
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleCommentChange = (event) => {
    setComment(event.target.value.slice(0, REVIEW_COMMENT_MAX_LENGTH));
  };

  const handleComplaintChange = (event) => {
    setComplaintText(event.target.value.slice(0, COMPLAINT_MAX_LENGTH));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("Поставьте оценку");
      return;
    }

    try {
      setIsSubmittingReview(true);

      await createReviewRequest({
        orderId: selectedOrder.id,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);
      onStatusChange({
        ...selectedOrder,
        reviewed: true,
      });
    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);
      alert(error.message || "Не удалось отправить отзыв");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitComplaint = async () => {
    try {
      setIsSubmittingComplaint(true);

      const complaint = await createComplaintRequest({
        orderId: selectedOrder.id,
        reason: complaintReason,
        text: complaintText.trim(),
      });

      onStatusChange({
        ...selectedOrder,
        active_payment_blocking_complaint:
          complaint.payment_blocked === undefined
            ? PAYMENT_BLOCKING_COMPLAINT_STATUSES.includes(complaint.status)
            : complaint.payment_blocked,
        complaints: [
          complaint,
          ...(Array.isArray(selectedOrder.complaints)
            ? selectedOrder.complaints
            : []),
        ],
      });

      setComplaintSubmitted(true);
      setShowComplaintForm(false);
      setComplaintReason(COMPLAINT_REASONS[0]?.value || "other");
      setComplaintText("");
      alert("Жалоба отправлена администратору");
    } catch (error) {
      console.error("Ошибка отправки жалобы:", error);
      alert(error.message || "Не удалось отправить жалобу");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const showReviewForm =
    selectedOrder?.status === ORDER_STATUSES.PAID &&
    !selectedOrder?.reviewed &&
    !submitted;

  const hasActiveComplaintStatus = Array.isArray(selectedOrder?.complaints)
    ? selectedOrder.complaints.some((item) =>
        PAYMENT_BLOCKING_COMPLAINT_STATUSES.includes(item.status),
      )
    : false;

  const hasActiveComplaint = Array.isArray(selectedOrder?.complaints)
    ? selectedOrder.complaints.some((item) =>
        item.payment_blocked === undefined
          ? PAYMENT_BLOCKING_COMPLAINT_STATUSES.includes(item.status)
          : item.payment_blocked,
      )
    : Boolean(selectedOrder?.active_payment_blocking_complaint);

  const canComplain =
    !hasActiveComplaintStatus &&
    (selectedOrder?.status === ORDER_STATUSES.ASSIGNED ||
      selectedOrder?.status === ORDER_STATUSES.ON_THE_WAY ||
      selectedOrder?.status === ORDER_STATUSES.ON_SITE ||
      selectedOrder?.status === ORDER_STATUSES.COMPLETED ||
      selectedOrder?.status === ORDER_STATUSES.PAID);

  return {
    rating,
    setRating,
    comment,
    submitted,
    isPaying,
    processingOfferId,
    openedPhoto,
    setOpenedPhoto,
    isSubmittingReview,
    showComplaintForm,
    setShowComplaintForm,
    complaintReason,
    setComplaintReason,
    complaintText,
    isSubmittingComplaint,
    complaintSubmitted,

    handlePay,
    handleConfirmMaster,
    handleRejectMaster,
    handleCommentChange,
    handleComplaintChange,
    handleSubmitReview,
    handleSubmitComplaint,

    showReviewForm,
    canComplain,
    hasActiveComplaint,
  };
}
