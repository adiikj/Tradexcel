import Link from "next/link";
import { PiArrowClockwise, PiArrowRight, PiShieldCheck } from "react-icons/pi";
import type { ChatQuote } from "@tradexcel/shared";
import { formatInr } from "../../utils/format";
import ChatMarkdown from "./ChatMarkdown";
import type { ChatMessage } from "./chatStorage";
import { CARD, CHIP } from "./chatTheme";

function QuoteCard({ quote }: { quote: ChatQuote }) {
  const pct = quote.changePercent;
  const tone = pct == null ? "text-slate-500" : pct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  return (
    <Link
      href={`/market?symbol=${encodeURIComponent(quote.symbol)}`}
      aria-label={`${quote.name} ${formatInr(quote.price)}${pct != null ? `, ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(2)}% today` : ""}`}
      className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:border-blue-300 dark:hover:border-blue-400/50 ${CARD}`}
    >
      <span className="truncate text-[13px] font-medium text-slate-600 dark:text-slate-300">{quote.name}</span>
      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
        <span className="text-[14px] font-semibold text-slate-900 dark:text-white">{formatInr(quote.price)}</span>
        {pct != null && (
          <span className={`text-[12px] font-medium ${tone}`}>
            {pct >= 0 ? "+" : "−"}
            {Math.abs(pct).toFixed(2)}%
          </span>
        )}
      </span>
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
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-blue-600 px-3 py-1.5 text-[14px] leading-6 text-white">{message.text}</p>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="text-[14px] leading-6">
        <p className="text-red-600 dark:text-red-300">{message.text}</p>
        <button
          type="button"
          onClick={() => onSend(message.retry)}
          disabled={disabled}
          className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
        >
          <PiArrowClockwise aria-hidden="true" className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    );
  }

  const { reply } = message;
  // Tex's replies sit on the panel itself, no bubble: the user's messages are
  // the only filled shapes, so the conversation reads at a glance.
  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      {reply.kind === "guardrail" && (
        <p className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-700 dark:text-amber-300">
          <PiShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Not something I can advise on
        </p>
      )}
      <div className="text-[14px] leading-6 text-slate-700 dark:text-slate-200 [&_strong]:text-slate-900 dark:[&_strong]:text-white">
        <ChatMarkdown text={reply.text} />
      </div>

      {reply.quotes && reply.quotes.length > 0 && (
        <div className="grid w-full gap-1.5">
          {reply.quotes.map((q) => (
            <QuoteCard key={q.symbol} quote={q} />
          ))}
        </div>
      )}

      {reply.links.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {reply.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className="group inline-flex items-center gap-0.5 text-[13px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              {l.label}
              <PiArrowRight aria-hidden="true" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      {showSuggestions && reply.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggested questions">
          {reply.suggestions.map((s) => (
            <button key={s} type="button" disabled={disabled} onClick={() => onSend(s)} className={`${CHIP} text-left`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
