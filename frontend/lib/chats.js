import { API_BASE_URL } from "./constants";
import { getAdminHeaders } from "./admin";
import { getAuthHeaders } from "./auth";

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || fallbackMessage);
  }

  return data;
};

export const loadChatConversations = async ({ viewerRole }) => {
  if (viewerRole === "admin") {
    const response = await fetch(`${API_BASE_URL}/admin/chats`, {
      headers: getAdminHeaders(),
    });

    const data = await parseResponse(response, "Не удалось загрузить чаты");
    return Array.isArray(data) ? data : [];
  }

  const response = await fetch(`${API_BASE_URL}/chats`, {
    headers: getAuthHeaders(viewerRole),
  });
  const data = await parseResponse(response, "Не удалось загрузить чаты");
  return Array.isArray(data) ? data : [];
};

export const startChatConversation = async ({
  viewerRole,
  conversationType,
  orderId = null,
}) => {
  const response = await fetch(`${API_BASE_URL}/chats/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(viewerRole),
    },
    body: JSON.stringify({
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

  const response = await fetch(`${API_BASE_URL}/chats/${conversationId}/messages`, {
    headers: getAuthHeaders(viewerRole),
  });

  const data = await parseResponse(response, "Не удалось загрузить сообщения");
  return Array.isArray(data) ? data : [];
};

export const sendChatMessage = async ({
  viewerRole,
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
      ...(isAdmin ? getAdminHeaders() : getAuthHeaders(viewerRole)),
    },
    body: JSON.stringify({
      text,
    }),
  });

  return parseResponse(response, "Не удалось отправить сообщение");
};
