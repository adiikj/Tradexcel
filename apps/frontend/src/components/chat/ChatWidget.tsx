"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { PiArrowsClockwise, PiCaretRight, PiChartLineUp, PiGraduationCap, PiNotePencil, PiPaperPlaneRightFill, PiWallet, PiX } from "react-icons/pi";
import { getUserProfile, sendChatMessage } from "../../api/api";
import { hasSession } from "../../utils/sessionFlag";
import { isAppPath } from "../../utils/appRoutes";
import { useBrowserValue } from "../../hooks/useBrowserValue";
import ChatMessageView from "./ChatMessageView";
import TexAvatar from "./TexAvatar";
import { clearMessages, loadMessages, saveMessages, type ChatMessage } from "./chatStorage";
import { OPEN_TEX_EVENT, openTex } from "./texEvents";
import { BORDER, CANVAS, CARD, CHROME, DIVIDE, TEX_GRADIENT } from "./chatTheme";

const MAX_LENGTH = 500;
const STARTERS = [
  { text: "How does the weekly reset work?", icon: PiArrowsClockwise },
  { text: "What's my portfolio worth?", icon: PiWallet },
  { text: "TCS price", icon: PiChartLineUp },
  { text: "What is a P/E ratio?", icon: PiGraduationCap },
];

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

const HEADER_BUTTON = "relative flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white";

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
          className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2.5 rounded-full p-1.5 font-pop text-[14px] font-semibold text-white shadow-lg shadow-indigo-600/30 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 md:bottom-6 md:right-6 md:pr-5 ${TEX_GRADIENT}`}
        >
          <TexAvatar size="md" className="ring-2 ring-white/70" />
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
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] md:hidden"
          />
          <motion.section
            role="dialog"
            aria-label="Tex, the Tradexcel assistant"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className={`fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl font-pop text-slate-900 shadow-[0_28px_70px_-12px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10 dark:text-white dark:ring-blue-300/15 md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(660px,calc(100vh-3rem))] md:w-[400px] md:rounded-3xl ${CHROME}`}
          >
            <header className={`relative shrink-0 overflow-hidden text-white ${TEX_GRADIENT}`}>
              {/* Faint rising trend line: the Tradexcel motif, as texture. */}
              <svg aria-hidden="true" viewBox="0 0 400 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]">
                <path d="M0 130 L70 108 L120 118 L190 70 L250 86 L320 38 L400 20" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
                <path d="M0 130 L70 108 L120 118 L190 70 L250 86 L320 38 L400 20 V160 H0 Z" fill="#fff" opacity=".35" />
              </svg>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/40 md:hidden" aria-hidden="true" />
              <div className="relative flex h-16 items-center gap-3 px-4">
                <TexAvatar size="md" className="ring-2 ring-white/60" />
                <div className="min-w-0 flex-1 leading-tight">
                  <h2 className="text-[15px] font-semibold">Tex</h2>
                  <p className="flex items-center gap-1.5 truncate text-xs text-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                    Online · your Tradexcel assistant
                  </p>
                </div>
                {messages.length > 0 && (
                  <button type="button" onClick={() => setMessages([])} aria-label="New conversation" title="New conversation" className={HEADER_BUTTON}>
                    <PiNotePencil aria-hidden="true" className="h-[18px] w-[18px]" />
                  </button>
                )}
                <button type="button" onClick={close} aria-label="Close Tex" className={HEADER_BUTTON}>
                  <PiX aria-hidden="true" className="h-[18px] w-[18px]" />
                </button>
              </div>
              {messages.length === 0 && (
                <div className="relative px-5 pb-7 pt-3">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {greeting}
                    {firstName ? `, ${firstName}` : ""}
                  </h3>
                  <p className="mt-1.5 max-w-[20rem] text-[14px] leading-6 text-blue-100">
                    I&apos;m Tex. I can explain how Tradexcel works, check live stock prices, and look up your portfolio, rank and contests.
                  </p>
                </div>
              )}
            </header>

            <div ref={scrollRef} className={`flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 ${CANVAS}`} aria-live="polite">
              {messages.length === 0 && (
                <div>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-blue-200/60">Try asking</p>
                  <ul className={`divide-y overflow-hidden rounded-2xl ${CARD} ${DIVIDE}`} aria-label="Suggested questions">
                    {STARTERS.map(({ text, icon: Icon }) => (
                      <li key={text}>
                        <button
                          type="button"
                          onClick={() => send(text)}
                          className="group flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-slate-700 transition-colors hover:bg-blue-50/70 dark:text-slate-100 dark:hover:bg-white/5"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300">
                            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                          </span>
                          <span className="flex-1">{text}</span>
                          <PiCaretRight aria-hidden="true" className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {messages.map((m) => (
                <ChatMessageView key={m.id} message={m} showSuggestions={m.id === lastAssistant && !pending} onSend={send} onNavigate={onNavigate} disabled={pending} />
              ))}
              {pending && (
                <div className="flex items-center gap-2.5" role="status">
                  <TexAvatar size="xs" />
                  <span className={`flex items-center gap-1 rounded-2xl rounded-tl-md px-3.5 py-3 ${CARD}`} aria-hidden="true">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-blue-200/70" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60">Tex is typing…</span>
                </div>
              )}
            </div>

            <form
              className={`shrink-0 border-t px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:pb-3 ${BORDER}`}
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 py-1.5 pl-4 pr-1.5 transition-shadow focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-[#2c3d63] dark:bg-[#22304f] dark:focus-within:border-blue-400">
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
                  placeholder="Ask Tex anything about Tradexcel…"
                  className="flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-6 outline-none placeholder:text-slate-400 dark:placeholder:text-blue-200/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || pending}
                  aria-label="Send"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md shadow-indigo-600/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:shadow-none ${TEX_GRADIENT}`}
                >
                  <PiPaperPlaneRightFill aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-blue-200/40">Virtual money only · not investment advice</p>
            </form>
          </motion.section>
        </>
      )}
    </MotionConfig>
  );
}
