import { useEffect, useState } from "react";
import {
  updateOrderStatusRequest,
  confirmMasterForOrderRequest,
  rejectMasterForOrderRequest,
  createReviewRequest,
  createComplaintRequest,
  ORDER_STATUSES,
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
  const [complaintText, setComplaintText] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
    setRating(0);
    setComment("");
    setShowComplaintForm(false);
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

      await createComplaintRequest({
        orderId: selectedOrder.id,
        text: complaintText.trim(),
      });

      setComplaintSubmitted(true);
      setShowComplaintForm(false);
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

  const canComplain =
    selectedOrder?.status === ORDER_STATUSES.ASSIGNED ||
    selectedOrder?.status === ORDER_STATUSES.ON_THE_WAY ||
    selectedOrder?.status === ORDER_STATUSES.ON_SITE ||
    selectedOrder?.status === ORDER_STATUSES.COMPLETED ||
    selectedOrder?.status === ORDER_STATUSES.PAID;

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
  };
}