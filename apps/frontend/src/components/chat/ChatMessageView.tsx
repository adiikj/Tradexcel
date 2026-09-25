import Link from "next/link";
import { PiArrowClockwise, PiArrowRight, PiShieldCheck } from "react-icons/pi";
import type { ChatQuote } from "@tradexcel/shared";
import { formatInr } from "../../utils/format";
import ChatMarkdown from "./ChatMarkdown";
import TexAvatar from "./TexAvatar";
import type { ChatMessage } from "./chatStorage";
import { CARD } from "./chatTheme";

function QuoteCard({ quote }: { quote: ChatQuote }) {
  const pct = quote.changePercent;
  const tone =
    pct == null
      ? "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
      : pct >= 0
        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
        : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  return (
    <Link
      href={`/market?symbol=${encodeURIComponent(quote.symbol)}`}
      className={`flex flex-col gap-1 rounded-xl p-3 transition-colors hover:border-blue-300 dark:hover:border-blue-400/50 ${CARD}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-blue-100/70">{quote.name}</span>
        {pct != null && (
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${tone}`}>
            {pct >= 0 ? "+" : "−"}
            {Math.abs(pct).toFixed(2)}% today
          </span>
        )}
      </span>
      <span className="text-[15px] font-semibold tabular-nums text-gray-900 dark:text-white">{formatInr(quote.price)}</span>
    </Link>
  );
}

type Props = {
  message: ChatMessage;
  // Chips only under the latest reply; older ones are history.
  showSuggestions: boolean;
  onSend: (text: string) => void;
  onNavigate: () => void;
  disabled: boolean;
};

export default function ChatMessageView({ message, showSuggestions, onSend, onNavigate, disabled }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 px-3.5 py-2 text-[14px] leading-6 text-white shadow-sm shadow-indigo-600/20">{message.text}</p>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex gap-3">
        <TexAvatar size="xs" className="mt-0.5" />
        <div className="text-[14px] leading-6">
          <p className="text-red-600 dark:text-red-300">{message.text}</p>
          <button
            type="button"
            onClick={() => onSend(message.retry)}
            disabled={disabled}
            className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-white"
          >
            <PiArrowClockwise aria-hidden="true" className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const { reply } = message;
  return (
    <div className="flex gap-2.5">
      <TexAvatar size="xs" className="mt-1" />
      <div className="flex min-w-0 max-w-[88%] flex-col items-start gap-2.5">
        <div className={`rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[14px] leading-6 text-slate-700 dark:text-slate-100 [&_strong]:text-slate-900 dark:[&_strong]:text-white ${CARD}`}>
          {reply.kind === "guardrail" && (
            <p className="mb-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
              <PiShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Not something I can advise on
            </p>
          )}
          <ChatMarkdown text={reply.text} />
        </div>

        {reply.quotes && reply.quotes.length > 0 && (
          <div className="grid w-full grid-cols-2 gap-2">
            {reply.quotes.map((q) => (
              <QuoteCard key={q.symbol} quote={q} />
            ))}
          </div>
        )}

        {reply.links.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {reply.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onNavigate}
                className="group inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {l.label}
                <PiArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}

        {showSuggestions && reply.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
            {reply.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => onSend(s)}
                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-left text-[13px] font-medium text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-300/30 dark:bg-[#1a2642] dark:text-blue-200 dark:hover:bg-blue-400/15"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
