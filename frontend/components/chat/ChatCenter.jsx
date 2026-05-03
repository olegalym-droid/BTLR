"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import {
  loadChatConversations,
  loadChatMessages,
  sendChatMessage,
  startAdminChatConversation,
  startChatConversation,
} from "../../lib/chats";

function formatChatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU");
}

function getRoleLabel(role) {
  if (role === "user") return "Клиент";
  if (role === "master") return "Мастер";
  if (role === "admin") return "Админ";
  if (role === "system") return "Система";
  return role;
}

export default function ChatCenter({
  viewerRole,
  accountId = null,
  initialTarget = null,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [targetRole, setTargetRole] = useState("user");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [handledInitialTargetKey, setHandledInitialTargetKey] = useState("");

  const canUseChat = viewerRole === "admin" || Boolean(accountId);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [conversations],
  );

  const loadConversations = useCallback(async () => {
    if (!canUseChat) return;

    try {
      setIsLoadingConversations(true);
      const loadedConversations = await loadChatConversations({
        viewerRole,
        accountId,
      });
      setConversations(loadedConversations);

      if (!selectedConversation && loadedConversations.length > 0) {
        setSelectedConversation(loadedConversations[0]);
      }
    } catch (error) {
      console.error("Ошибка загрузки чатов:", error);
      alert(error.message || "Не удалось загрузить чаты");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [accountId, canUseChat, selectedConversation, viewerRole]);

  const loadMessages = useCallback(
    async (conversation = selectedConversation) => {
      if (!conversation?.id) {
        setMessages([]);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const loadedMessages = await loadChatMessages({
          viewerRole,
          accountId,
          conversationId: conversation.id,
        });
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Ошибка загрузки сообщений:", error);
        alert(error.message || "Не удалось загрузить сообщения");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [accountId, selectedConversation, viewerRole],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (viewerRole !== "admin" || !initialTarget?.targetAccountId) {
      return;
    }

    const nextKey =
      initialTarget.key ||
      `${initialTarget.targetRole}-${initialTarget.targetAccountId}`;

    if (handledInitialTargetKey === nextKey) {
      return;
    }

    let isMounted = true;

    const openInitialTarget = async () => {
      try {
        const conversation = await startAdminChatConversation({
          targetRole: initialTarget.targetRole || "user",
          targetAccountId: initialTarget.targetAccountId,
        });

        if (!isMounted) {
          return;
        }

        setSelectedConversation(conversation);
        setHandledInitialTargetKey(nextKey);
        await loadConversations();
      } catch (error) {
        alert(error.message || "Не удалось открыть чат");
      }
    };

    openInitialTarget();

    return () => {
      isMounted = false;
    };
  }, [handledInitialTargetKey, initialTarget, loadConversations, viewerRole]);

  useEffect(() => {
    loadMessages(selectedConversation);
  }, [loadMessages, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation?.id) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadMessages(selectedConversation);
      loadConversations();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [loadConversations, loadMessages, selectedConversation]);

  const openSupportChat = async () => {
    try {
      const conversation = await startChatConversation({
        viewerRole,
        accountId,
        conversationType: "admin",
      });

      setSelectedConversation(conversation);
      await loadConversations();
    } catch (error) {
      alert(error.message || "Не удалось открыть чат с администратором");
    }
  };

  const openAdminTargetChat = async () => {
    if (!targetAccountId.trim()) {
      alert("Укажите ID аккаунта");
      return;
    }

    try {
      const conversation = await startAdminChatConversation({
        targetRole,
        targetAccountId,
      });

      setSelectedConversation(conversation);
      setTargetAccountId("");
      await loadConversations();
    } catch (error) {
      alert(error.message || "Не удалось открыть чат");
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setText("");
  };

  const handleSend = async () => {
    const nextText = text.trim();
    if (!selectedConversation?.id || !nextText) return;

    try {
      setIsSending(true);
      const sentMessage = await sendChatMessage({
        viewerRole,
        accountId,
        conversationId: selectedConversation.id,
        text: nextText,
      });
      setMessages((prev) => [...prev, sentMessage]);
      setText("");
      await loadConversations();
    } catch (error) {
      alert(error.message || "Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#151c23]">Чаты</h2>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Внутренние диалоги без перехода в WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={loadConversations}
          disabled={isLoadingConversations}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#5f9557] transition hover:bg-[#f7faf6] disabled:opacity-60"
        >
          <RefreshCw
            size={19}
            className={isLoadingConversations ? "animate-spin" : ""}
          />
          Обновить
        </button>
      </div>

      {viewerRole === "admin" ? (
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4 lg:grid-cols-[180px_1fr_auto]">
          <select
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className="min-h-[52px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#151c23] outline-none"
          >
            <option value="user">Пользователь</option>
            <option value="master">Мастер</option>
          </select>
          <input
            value={targetAccountId}
            onChange={(event) => setTargetAccountId(event.target.value)}
            placeholder="ID аккаунта"
            inputMode="numeric"
            className="min-h-[52px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#151c23] outline-none"
          />
          <button
            type="button"
            onClick={openAdminTargetChat}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#5f9557] px-5 py-3 text-sm font-bold text-white"
          >
            <Search size={18} />
            Открыть
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-4">
          <button
            type="button"
            onClick={openSupportChat}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#5f9557] px-5 py-3 text-sm font-bold text-white sm:w-auto"
          >
            <MessageCircle size={19} />
            Чат с администратором
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-[24px] border border-gray-200 bg-[#fbfcfb] p-3">
          {isLoadingConversations && conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
              Загрузка чатов...
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
              Чатов пока нет
            </div>
          ) : (
            sortedConversations.map((conversation) => {
              const isActive = selectedConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full rounded-[20px] border p-4 text-left transition ${
                    isActive
                      ? "border-[#91bd8e] bg-[#eef6ea]"
                      : "border-gray-200 bg-white hover:bg-[#f7faf6]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-[#151c23]">
                        {conversation.title}
                      </p>
                      <p className="mt-1 break-words text-xs font-semibold text-gray-500">
                        {conversation.subtitle || "Диалог"}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                        {conversation.unread_count > 9
                          ? "9+"
                          : conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {conversation.last_message && (
                    <p className="mt-3 line-clamp-2 break-words text-xs font-semibold text-gray-600">
                      {conversation.last_message}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="break-words text-xl font-bold text-[#151c23]">
              {selectedConversation?.title || "Выберите диалог"}
            </h3>
            {selectedConversation?.subtitle && (
              <p className="mt-1 break-words text-sm font-semibold text-gray-500">
                {selectedConversation.subtitle}
              </p>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfcfb] px-5 py-5">
            {!selectedConversation ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                Откройте диалог слева
              </div>
            ) : isLoadingMessages && messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                Загрузка сообщений...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
                Сообщений пока нет
              </div>
            ) : (
              messages.map((message) => {
                const isSystem = message.sender_role === "system";

                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="max-w-[88%] rounded-[20px] border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-sm font-semibold leading-6 text-yellow-900 shadow-sm [overflow-wrap:anywhere]">
                        {message.text}
                        <div className="mt-2 text-[11px] font-semibold text-yellow-700">
                          {formatChatDate(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.is_own ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm ${
                        message.is_own
                          ? "bg-[#5f9557] text-white"
                          : "border border-gray-200 bg-white text-[#151c23]"
                      }`}
                    >
                      <div
                        className={`mb-1 text-[11px] font-bold uppercase ${
                          message.is_own ? "text-white/75" : "text-gray-400"
                        }`}
                      >
                        {getRoleLabel(message.sender_role)}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                        {message.text}
                      </p>
                      <div
                        className={`mt-2 text-[11px] font-semibold ${
                          message.is_own ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {formatChatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                disabled={!selectedConversation}
                placeholder="Напишите сообщение"
                className="min-h-[54px] flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#151c23] outline-none focus:border-[#8ebf8c] focus:ring-4 focus:ring-[#e8f2e8] disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !text.trim() || !selectedConversation}
                className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#5f9557] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4f8547] disabled:opacity-60"
              >
                <Send size={18} />
                {isSending ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
