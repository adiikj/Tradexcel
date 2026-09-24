import Link from "next/link";
import type { TransactionRecord } from "@tradexcel/shared";
import { formatInr, timeAgo } from "../../utils/format";

// The latest few trades; the full history lives on the Wallet page.
function RecentTrades({ trades }: { trades: TransactionRecord[] }) {
  if (trades.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No trades yet.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {trades.map((t) => {
        const buy = t.side === "BUY";
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span
              className={`w-11 shrink-0 rounded-md py-0.5 text-center text-[10px] font-bold tracking-wide ${
                buy ? "bg-teal-600/10 text-teal-700 dark:text-teal-300" : "bg-red-600/10 text-red-600 dark:text-red-400"
              }`}
            >
              {t.side}
            </span>
            <span className="min-w-0 flex-1">
              <Link href={`/market?symbol=${encodeURIComponent(t.symbol)}`} className="block truncate text-sm font-medium hover:underline">
                {t.symbol.replace(/\.NS$/, "")}
              </Link>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {t.quantity} × {formatInr(t.price)}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-medium tabular-nums">{formatInr(t.total)}</span>
              <time dateTime={t.createdAt} className="block text-xs text-gray-500 dark:text-gray-400">
                {timeAgo(t.createdAt)}
              </time>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default RecentTrades;
