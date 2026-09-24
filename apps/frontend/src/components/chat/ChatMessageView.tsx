import Link from "next/link";
import { PiArrowClockwise, PiArrowUpRight, PiShieldCheck } from "react-icons/pi";
import type { ChatQuote } from "@tradexcel/shared";
import { formatInr } from "../../utils/format";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import ChatMarkdown from "./ChatMarkdown";
import TexAvatar from "./TexAvatar";
import type { ChatMessage } from "./chatStorage";

function QuoteCard({ quote }: { quote: ChatQuote }) {
  return (
    <Link
      href={`/market?symbol=${encodeURIComponent(quote.symbol)}`}
      className="flex min-w-[8.5rem] flex-1 flex-col rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200 transition-colors hover:ring-blue-400 dark:bg-gray-900 dark:ring-gray-700"
    >
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{quote.name}</span>
      <span className="text-base font-semibold tabular-nums">{formatInr(quote.price)}</span>
      {quote.changePercent != null && (
        <span className={`text-xs font-medium tabular-nums ${changeTextClass(quote.changePercent)}`}>
          {changeGlyph(quote.changePercent)} {Math.abs(quote.changePercent).toFixed(2)}% today
        </span>
      )}
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
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-sm text-white">{message.text}</p>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-end gap-2">
        <TexAvatar size="sm" />
        <div className="flex max-w-[85%] flex-col items-start gap-2 rounded-2xl rounded-bl-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => onSend(message.retry)}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-xs font-semibold underline disabled:opacity-50"
          >
            <PiArrowClockwise aria-hidden="true" className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const { reply } = message;
  return (
    <div className="flex items-start gap-2">
      <TexAvatar size="sm" className="mt-0.5" />
      <div className="flex min-w-0 max-w-[88%] flex-col gap-2">
        <div className="rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {reply.kind === "guardrail" && (
            <p className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <PiShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Not something I can advise on
            </p>
          )}
          <ChatMarkdown text={reply.text} />
        </div>

        {reply.quotes && reply.quotes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reply.quotes.map((q) => (
              <QuoteCard key={q.symbol} quote={q} />
            ))}
          </div>
        )}

        {reply.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reply.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
              >
                {l.label} <PiArrowUpRight aria-hidden="true" className="h-3 w-3" />
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
                className="rounded-full px-3 py-1 text-left text-xs font-medium text-gray-700 ring-1 ring-gray-300 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-800"
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
