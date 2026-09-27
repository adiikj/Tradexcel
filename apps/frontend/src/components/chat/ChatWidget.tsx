"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { PiArrowUpBold, PiNotePencil, PiX } from "react-icons/pi";
import { getUserProfile, sendChatMessage } from "../../api/api";
import { hasSession } from "../../utils/sessionFlag";
import { isAppPath } from "../../utils/appRoutes";
import { useBrowserValue } from "../../hooks/useBrowserValue";
import ChatMessageView from "./ChatMessageView";
import TexAvatar from "./TexAvatar";
import { clearMessages, loadMessages, saveMessages, type ChatMessage } from "./chatStorage";
import { OPEN_TEX_EVENT, openTex } from "./texEvents";
import { BORDER, CHIP, SURFACE, TEX_GRADIENT } from "./chatTheme";

const MAX_LENGTH = 500;
const STARTERS = ["How does the weekly reset work?", "What's my portfolio worth?", "TCS price", "What is a P/E ratio?"];

// Replies arrive in ~10 ms; a brief "typing" beat reads as a person answering
// rather than a lookup. Slower replies aren't delayed further.
const MIN_TYPING_MS = process.env.NODE_ENV === "test" ? 0 : 650;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function timeGreeting(hour: number): string {
  if (hour < 5) return "Hey there";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

const HEADER_BUTTON =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white";

// Tex, the floating assistant for signed-in app pages. Mounted once (in
// Providers) so the conversation carries across page navigation; also kept in
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
  const [greeting, setGreeting] = useState("Hi");
  const [firstName, setFirstName] = useState<string | null>(null);
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

  // Grow the input with its content, up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, open]);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  // The header's "Ask Tex" button (and anything else) can open the panel.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_TEX_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TEX_EVENT, onOpen);
  }, []);

  // Greet by name, once per page load, the first time the panel opens.
  const greeted = useRef(false);
  useEffect(() => {
    if (!open || greeted.current) return;
    greeted.current = true;
    setGreeting(timeGreeting(new Date().getHours()));
    getUserProfile()
      .then((res) => setFirstName(res?.data?.name?.trim().split(/\s+/)[0] || null))
      .catch(() => {});
  }, [open]);

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
      const started = Date.now();
      const settle = async () => {
        const rest = MIN_TYPING_MS - (Date.now() - started);
        if (rest > 0) await sleep(rest);
      };
      try {
        const res = await sendChatMessage(text);
        await settle();
        setMessages((prev) => [...prev, { id: newId(), role: "assistant", reply: res.data }]);
      } catch (err) {
        await settle();
        const message = err instanceof Error ? err.message : "Sorry, I couldn't answer that just now.";
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
    <MotionConfig reducedMotion="user">
      {!open && (
        <motion.button
          ref={launcherRef}
          type="button"
          onClick={openTex}
          aria-label="Ask Tex, the Tradexcel assistant"
          aria-expanded={false}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full p-1 font-pop text-[13px] font-semibold text-white shadow-md shadow-indigo-600/20 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 md:bottom-6 md:right-6 md:pr-4 ${TEX_GRADIENT}`}
        >
          <TexAvatar size="sm" className="ring-2 ring-white/60" />
          <span className="hidden md:inline">Ask Tex</span>
        </motion.button>
      )}

      {open && (
        <>
          {/* Phones: dim the page behind the sheet; tapping it closes. */}
          <motion.div
            aria-hidden="true"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-900/40 md:hidden"
          />
          <motion.section
            role="dialog"
            aria-label="Tex, the Tradexcel assistant"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl font-pop text-slate-900 shadow-xl ring-1 ring-slate-900/10 dark:text-white dark:ring-white/10 md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(600px,calc(100vh-3rem))] md:w-[380px] md:rounded-2xl ${SURFACE}`}
          >
            <header className={`flex h-12 shrink-0 items-center gap-2.5 border-b px-3 ${BORDER}`}>
              <TexAvatar size="xs" className="h-7 w-7" />
              <h2 className="flex-1 text-[14px] font-semibold">Tex</h2>
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} aria-label="New conversation" title="New conversation" className={HEADER_BUTTON}>
                  <PiNotePencil aria-hidden="true" className="h-[18px] w-[18px]" />
                </button>
              )}
              <button type="button" onClick={close} aria-label="Close Tex" className={HEADER_BUTTON}>
                <PiX aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="pt-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {greeting}
                    {firstName ? `, ${firstName}` : ""}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Ask how Tradexcel works, check a stock price, or look up your portfolio, rank and contests.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Suggested questions">
                    {STARTERS.map((text) => (
                      <button key={text} type="button" onClick={() => send(text)} className={CHIP}>
                        {text}
                      </button>
                    ))}
                  </div>
                  <p className="mt-5 text-[11.5px] text-slate-400 dark:text-slate-500">Virtual money only. Tex doesn&apos;t give investment advice.</p>
                </div>
              )}
              {messages.map((m) => (
                <ChatMessageView key={m.id} message={m} showSuggestions={m.id === lastAssistant && !pending} onSend={send} onNavigate={onNavigate} disabled={pending} />
              ))}
              {pending && (
                <div role="status" className="flex items-center gap-1 py-1">
                  <span className="sr-only">Tex is typing…</span>
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              )}
            </div>

            <form
              className="shrink-0 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 md:pb-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className={`flex items-end gap-1.5 rounded-2xl border py-1 pl-3.5 pr-1 transition-colors focus-within:border-blue-500 dark:focus-within:border-blue-400 ${BORDER}`}>
                <label htmlFor="chat-input" className="sr-only">
                  Message Tex
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
                  placeholder="Ask Tex…"
                  className="flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-6 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || pending}
                  aria-label="Send"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-white/10 dark:disabled:text-slate-500"
                >
                  <PiArrowUpBold aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.section>
        </>
      )}
    </MotionConfig>
  );
}
