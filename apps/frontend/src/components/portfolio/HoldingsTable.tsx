"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import { formatInr } from "../../utils/format";
import Sparkline from "../ui/Sparkline";

export type HoldingRow = {
  symbol: string;
  shortName: string;
  fullName: string;
  quantity: number;
  avgPrice: number;
  price: number | null;
  value: number;
  invested: number;
  pnl: number | null;
  pnlPct: number | null;
  dayChangePct: number | null;
  dayChangePerShare: number | null;
  closes: number[];
  weight: number; // % of holdings value
  stale: boolean;
};

type SortKey = "name" | "value" | "pnl" | "day";

const signed = (v: number, digits = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;

function Change({ value, pct }: { value?: number | null; pct: number | null }) {
  if (pct == null) return <span className="text-gray-400">—</span>;
  return (
    <span className={`tabular-nums ${changeTextClass(pct)}`}>
      <span aria-hidden="true" className="text-[10px]">{changeGlyph(pct)} </span>
      {value != null && `${value >= 0 ? "+" : "−"}${formatInr(Math.abs(value))} `}
      <span className={value != null ? "text-xs" : ""}>
        {value != null ? `(${signed(pct)}%)` : `${signed(pct)}%`}
      </span>
    </span>
  );
}

type HoldingsTableProps = {
  rows: HoldingRow[];
  onBuy: (row: HoldingRow) => void;
  onSell: (row: HoldingRow) => void;
};

function HoldingsTable({ rows, onBuy, onSell }: HoldingsTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "value", dir: -1 });

  const sorted = useMemo(() => {
    const val = (r: HoldingRow) =>
      sort.key === "name" ? r.shortName : sort.key === "value" ? r.value : sort.key === "pnl" ? (r.pnlPct ?? -Infinity) : (r.dayChangePct ?? -Infinity);
    return [...rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  }, [rows, sort]);

  const header = (key: SortKey, label: string, align: "left" | "right" = "right") => (
    <th
      scope="col"
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-medium whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => setSort((p) => (p.key === key ? { key, dir: p.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }))}
        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
      >
        {label}
        <span aria-hidden="true" className="w-2">{sort.key === key ? (sort.dir === 1 ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );

  const actions = (row: HoldingRow) => (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onBuy(row)}
        disabled={row.price == null}
        aria-label={`Buy ${row.shortName}`}
        className="rounded-lg bg-teal-600/10 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-600 hover:text-white disabled:opacity-40 dark:text-teal-300"
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onSell(row)}
        aria-label={`Sell ${row.shortName}`}
        className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white dark:text-red-400"
      >
        Sell
      </button>
    </div>
  );

  const nameCell = (row: HoldingRow) => (
    <Link href={`/market?symbol=${encodeURIComponent(row.symbol)}`} className="flex min-w-0 items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {row.shortName.slice(0, 2)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold hover:underline">{row.shortName}</span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {row.quantity} share{row.quantity === 1 ? "" : "s"} · avg {formatInr(row.avgPrice)}
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Table (md and up) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Your holdings</caption>
          <thead className="text-xs text-gray-500 dark:text-gray-400">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {header("name", "Stock", "left")}
              <th scope="col" className="hidden px-2 py-3 font-medium 2xl:table-cell"><span className="sr-only">30-day trend</span></th>
              {header("day", "Price · today")}
              {header("value", "Value · weight")}
              {header("pnl", "Total return")}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.symbol} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40">
                <td className="max-w-[13rem] px-4 py-3">{nameCell(row)}</td>
                <td className="hidden px-2 py-3 2xl:table-cell"><Sparkline values={row.closes} width={64} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="block font-medium tabular-nums">
                    {row.price != null ? formatInr(row.price) : "—"}
                    {row.stale && <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">stale</span>}
                  </span>
                  <span className="block text-xs"><Change pct={row.dayChangePct} /></span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="block font-medium tabular-nums">{formatInr(row.value)}</span>
                  <span className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span aria-hidden="true" className="h-1 w-14 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="block h-full rounded-full bg-gray-400 dark:bg-gray-500" style={{ width: `${Math.min(100, row.weight)}%` }} />
                    </span>
                    <span className="w-10 tabular-nums">{row.weight.toFixed(1)}%</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {row.pnl != null ? (
                    <>
                      <span className={`block font-medium tabular-nums ${changeTextClass(row.pnl)}`}>
                        {`${row.pnl >= 0 ? "+" : "−"}${formatInr(Math.abs(row.pnl))}`}
                      </span>
                      <span className="block text-xs"><Change pct={row.pnlPct} /></span>
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{actions(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
        {sorted.map((row) => (
          <li key={row.symbol} className="py-3">
            <div className="flex items-start justify-between gap-3">
              {nameCell(row)}
              <div className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{formatInr(row.value)}</span>
                <span className="block text-xs"><Change pct={row.pnlPct} /></span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {row.price != null ? formatInr(row.price) : "—"} · today <Change pct={row.dayChangePct} />
              </span>
              {actions(row)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default HoldingsTable;
