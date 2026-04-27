COMPLAINT_REASON_LABELS = {
    "master_no_show": "Мастер не приехал",
    "late_arrival": "Мастер опоздал",
    "poor_quality": "Плохое качество работы",
    "rude_behavior": "Грубое поведение",
    "price_changed": "Цена изменилась",
    "property_damage": "Повреждение имущества",
    "other": "Другое",
}

COMPLAINT_STATUS_LABELS = {
    "new": "Новая",
    "in_progress": "В работе",
    "needs_details": "Нужны детали",
    "resolved": "Решена",
    "rejected": "Отклонена",
}

COMPLAINT_RESOLUTION_LABELS = {
    "client_favor": "В пользу клиента",
    "master_favor": "В пользу мастера",
    "needs_details": "Запрошены детали",
    "rejected": "Жалоба отклонена",
}

ALLOWED_COMPLAINT_REASONS = set(COMPLAINT_REASON_LABELS)
ALLOWED_COMPLAINT_STATUSES = set(COMPLAINT_STATUS_LABELS)
ALLOWED_COMPLAINT_RESOLUTIONS = set(COMPLAINT_RESOLUTION_LABELS)
ACTIVE_PAYMENT_BLOCKING_COMPLAINT_STATUSES = {
    "new",
    "in_progress",
    "needs_details",
}
FINAL_COMPLAINT_STATUSES = {"resolved", "rejected"}

RESOLUTION_STATUS_MAP = {
    "client_favor": "resolved",
    "master_favor": "resolved",
    "needs_details": "needs_details",
    "rejected": "rejected",
}


def get_complaint_reason_label(reason: str | None) -> str:
    return COMPLAINT_REASON_LABELS.get(reason or "", "Другое")


def get_complaint_status_label(status: str | None) -> str:
    return COMPLAINT_STATUS_LABELS.get(status or "", status or "—")


def get_complaint_resolution_label(resolution: str | None) -> str | None:
    if not resolution:
        return None

    return COMPLAINT_RESOLUTION_LABELS.get(resolution, resolution)
