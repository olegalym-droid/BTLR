from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Account, ChatConversation, ChatMessage, Notification, Order
from routes.admin import verify_admin
from schemas import (
    AdminChatStartRequest,
    ChatConversationResponse,
    ChatMessageCreateRequest,
    ChatMessageResponse,
    ChatStartRequest,
)

router = APIRouter(prefix="/chats", tags=["chats"])
admin_router = APIRouter(prefix="/admin/chats", tags=["admin-chats"])

CHAT_TYPE_ORDER = "user_master"
CHAT_TYPE_ADMIN_USER = "admin_user"
CHAT_TYPE_ADMIN_MASTER = "admin_master"
CHAT_MESSAGE_MAX_LENGTH = 2000


def format_datetime(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def normalize_message_text(text: str) -> str:
    normalized = str(text or "").strip()

    if not normalized:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    if len(normalized) > CHAT_MESSAGE_MAX_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Сообщение не может быть длиннее {CHAT_MESSAGE_MAX_LENGTH} символов",
        )

    return normalized


def get_account_or_404(account_id: int, role: str, db: Session) -> Account:
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.role == role)
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")

    return account


def get_conversation_query(db: Session):
    return db.query(ChatConversation).options(
        joinedload(ChatConversation.user),
        joinedload(ChatConversation.master),
        joinedload(ChatConversation.order),
        joinedload(ChatConversation.messages),
    )


def find_or_create_order_conversation(order: Order, db: Session) -> ChatConversation:
    if not order.master_id:
        raise HTTPException(status_code=400, detail="Мастер по заказу ещё не выбран")

    conversation = (
        get_conversation_query(db)
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
    db.commit()
    db.refresh(conversation)

    return (
        get_conversation_query(db)
        .filter(ChatConversation.id == conversation.id)
        .first()
    )


def find_or_create_admin_conversation(
    account: Account,
    db: Session,
) -> ChatConversation:
    conversation_type = (
        CHAT_TYPE_ADMIN_USER if account.role == "user" else CHAT_TYPE_ADMIN_MASTER
    )

    filters = [
        ChatConversation.conversation_type == conversation_type,
    ]

    if account.role == "user":
        filters.append(ChatConversation.user_id == account.id)
    else:
        filters.append(ChatConversation.master_id == account.id)

    conversation = get_conversation_query(db).filter(*filters).first()

    if conversation:
        return conversation

    conversation = ChatConversation(
        conversation_type=conversation_type,
        user_id=account.id if account.role == "user" else None,
        master_id=account.id if account.role == "master" else None,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return (
        get_conversation_query(db)
        .filter(ChatConversation.id == conversation.id)
        .first()
    )


def get_order_for_chat(order_id: int, sender_role: str, sender_id: int, db: Session) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.user), joinedload(Order.master))
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if sender_role == "user" and order.user_id != sender_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому заказу")

    if sender_role == "master" and order.master_id != sender_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому заказу")

    return order


def viewer_has_access(
    conversation: ChatConversation,
    viewer_role: str,
    viewer_id: int | None = None,
) -> bool:
    if viewer_role == "admin":
        return True

    if viewer_role == "user":
        return conversation.user_id == viewer_id

    if viewer_role == "master":
        return conversation.master_id == viewer_id

    return False


