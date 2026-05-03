from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from models import Account, ChatConversation, ChatMessage, Order

CHAT_TYPE_ORDER = "user_master"
CHAT_TYPE_ADMIN_USER = "admin_user"
CHAT_TYPE_ADMIN_MASTER = "admin_master"


def get_chat_conversation_query(db: Session):
    return db.query(ChatConversation).options(
        joinedload(ChatConversation.user),
        joinedload(ChatConversation.master),
        joinedload(ChatConversation.order),
        joinedload(ChatConversation.messages),
    )


def ensure_order_conversation(
    order: Order | None,
    db: Session,
) -> ChatConversation | None:
    if not order or not order.master_id:
        return None

    conversation = (
        get_chat_conversation_query(db)
        .filter(
            ChatConversation.conversation_type == CHAT_TYPE_ORDER,
            ChatConversation.order_id == order.id,
            ChatConversation.user_id == order.user_id,
            ChatConversation.master_id == order.master_id,
        )
        .first()
    )

    if conversation:
        return conversation

    conversation = ChatConversation(
        conversation_type=CHAT_TYPE_ORDER,
        order_id=order.id,
        user_id=order.user_id,
        master_id=order.master_id,
    )
    db.add(conversation)
    db.flush()

    return conversation


def ensure_admin_conversation(
    account: Account | None,
    db: Session,
) -> ChatConversation | None:
    if not account or account.role not in {"user", "master"}:
        return None

    conversation_type = (
        CHAT_TYPE_ADMIN_USER if account.role == "user" else CHAT_TYPE_ADMIN_MASTER
    )
    filters = [ChatConversation.conversation_type == conversation_type]

    if account.role == "user":
        filters.append(ChatConversation.user_id == account.id)
    else:
        filters.append(ChatConversation.master_id == account.id)

    conversation = get_chat_conversation_query(db).filter(*filters).first()

    if conversation:
        return conversation

    conversation = ChatConversation(
        conversation_type=conversation_type,
        user_id=account.id if account.role == "user" else None,
        master_id=account.id if account.role == "master" else None,
    )
    db.add(conversation)
    db.flush()

    return conversation


def add_system_message(
    conversation: ChatConversation | None,
    db: Session,
    text: str,
    *,
    read_by_user: bool = False,
    read_by_master: bool = False,
    read_by_admin: bool = False,
) -> ChatMessage | None:
    normalized_text = str(text or "").strip()

    if not conversation or not normalized_text:
        return None

    now = datetime.utcnow()
    message = ChatMessage(
        conversation_id=conversation.id,
        sender_role="system",
        sender_account_id=None,
        text=normalized_text,
        is_read_by_user=read_by_user,
        is_read_by_master=read_by_master,
        is_read_by_admin=read_by_admin,
        created_at=now,
    )
    conversation.updated_at = now
    db.add(message)
    db.flush()

    return message


def add_order_system_message(
    order: Order | None,
    db: Session,
    text: str,
    *,
    read_by_user: bool = False,
    read_by_master: bool = False,
    read_by_admin: bool = True,
) -> ChatMessage | None:
    conversation = ensure_order_conversation(order, db)
    return add_system_message(
        conversation,
        db,
        text,
        read_by_user=read_by_user,
        read_by_master=read_by_master,
        read_by_admin=read_by_admin,
    )


def add_admin_system_message(
    account: Account | None,
    db: Session,
    text: str,
    *,
    read_by_user: bool = False,
    read_by_master: bool = False,
    read_by_admin: bool = False,
) -> ChatMessage | None:
    conversation = ensure_admin_conversation(account, db)
    return add_system_message(
        conversation,
        db,
        text,
        read_by_user=read_by_user,
        read_by_master=read_by_master,
        read_by_admin=read_by_admin,
    )
