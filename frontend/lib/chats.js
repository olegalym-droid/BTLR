import { API_BASE_URL } from "./constants";
import { getAdminHeaders } from "./admin";

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || fallbackMessage);
  }

  return data;
};

export const loadChatConversations = async ({ viewerRole, accountId }) => {
  if (viewerRole === "admin") {
    const response = await fetch(`${API_BASE_URL}/admin/chats`, {
      headers: getAdminHeaders(),
    });

    const data = await parseResponse(response, "Не удалось загрузить чаты");
    return Array.isArray(data) ? data : [];
  }

  if (!accountId) {
    throw new Error("Аккаунт не найден");
  }

  const params = new URLSearchParams({
    role: viewerRole,
    account_id: String(accountId),
  });

  const response = await fetch(`${API_BASE_URL}/chats?${params.toString()}`);
  const data = await parseResponse(response, "Не удалось загрузить чаты");
  return Array.isArray(data) ? data : [];
};

export const startChatConversation = async ({
  viewerRole,
  accountId,
  conversationType,
  orderId = null,
}) => {
  if (!accountId) {
    throw new Error("Аккаунт не найден");
  }

  const response = await fetch(`${API_BASE_URL}/chats/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_role: viewerRole,
      sender_id: accountId,
      conversation_type: conversationType,
      order_id: orderId,
    }),
  });

  return parseResponse(response, "Не удалось открыть чат");
};

export const startAdminChatConversation = async ({
  targetRole,
  targetAccountId,
}) => {
  const response = await fetch(`${API_BASE_URL}/admin/chats/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminHeaders(),
    },
    body: JSON.stringify({
      target_role: targetRole,
      target_account_id: Number(targetAccountId),
    }),
  });

  return parseResponse(response, "Не удалось открыть чат");
};

export const loadChatMessages = async ({
  viewerRole,
  accountId,
  conversationId,
}) => {
  if (viewerRole === "admin") {
    const response = await fetch(
      `${API_BASE_URL}/admin/chats/${conversationId}/messages`,
      {
        headers: getAdminHeaders(),
      },
    );

    const data = await parseResponse(response, "Не удалось загрузить сообщения");
    return Array.isArray(data) ? data : [];
  }

  const params = new URLSearchParams({
    role: viewerRole,
    account_id: String(accountId),
  });

  const response = await fetch(
    `${API_BASE_URL}/chats/${conversationId}/messages?${params.toString()}`,
  );

  const data = await parseResponse(response, "Не удалось загрузить сообщения");
  return Array.isArray(data) ? data : [];
};

export const sendChatMessage = async ({
  viewerRole,
  accountId,
  conversationId,
  text,
}) => {
  const isAdmin = viewerRole === "admin";
  const url = isAdmin
    ? `${API_BASE_URL}/admin/chats/${conversationId}/messages`
    : `${API_BASE_URL}/chats/${conversationId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(isAdmin ? getAdminHeaders() : {}),
    },
    body: JSON.stringify({
      sender_role: viewerRole,
      sender_id: accountId,
      text,
    }),
  });

  return parseResponse(response, "Не удалось отправить сообщение");
};