def get_conversation_for_viewer(
    conversation_id: int,
    viewer_role: str,
    db: Session,
    viewer_id: int | None = None,
) -> ChatConversation:
    conversation = (
        get_conversation_query(db)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Диалог не найден")

    if not viewer_has_access(conversation, viewer_role, viewer_id):
        raise HTTPException(status_code=403, detail="Нет доступа к этому диалогу")

    return conversation


def get_last_message(conversation: ChatConversation) -> ChatMessage | None:
    messages = list(conversation.messages or [])
    return messages[-1] if messages else None


def get_unread_count(conversation: ChatConversation, viewer_role: str) -> int:
    field_by_role = {
        "user": "is_read_by_user",
        "master": "is_read_by_master",
        "admin": "is_read_by_admin",
    }
    field_name = field_by_role.get(viewer_role)

    if not field_name:
        return 0

    return sum(
        1
        for message in conversation.messages or []
        if not getattr(message, field_name, False)
        and message.sender_role != viewer_role
    )


def build_conversation_title(conversation: ChatConversation, viewer_role: str) -> str:
    if conversation.conversation_type == CHAT_TYPE_ORDER:
        if viewer_role == "user":
            return conversation.master.full_name if conversation.master else "Мастер"
        if viewer_role == "master":
            return conversation.user.full_name if conversation.user else "Клиент"
        return f"Заказ #{conversation.order_id}: клиент и мастер"

    if conversation.conversation_type == CHAT_TYPE_ADMIN_USER:
        if viewer_role == "admin":
            return conversation.user.full_name if conversation.user else "Пользователь"
        return "Администратор"

    if conversation.conversation_type == CHAT_TYPE_ADMIN_MASTER:
        if viewer_role == "admin":
            return conversation.master.full_name if conversation.master else "Мастер"
        return "Администратор"

    return "Диалог"


def build_conversation_subtitle(conversation: ChatConversation) -> str | None:
    if conversation.order:
        return f"Заказ #{conversation.order.id}: {conversation.order.service_name}"

    if conversation.conversation_type == CHAT_TYPE_ADMIN_USER:
        return "Чат пользователя с администратором"

    if conversation.conversation_type == CHAT_TYPE_ADMIN_MASTER:
        return "Чат мастера с администратором"

    return None


def serialize_conversation(
    conversation: ChatConversation,
    viewer_role: str,
) -> ChatConversationResponse:
    last_message = get_last_message(conversation)

    return ChatConversationResponse(
        id=conversation.id,
        conversation_type=conversation.conversation_type,
        title=build_conversation_title(conversation, viewer_role),
        subtitle=build_conversation_subtitle(conversation),
        order_id=conversation.order_id,
        user_id=conversation.user_id,
        master_id=conversation.master_id,
        user_name=conversation.user.full_name if conversation.user else None,
        user_phone=conversation.user.phone if conversation.user else None,
        master_name=conversation.master.full_name if conversation.master else None,
        master_phone=conversation.master.phone if conversation.master else None,
        last_message=last_message.text if last_message else None,
        last_message_at=format_datetime(last_message.created_at) if last_message else None,
        unread_count=get_unread_count(conversation, viewer_role),
        updated_at=format_datetime(conversation.updated_at) or "",
    )


def serialize_message(
    message: ChatMessage,
    viewer_role: str,
    viewer_id: int | None = None,
) -> ChatMessageResponse:
    is_own = message.sender_role == viewer_role

    if viewer_role in {"user", "master"}:
        is_own = (
            message.sender_role == viewer_role
            and message.sender_account_id == viewer_id
        )

    return ChatMessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_role=message.sender_role,
        sender_account_id=message.sender_account_id,
        text=message.text,
        is_own=is_own,
        created_at=format_datetime(message.created_at) or "",
    )


def mark_messages_as_read(
    conversation: ChatConversation,
    viewer_role: str,
    db: Session,
) -> None:
    field_by_role = {
        "user": "is_read_by_user",
        "master": "is_read_by_master",
        "admin": "is_read_by_admin",
    }
    field_name = field_by_role.get(viewer_role)

    if not field_name:
        return

    changed = False
    for message in conversation.messages or []:
        if not getattr(message, field_name, False):
            setattr(message, field_name, True)
            changed = True

    if changed:
        db.commit()


def create_chat_notification(
    conversation: ChatConversation,
    message: ChatMessage,
    db: Session,
) -> None:
    if conversation.conversation_type == CHAT_TYPE_ORDER:
        if message.sender_role == "user" and conversation.master_id:
            receiver_id = conversation.master_id
            title = "Новое сообщение от клиента"
        elif message.sender_role == "master" and conversation.user_id:
            receiver_id = conversation.user_id
            title = "Новое сообщение от мастера"
        else:
            return
    elif conversation.conversation_type == CHAT_TYPE_ADMIN_USER:
        if message.sender_role == "admin" and conversation.user_id:
            receiver_id = conversation.user_id
            title = "Новое сообщение от администратора"
        else:
            return
    elif conversation.conversation_type == CHAT_TYPE_ADMIN_MASTER:
        if message.sender_role == "admin" and conversation.master_id:
            receiver_id = conversation.master_id
            title = "Новое сообщение от администратора"
        else:
            return
    else:
        return

    db.add(
        Notification(
            user_id=receiver_id,
            order_id=conversation.order_id,
            type="chat_message",
            title=title,
            message=message.text[:180],
        )
    )


