"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PiChatCircleDots, PiPaperPlaneRight, PiSparkle, PiTrash, PiX } from "react-icons/pi";
import { sendChatMessage } from "../../api/api";
import { hasSession } from "../../utils/sessionFlag";
import { isAppPath } from "../../utils/appRoutes";
import { useBrowserValue } from "../../hooks/useBrowserValue";
import ChatMessageView from "./ChatMessageView";
import { clearMessages, loadMessages, saveMessages, type ChatMessage } from "./chatStorage";

const MAX_LENGTH = 500;
const STARTERS = ["How does the weekly reset work?", "What's my portfolio worth?", "TCS price", "What is a P/E ratio?"];

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

// Floating assistant for signed-in app pages. Mounted once (in Providers) so
// the conversation carries across page navigation; also kept in
// sessionStorage for reloads.
export default function ChatWidget() {
  const pathname = usePathname();
  const loggedIn = useBrowserValue(hasSession, false);
  const visible = loggedIn && isAppPath(pathname ?? "");

  const [open, setOpen] = useState(false);
  // Only restore history for a signed-in session (see the effect below).
  const [messages, setMessages] = useState<ChatMessage[]>(() => (typeof window !== "undefined" && hasSession() ? loadMessages() : []));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Signed out (or a different user next): don't show the last user's chat.
  useEffect(() => {
    if (!loggedIn) clearMessages();
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) saveMessages(messages);
  }, [messages, loggedIn]);

  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_LENGTH);
      if (!text || pending) return;
      setMessages((prev) => [...prev.filter((m) => m.role !== "error"), { id: newId(), role: "user", text }]);
      setInput("");
      setPending(true);
      try {
        const res = await sendChatMessage(text);
        setMessages((prev) => [...prev, { id: newId(), role: "assistant", reply: res.data }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "The assistant couldn't answer right now.";
        setMessages((prev) => [...prev, { id: newId(), role: "error", text: message, retry: text }]);
      } finally {
        setPending(false);
      }
    },
    [pending]
  );

  const onNavigate = () => {
    // On phones the panel covers the page the link opens.
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  };

  if (!visible) return null;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the TradeXcel assistant"
          aria-expanded={false}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 md:bottom-6 md:right-6"
        >
          <PiChatCircleDots aria-hidden="true" className="h-7 w-7" />
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="TradeXcel assistant"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-3xl bg-white font-pop text-gray-900 shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-800 md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(620px,calc(100vh-3rem))] md:w-[400px] md:rounded-2xl"
        >
          <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <PiSparkle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">TradeXcel assistant</h2>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">Help, live prices and your account</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <PiTrash aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <PiX aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex max-w-[92%] flex-col gap-2">
                <p className="rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-sm leading-relaxed dark:bg-gray-800">
                  Hi! Ask me how anything in TradeXcel works, check a stock&apos;s price, or see how your portfolio, rank and contests are doing.
                </p>
                <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <ChatMessageView key={m.id} message={m} showSuggestions={m.id === lastAssistant && !pending} onSend={send} onNavigate={onNavigate} disabled={pending} />
            ))}
            {pending && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-gray-100 px-3 py-3 dark:bg-gray-800" aria-label="Assistant is typing" role="status">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            )}
          </div>

          <form
            className="border-t border-gray-100 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 dark:border-gray-800 md:pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl bg-gray-100 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 dark:bg-gray-800">
              <label htmlFor="chat-input" className="sr-only">
                Message the assistant
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about TradeXcel or a stock…"
                className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || pending}
                aria-label="Send"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                <PiPaperPlaneRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-gray-400">Virtual money only · not investment advice</p>
          </form>
        </section>
      )}
    </>
  );
}
