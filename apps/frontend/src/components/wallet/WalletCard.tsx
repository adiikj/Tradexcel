"use client";
import Image from "next/image";
import { PiArrowsClockwise } from "react-icons/pi";
import logo from "../../assets/logo-icon-transparent.png";
import { formatInr } from "../../utils/format";

type WalletCardProps = {
  name: string | null;
  balance: number | null;
  currency: string;
  resetIn: string;
};

// The cash balance - the wallet's hero. A flat surface like the other cards so
// the number, not the decoration, carries the weight.
function WalletCard({ name, balance, currency, resetIn }: WalletCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Image src={logo} alt="" className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Tradexcel</span>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Virtual · {currency}
        </span>
      </div>

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">Cash balance</p>
      {balance == null ? (
        <span className="mt-1 block h-10 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatInr(balance)}</p>
      )}

      <div aria-hidden="true" className="min-h-6 flex-1" />
      <div className="flex items-end justify-between gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Account holder</p>
          <p className="truncate text-sm font-medium">{name ?? "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <PiArrowsClockwise aria-hidden="true" className="h-3.5 w-3.5" />
          Resets in <span className="font-semibold text-gray-900 dark:text-white">{resetIn}</span>
        </div>
      </div>
    </div>
  );
}

export default WalletCard;
