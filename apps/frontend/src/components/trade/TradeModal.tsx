"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { estimateCharges, type OrderType } from "@tradexcel/shared";
import { getStockData, buyStock, sellStock, buyContestStock, sellContestStock } from "../../api/api";
import { formatInr } from "../../utils/format";
import Modal from "../ui/Modal";
import { apiErrorMessage } from "../../api/http";
import { useMarketStatus } from "../../hooks/useMarketStatus";

const PRICE_REFRESH_MS = 10_000;

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "MARKET", label: "Market" },
  { value: "LIMIT", label: "Limit" },
  { value: "STOP", label: "Stop-loss" },
];

// A limit order bounds the price; other pending orders fill at whatever the
// market price is then, so their total is only approximate.
function totalLabel(orderType: OrderType, isBuy: boolean, pending: boolean): string {
  if (!pending) return isBuy ? "You pay" : "You get";
  if (orderType === "LIMIT") return isBuy ? "Up to" : "At least";
  return "About";
}

// One line under the order-type picker saying what the chosen type will do.
function orderHint(orderType: OrderType, isBuy: boolean, queueing: boolean): string {
  if (orderType === "LIMIT") {
    return isBuy ? "Buys only at your price or lower." : "Sells only at your price or higher.";
  }
  if (orderType === "STOP") {
    return isBuy ? "Buys at the market price once the stock rises to your trigger." : "Sells at the market price once the stock falls to your trigger.";
  }
  return queueing ? "Placed when the market opens, at the opening price." : "Fills straight away at the live price.";
}