def add_message(
    conversation: ChatConversation,
    sender_role: str,
    text: str,
    db: Session,
    sender_id: int | None = None,
) -> ChatMessage:
    normalized_text = normalize_message_text(text)

    message = ChatMessage(
        conversation_id=conversation.id,
        sender_role=sender_role,
        sender_account_id=sender_id if sender_role in {"user", "master"} else None,
        text=normalized_text,
        is_read_by_user=sender_role == "user",
        is_read_by_master=sender_role == "master",
        is_read_by_admin=sender_role == "admin",
    )
    conversation.updated_at = datetime.utcnow()

    db.add(message)
    db.flush()
    create_chat_notification(conversation, message, db)
    db.commit()
    db.refresh(message)

    return message


@router.get("", response_model=list[ChatConversationResponse])
def list_my_chats(
    role: str = Query(..., pattern="^(user|master)$"),
    account_id: int = Query(...),
    db: Session = Depends(get_db),
):
    get_account_or_404(account_id, role, db)

    query = get_conversation_query(db)

    if role == "user":
        query = query.filter(ChatConversation.user_id == account_id)
    else:
        query = query.filter(ChatConversation.master_id == account_id)

    conversations = query.order_by(ChatConversation.updated_at.desc()).all()
    return [serialize_conversation(item, role) for item in conversations]


@router.post("/start", response_model=ChatConversationResponse)
def start_chat(payload: ChatStartRequest, db: Session = Depends(get_db)):
    account = get_account_or_404(payload.sender_id, payload.sender_role, db)

    if payload.conversation_type == "order":
        if not payload.order_id:
            raise HTTPException(status_code=400, detail="Укажите заказ для чата")

        order = get_order_for_chat(
            payload.order_id,
            payload.sender_role,
            payload.sender_id,
            db,
        )
        conversation = find_or_create_order_conversation(order, db)
        return serialize_conversation(conversation, payload.sender_role)

    conversation = find_or_create_admin_conversation(account, db)
    return serialize_conversation(conversation, payload.sender_role)


@router.get("/{conversation_id}/messages", response_model=list[ChatMessageResponse])
def list_messages(
    conversation_id: int,
    role: str = Query(..., pattern="^(user|master)$"),
    account_id: int = Query(...),
    db: Session = Depends(get_db),
):
    get_account_or_404(account_id, role, db)
    conversation = get_conversation_for_viewer(conversation_id, role, db, account_id)
    mark_messages_as_read(conversation, role, db)
    db.refresh(conversation)

    return [
        serialize_message(message, role, account_id)
        for message in conversation.messages or []
    ]


@router.post("/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_message(
    conversation_id: int,
    payload: ChatMessageCreateRequest,
    db: Session = Depends(get_db),
):
    if payload.sender_role not in {"user", "master"} or not payload.sender_id:
        raise HTTPException(status_code=400, detail="Некорректный отправитель")

    get_account_or_404(payload.sender_id, payload.sender_role, db)
    conversation = get_conversation_for_viewer(
        conversation_id,
        payload.sender_role,
        db,
        payload.sender_id,
    )
    message = add_message(
        conversation,
        payload.sender_role,
        payload.text,
        db,
        payload.sender_id,
    )

    return serialize_message(message, payload.sender_role, payload.sender_id)


@admin_router.get("", response_model=list[ChatConversationResponse])
def list_admin_chats(
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    conversations = (
        get_conversation_query(db)
        .order_by(ChatConversation.updated_at.desc(), ChatConversation.id.desc())
        .all()
    )
    return [serialize_conversation(item, "admin") for item in conversations]


@admin_router.post("/start", response_model=ChatConversationResponse)
def start_admin_chat(
    payload: AdminChatStartRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    account = get_account_or_404(payload.target_account_id, payload.target_role, db)
    conversation = find_or_create_admin_conversation(account, db)
    return serialize_conversation(conversation, "admin")


@admin_router.get("/{conversation_id}/messages", response_model=list[ChatMessageResponse])
def list_admin_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    conversation = get_conversation_for_viewer(conversation_id, "admin", db)
    mark_messages_as_read(conversation, "admin", db)
    db.refresh(conversation)

    return [
        serialize_message(message, "admin")
        for message in conversation.messages or []
    ]


@admin_router.post("/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_admin_message(
    conversation_id: int,
    payload: ChatMessageCreateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    conversation = get_conversation_for_viewer(conversation_id, "admin", db)
    message = add_message(conversation, "admin", payload.text, db)

    return serialize_message(message, "admin")
