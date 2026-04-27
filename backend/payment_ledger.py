from datetime import datetime

from fastapi import HTTPException

from models import Account, Order

PAYOUT_UNPAID = "unpaid"
PAYOUT_FROZEN = "frozen"
PAYOUT_AVAILABLE = "available"
PAYOUT_REFUNDED_TO_CLIENT = "refunded_to_client"


def parse_amount_to_int(raw_value: str | None) -> int:
    if not raw_value:
        return 0

    cleaned = (
        str(raw_value)
        .replace("₸", "")
        .replace(" ", "")
        .replace(",", "")
        .strip()
    )

    return int(cleaned) if cleaned.isdigit() else 0


def set_money(account: Account, field_name: str, value: int) -> None:
    setattr(account, field_name, str(max(value, 0)))


def get_total_balance(master: Account) -> int:
    return parse_amount_to_int(master.balance_amount)


def get_available_balance(master: Account) -> int:
    return parse_amount_to_int(master.available_withdraw_amount)


def get_frozen_balance(master: Account) -> int:
    return parse_amount_to_int(master.frozen_balance_amount)


def get_order_payout_amount(order: Order) -> int:
    amount = parse_amount_to_int(order.price or order.client_price)

    if amount <= 0:
        raise HTTPException(status_code=400, detail="У заказа не указана сумма")

    return amount


def freeze_paid_order_payout(order: Order, master: Account, amount: int) -> None:
    if order.payout_status == PAYOUT_FROZEN:
        return

    if order.payout_status in {PAYOUT_REFUNDED_TO_CLIENT}:
        raise HTTPException(
            status_code=400,
            detail="Деньги по этому заказу уже возвращены клиенту",
        )

    total = get_total_balance(master)
    available = get_available_balance(master)
    frozen = get_frozen_balance(master)

    if order.payout_status in {None, "", PAYOUT_UNPAID}:
        set_money(master, "balance_amount", total + amount)
    elif order.payout_status == PAYOUT_AVAILABLE:
        if available < amount:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Нельзя открыть денежный спор: часть средств уже "
                    "недоступна для заморозки"
                ),
            )

        set_money(master, "available_withdraw_amount", available - amount)
    else:
        raise HTTPException(status_code=400, detail="Некорректный статус выплаты")

    set_money(master, "frozen_balance_amount", frozen + amount)
    order.payout_status = PAYOUT_FROZEN
    order.payout_updated_at = datetime.utcnow()


def release_order_payout_to_master(order: Order, master: Account, amount: int) -> None:
    if order.payout_status == PAYOUT_AVAILABLE:
        return

    total = get_total_balance(master)
    available = get_available_balance(master)
    frozen = get_frozen_balance(master)

    if order.payout_status in {None, "", PAYOUT_UNPAID}:
        set_money(master, "balance_amount", total + amount)
    elif order.payout_status == PAYOUT_FROZEN:
        set_money(master, "frozen_balance_amount", max(frozen - amount, 0))
    elif order.payout_status == PAYOUT_REFUNDED_TO_CLIENT:
        raise HTTPException(
            status_code=400,
            detail="Деньги по этому заказу уже возвращены клиенту",
        )
    else:
        raise HTTPException(status_code=400, detail="Некорректный статус выплаты")

    set_money(master, "available_withdraw_amount", available + amount)
    order.payout_status = PAYOUT_AVAILABLE
    order.payout_updated_at = datetime.utcnow()


def refund_order_payout_to_client(order: Order, master: Account, amount: int) -> None:
    if order.payout_status == PAYOUT_REFUNDED_TO_CLIENT:
        return

    total = get_total_balance(master)
    available = get_available_balance(master)
    frozen = get_frozen_balance(master)

    if order.payout_status == PAYOUT_AVAILABLE:
        if available < amount:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Нельзя вернуть деньги клиенту: часть средств уже "
                    "недоступна"
                ),
            )

        set_money(master, "available_withdraw_amount", available - amount)
        set_money(master, "balance_amount", total - amount)
    elif order.payout_status == PAYOUT_FROZEN:
        set_money(master, "frozen_balance_amount", max(frozen - amount, 0))
        set_money(master, "balance_amount", total - amount)
    elif order.payout_status in {None, "", PAYOUT_UNPAID}:
        pass
    else:
        raise HTTPException(status_code=400, detail="Некорректный статус выплаты")

    order.payout_status = PAYOUT_REFUNDED_TO_CLIENT
    order.payout_updated_at = datetime.utcnow()
