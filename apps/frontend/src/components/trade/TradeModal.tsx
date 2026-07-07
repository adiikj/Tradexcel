"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getStockData, buyStock, sellStock, buyContestStock, sellContestStock } from "../../api/api";
import { formatInr } from "../../utils/format";

const PRICE_REFRESH_MS = 10_000;

interface TradeModalProps {
  symbol: string;
  fullName?: string;
  side: "BUY" | "SELL";
  initialPrice: number;
  availableCash?: number;
  availableQty?: number;
  darkMode?: boolean;
  // When set, trades go against this contest's isolated ledger instead of the global wallet.
  contestId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function TradeModal({
  symbol,
  fullName,
  side,
  initialPrice,
  availableCash = 0,
  availableQty = 0,
  darkMode,
  contestId,
  onClose,
  onSuccess,
}: TradeModalProps) {
  const [livePrice, setLivePrice] = useState(initialPrice);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const data = await getStockData(symbol);
      if (data?.currentPrice) setLivePrice(data.currentPrice);
    }, PRICE_REFRESH_MS);

    return () => clearInterval(intervalRef.current);
  }, [symbol]);

  const total = livePrice * (quantity || 0);
  const isBuy = side === "BUY";
  const exceedsCash = isBuy && total > availableCash;
  const exceedsQty = !isBuy && quantity > availableQty;
  const isInvalid = !quantity || quantity < 1 || !Number.isInteger(quantity) || exceedsCash || exceedsQty;

  const handleSubmit = async () => {
    if (isSubmitting || isInvalid) return;

    try {
      setIsSubmitting(true);
      setError("");
      if (contestId) {
        if (isBuy) {
          await buyContestStock(contestId, symbol, quantity);
        } else {
          await sellContestStock(contestId, symbol, quantity);
        }
      } else if (isBuy) {
        await buyStock(symbol, quantity);
      } else {
        await sellStock(symbol, quantity);
      }
      toast.success(`${isBuy ? "Bought" : "Sold"} ${quantity} ${symbol}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Trade failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-xl p-6 shadow-xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">{isBuy ? "Buy" : "Sell"} {symbol}</h2>
            {fullName && <p className="text-sm text-gray-400">{fullName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-400">Live price</span>
          <span className="font-semibold">{formatInr(livePrice)}</span>
        </div>

        <label className="text-sm mb-1 block text-gray-400">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
          className={`w-full mb-2 px-4 py-2 rounded-md border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
        />

        <p className="text-xs text-gray-400 mb-4">
          {isBuy ? `Available cash: ${formatInr(availableCash)}` : `Available quantity: ${availableQty}`}
        </p>

        <div className="flex justify-between text-base font-bold mb-2">
          <span>Total</span>
          <span>{formatInr(total)}</span>
        </div>

        {exceedsCash && <p className="text-red-500 text-sm mb-2">Total exceeds your available cash.</p>}
        {exceedsQty && <p className="text-red-500 text-sm mb-2">Quantity exceeds what you hold.</p>}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isInvalid}
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors duration-200 ${
            isBuy ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? "Processing..." : `Confirm ${isBuy ? "Buy" : "Sell"}`}
        </button>
      </div>
    </div>
  );
}

export default TradeModal;
