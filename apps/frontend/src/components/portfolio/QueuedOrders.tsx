import { useState } from "react";
import toast from "react-hot-toast";
import type { QueuedOrder } from "@tradexcel/shared";
import { cancelQueuedOrder } from "../../api/api";
import { formatInr, timeAgo } from "../../utils/format";
import { Card } from "../ui/Panel";

const STATUS_LABEL: Record<QueuedOrder["status"], string> = {
  PENDING: "Waiting for open",
  FILLED: "Placed",
  CANCELLED: "Cancelled",
  FAILED: "Not placed",
};

// Orders placed while the market was closed: pending ones (cancellable) plus
// recent outcomes (see recentQueuedOrders), so a failed or cancelled order doesn't just vanish.
function QueuedOrders({ orders, onChanged }: { orders: QueuedOrder[]; onChanged: () => void }) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  if (orders.length === 0) return null;

  const cancel = async (id: string) => {
    try {
      setCancelling(id);
      await cancelQueuedOrder(id);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't cancel that order.");
    } finally {
      setCancelling(null);
      onChanged();
    }
  };

  return (
    <Card title="Queued orders" action={<span className="text-xs text-gray-500 dark:text-gray-400">Placed at the next market open</span>}>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {orders.map((o) => {
          const buy = o.side === "BUY";
          const pending = o.status === "PENDING";
          return (
            <li key={o.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`w-11 shrink-0 rounded-md py-0.5 text-center text-[10px] font-bold tracking-wide ${
                  buy ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-red-600/10 text-red-600 dark:text-red-400"
                }`}
              >
                {o.side}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {o.quantity} × {o.symbol.replace(/\.(NS|BO)$/, "")}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {pending
                    ? `Last price ${formatInr(o.quotedPrice)} · queued ${timeAgo(o.createdAt)}`
                    : `${STATUS_LABEL[o.status]}${o.failureReason ? `: ${o.failureReason}` : ""}`}
                </span>
              </span>
              {pending ? (
                <button
                  type="button"
                  onClick={() => cancel(o.id)}
                  disabled={cancelling === o.id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                >
                  {cancelling === o.id ? "Cancelling..." : "Cancel"}
                </button>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">{STATUS_LABEL[o.status]}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const RECENT_MS = 3 * 24 * 60 * 60 * 1000;

// Pending orders plus anything resolved in the last few days.
export function recentQueuedOrders(orders: QueuedOrder[], now: number): QueuedOrder[] {
  return orders.filter((o) => o.status === "PENDING" || (o.resolvedAt !== null && now - new Date(o.resolvedAt).getTime() < RECENT_MS));
}

export default QueuedOrders;
