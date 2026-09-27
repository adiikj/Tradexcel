import type { TransactionRecord } from "@tradexcel/shared";

type Trade = Pick<TransactionRecord, "side" | "total" | "charges">;

// Cash that actually left (buy) or reached (sell) the wallet: a buy costs its
// total plus charges, a sale pays its total minus charges. Older trades from
// before charges existed have charges "0".
export function cashMoved(t: Trade): number {
  const charges = Number(t.charges ?? 0);
  return t.side === "BUY" ? Number(t.total) + charges : Number(t.total) - charges;
}

// Signed version: − for buys, + for sells.
export function netCashFlow(t: Trade): number {
  return t.side === "BUY" ? -cashMoved(t) : cashMoved(t);
}
