import { useState } from "react";
import {
  DEFAULT_SCHEDULE_FORM,
  loadMasterScheduleRequest,
  saveMasterScheduleRequest,
  sortScheduleItems,
} from "../lib/masterSchedule";

export default function useMasterSchedule() {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [scheduleForm, setScheduleForm] = useState(DEFAULT_SCHEDULE_FORM);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  const loadMasterSchedule = async (masterId) => {
    try {
      setIsScheduleLoading(true);

      const data = await loadMasterScheduleRequest(masterId);
      const normalized = sortScheduleItems(
        (Array.isArray(data) ? data : []).map((item) => ({
          id: item.id,
          weekday: Number(item.weekday),
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      );

      setScheduleItems(normalized);
      return normalized;
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const addScheduleItem = () => {
    const weekday = Number(scheduleForm.weekday);
    const startTime = String(scheduleForm.startTime || "").trim();
    const endTime = String(scheduleForm.endTime || "").trim();

    if (Number.isNaN(weekday) || weekday < 0 || weekday > 6) {
      throw new Error("Выберите корректный день недели");
    }

    if (!startTime || !endTime) {
      throw new Error("Укажите время начала и конца");
    }

    if (startTime >= endTime) {
      throw new Error("Время окончания должно быть позже времени начала");
    }

    const duplicateExists = scheduleItems.some(
      (item) =>
        Number(item.weekday) === weekday &&
        String(item.start_time) === startTime &&
        String(item.end_time) === endTime,
    );

    if (duplicateExists) {
      throw new Error("Такой слот уже есть в графике");
    }

    const nextItems = sortScheduleItems([
      ...scheduleItems,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        weekday,
        start_time: startTime,
        end_time: endTime,
      },
    ]);

    setScheduleItems(nextItems);
  };

  const removeScheduleItem = (itemToRemove) => {
    setScheduleItems((prev) =>
      prev.filter((item) => item.id !== itemToRemove.id),
    );
  };

  const saveMasterSchedule = async (masterId) => {
    try {
      setIsScheduleSaving(true);

      const saved = await saveMasterScheduleRequest({
        masterId,
        scheduleItems: scheduleItems.map((item) => ({
          weekday: Number(item.weekday),
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      });

      const normalized = sortScheduleItems(
        (Array.isArray(saved) ? saved : []).map((item) => ({
          id: item.id,
          weekday: Number(item.weekday),
          start_time: item.start_time,
          end_time: item.end_time,
        })),
      );

      setScheduleItems(normalized);
      return normalized;
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const resetMasterScheduleState = () => {
    setScheduleItems([]);
    setScheduleForm(DEFAULT_SCHEDULE_FORM);
    setIsScheduleLoading(false);
    setIsScheduleSaving(false);
  };

  return {
    scheduleItems,
    setScheduleItems,
    scheduleForm,
    setScheduleForm,
    isScheduleLoading,
    isScheduleSaving,
    loadMasterSchedule,
    addScheduleItem,
    removeScheduleItem,
    saveMasterSchedule,
    resetMasterScheduleState,
  };
}