interface TradeModalProps {
  symbol: string;
  fullName?: string;
  side: "BUY" | "SELL";
  initialPrice: number;
  availableCash?: number;
  availableQty?: number;
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
  contestId,
  onClose,
  onSuccess,
}: TradeModalProps) {
  const [livePrice, setLivePrice] = useState(initialPrice);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [triggerInput, setTriggerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const marketStatus = useMarketStatus();
  // Main-wallet orders placed while the market is closed are queued by the
  // server and filled at the opening price. Contests don't queue.
  const queueing = !contestId && marketStatus.open === false;

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const data = await getStockData(symbol);
      if (data?.currentPrice) setLivePrice(data.currentPrice);
    }, PRICE_REFRESH_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbol]);

  const isBuy = side === "BUY";
  const priced = !contestId && orderType !== "MARKET";
  const triggerPrice = Number(triggerInput);
  const triggerValid = triggerInput !== "" && triggerPrice > 0 && /^\d+(\.\d{1,2})?$/.test(triggerInput);
  // A stop that's already been hit is rejected by the server; say so up front.
  const stopAlreadyHit = priced && orderType === "STOP" && triggerValid && (isBuy ? livePrice >= triggerPrice : livePrice <= triggerPrice);
  // Estimate at the price the order would most likely fill: a limit order at
  // its limit (the worst case), anything else at the live price.
  const refPrice = priced && orderType === "LIMIT" && triggerValid ? triggerPrice : livePrice;
  const total = refPrice * (quantity || 0);
  const charges = contestId ? 0 : estimateCharges(side, total).total;
  const net = isBuy ? total + charges : total - charges;
  // A queued buy may run in next season's wallet; the server checks it then.
  const exceedsCash = isBuy && !queueing && net > availableCash;
  const exceedsQty = !isBuy && quantity > availableQty;
  const isInvalid =
    !quantity || quantity < 1 || !Number.isInteger(quantity) || exceedsCash || exceedsQty || (priced && (!triggerValid || stopAlreadyHit));

  const handleSubmit = async () => {
    if (isSubmitting || isInvalid) return;

    try {
      setIsSubmitting(true);
      setError("");
      let result;
      if (contestId) {
        result = isBuy ? await buyContestStock(contestId, symbol, quantity) : await sellContestStock(contestId, symbol, quantity);
      } else {
        const order = priced ? { orderType: orderType as "LIMIT" | "STOP", triggerPrice } : undefined;
        result = isBuy ? await buyStock(symbol, quantity, order) : await sellStock(symbol, quantity, order);
      }
      // The server decides (by its clock) whether the order filled or was queued.
      if (result?.data?.queued) {
        toast.success(result.message);
      } else {
        toast.success(`${isBuy ? "Bought" : "Sold"} ${quantity} ${symbol}`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Trade failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      label={`${isBuy ? "Buy" : "Sell"} ${symbol}`}
      className={`rounded-xl p-6 bg-white text-black dark:bg-gray-900 dark:text-white`}
    >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">{isBuy ? "Buy" : "Sell"} {symbol}</h2>
            {fullName && <p className="text-sm text-gray-400">{fullName}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-400">{queueing ? "Last price" : "Live price"}</span>
          <span className="font-semibold">{formatInr(livePrice)}</span>
        </div>

        {!contestId && (
          <div className="mb-4">
            <div role="group" aria-label="Order type" className="grid grid-cols-3 rounded-xl bg-gray-100 p-0.5 dark:bg-gray-800">
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={orderType === t.value}
                  onClick={() => setOrderType(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    orderType === t.value
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{orderHint(orderType, isBuy, queueing)}</p>
          </div>
        )}

        {priced && (
          <>
            <label htmlFor="trade-modal-trigger" className="text-sm mb-1 block text-gray-400">
              {orderType === "LIMIT" ? "Limit price (₹)" : "Trigger price (₹)"}
            </label>
            <input
              id="trade-modal-trigger"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.05}
              placeholder={livePrice.toFixed(2)}
              value={triggerInput}
              onChange={(e) => setTriggerInput(e.target.value)}
              aria-invalid={triggerInput !== "" && (!triggerValid || stopAlreadyHit)}
              className="w-full mb-2 px-4 py-2 rounded-md border bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700"
            />
            {triggerInput !== "" && !triggerValid && <p className="text-red-500 text-sm mb-2">Enter a price above ₹0 with at most 2 decimals.</p>}
            {stopAlreadyHit && (
              <p className="text-red-500 text-sm mb-2">
                {isBuy ? "The trigger must be above" : "The trigger must be below"} the live price ({formatInr(livePrice)}).
              </p>
            )}
          </>
        )}

        <label htmlFor="trade-modal-quantity" className="text-sm mb-1 block text-gray-400">Quantity</label>
        <input
          id="trade-modal-quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
          className={`w-full mb-2 px-4 py-2 rounded-md border bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700`}
        />

        <p className="text-xs text-gray-400 mb-4">
          {isBuy ? `Available cash: ${formatInr(availableCash)}` : `Available quantity: ${availableQty}`}
        </p>

        {contestId ? (
          <div className="flex justify-between text-base font-bold mb-2">
            <span>Total</span>
            <span>{formatInr(total)}</span>
          </div>
        ) : (
          <dl className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <dt>{quantity || 0} × {formatInr(refPrice)}</dt>
              <dd className="tabular-nums">{formatInr(total)}</dd>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <dt title="Brokerage, STT, exchange and SEBI fees, stamp duty and GST">Charges (est.)</dt>
              <dd className="tabular-nums">
                {isBuy ? "+" : "−"}
                {formatInr(charges)}
              </dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>{totalLabel(orderType, isBuy, priced || queueing)}</dt>
              <dd className="tabular-nums">{formatInr(net)}</dd>
            </div>
          </dl>
        )}

        {queueing && orderType === "MARKET" && (
          <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            The market is closed. Your order will be placed when market opens, at the opening price.
          </p>
        )}
        {exceedsCash && <p className="text-red-500 text-sm mb-2">Total with charges exceeds your available cash.</p>}
        {exceedsQty && <p className="text-red-500 text-sm mb-2">Quantity exceeds what you hold.</p>}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isInvalid}
          className={`w-full py-3 rounded-md font-semibold text-white transition-colors duration-200 ${
            isBuy ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting
            ? "Processing..."
            : priced
              ? `Place ${orderType === "LIMIT" ? "limit" : "stop"} ${isBuy ? "buy" : "sell"}`
              : `${queueing ? "Queue" : "Confirm"} ${isBuy ? "Buy" : "Sell"}`}
        </button>
    </Modal>
  );
}

export default TradeModal;
