import { API_BASE_URL } from "./constants";
import { getStoredAuthUser } from "./auth";

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Понедельник" },
  { value: 1, label: "Вторник" },
  { value: 2, label: "Среда" },
  { value: 3, label: "Четверг" },
  { value: 4, label: "Пятница" },
  { value: 5, label: "Суббота" },
  { value: 6, label: "Воскресенье" },
];

export const DEFAULT_SCHEDULE_FORM = {
  weekday: 0,
  startTime: "09:00",
  endTime: "18:00",
};

const getStoredMasterAuth = () => getStoredAuthUser("master");

export const loadMasterScheduleRequest = async (masterId) => {
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/schedule`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось загрузить график мастера");
  }

  return Array.isArray(data) ? data : [];
};

export const saveMasterScheduleRequest = async ({
  masterId,
  scheduleItems,
}) => {
  const resolvedMasterId = masterId || getStoredMasterAuth()?.id;

  if (!resolvedMasterId) {
    throw new Error("Мастер не авторизован");
  }

  if (!Array.isArray(scheduleItems)) {
    throw new Error("Некорректные данные графика");
  }

  const normalizedItems = scheduleItems.map((item) => ({
    weekday: Number(item.weekday),
    start_time: String(item.start_time ?? item.startTime ?? "").trim(),
    end_time: String(item.end_time ?? item.endTime ?? "").trim(),
  }));

  const response = await fetch(
    `${API_BASE_URL}/masters/${resolvedMasterId}/schedule`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedItems),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Не удалось сохранить график мастера");
  }

  return Array.isArray(data) ? data : [];
};

export const getWeekdayLabel = (weekday) => {
  const found = WEEKDAY_OPTIONS.find((item) => item.value === weekday);
  return found ? found.label : `День ${weekday}`;
};

export const sortScheduleItems = (items = []) => {
  return [...items].sort((a, b) => {
    if (a.weekday !== b.weekday) {
      return a.weekday - b.weekday;
    }

    const aStart = String(a.start_time ?? a.startTime ?? "");
    const bStart = String(b.start_time ?? b.startTime ?? "");

    return aStart.localeCompare(bStart);
  });
};