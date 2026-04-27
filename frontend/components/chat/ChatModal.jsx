"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Send, X } from "lucide-react";
import {
  loadChatMessages,
  sendChatMessage,
  startChatConversation,
} from "../../lib/chats";

function formatChatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleLabel(role) {
  if (role === "user") return "Клиент";
  if (role === "master") return "Мастер";
  if (role === "admin") return "Админ";
  return "Собеседник";
}

export default function ChatModal({
  isOpen,
  onClose,
  viewerRole,
  accountId,
  startRequest,
  title = "Чат",
}) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    let intervalId = null;

    const openChat = async () => {
      try {
        setIsLoading(true);

        const openedConversation = await startChatConversation({
          viewerRole,
          accountId,
          ...startRequest,
        });

        if (!isMounted) return;

        setConversation(openedConversation);

        const loadedMessages = await loadChatMessages({
          viewerRole,
          accountId,
          conversationId: openedConversation.id,
        });

        if (!isMounted) return;

        setMessages(loadedMessages);

        intervalId = window.setInterval(async () => {
          try {
            const nextMessages = await loadChatMessages({
              viewerRole,
              accountId,
              conversationId: openedConversation.id,
            });

            if (isMounted) {
              setMessages(nextMessages);
            }
          } catch (error) {
            console.error("Ошибка обновления чата:", error);
          }
        }, 4000);
      } catch (error) {
        console.error("Ошибка открытия чата:", error);
        alert(error.message || "Не удалось открыть чат");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    openChat();

    return () => {
      isMounted = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [accountId, isOpen, startRequest, viewerRole]);

  const refreshMessages = async () => {
    if (!conversation?.id) return;

    try {
      setIsLoading(true);
      const loadedMessages = await loadChatMessages({
        viewerRole,
        accountId,
        conversationId: conversation.id,
      });
      setMessages(loadedMessages);
    } catch (error) {
      alert(error.message || "Не удалось обновить чат");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const nextText = text.trim();
    if (!nextText || !conversation?.id) return;

    try {
      setIsSending(true);
      const sentMessage = await sendChatMessage({
        viewerRole,
        accountId,
        conversationId: conversation.id,
        text: nextText,
      });

      setMessages((prev) => [...prev, sentMessage]);
      setText("");
    } catch (error) {
      alert(error.message || "Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#5f9557]">
              <MessageCircle size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-xl font-bold text-[#151c23]">
                {conversation?.title || title}
              </h3>
              <p className="mt-1 break-words text-sm font-semibold text-gray-500">
                {conversation?.subtitle || "Внутренний чат BTLR"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={refreshMessages}
              disabled={isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f7f4] text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-[320px] flex-1 space-y-3 overflow-y-auto bg-[#fbfcfb] px-5 py-5">
          {isLoading && messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
              Загрузка сообщений...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-500">
              Сообщений пока нет
            </div>
          ) : (
            messages.map((message) => (
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
            ))
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
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
              placeholder="Напишите сообщение"
              className="min-h-[54px] flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#151c23] outline-none focus:border-[#8ebf8c] focus:ring-4 focus:ring-[#e8f2e8]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !text.trim() || !conversation?.id}
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#5f9557] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4f8547] disabled:opacity-60"
            >
              <Send size={18} />
              {isSending ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
