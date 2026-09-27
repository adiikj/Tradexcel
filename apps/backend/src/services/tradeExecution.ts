import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";
import { computeWeightedAvgPrice, computeRemainingQuantity, canAfford, canSell } from "./tradeMath.js";
import { lockWallet } from "./ledgerLock.js";
import { computeCharges } from "./charges.js";

// Main-wallet fills, shared by the trade endpoints (market open) and the
// queued-order job (first tick after the open, or a limit/stop price reached).
// Both must run inside an interactive transaction - these take the wallet lock
// as their first statement. Charges are added to a buy's cost and taken from a
// sale's proceeds; the holding's average price stays the plain share price,
// as brokers show it.

export async function executeBuy(
  tx: Prisma.TransactionClient,
  userId: string,
  symbol: string,
  quantity: number,
  price: Prisma.Decimal
) {
  await lockWallet(tx, userId);
  const total = price.mul(quantity);
  const charges = computeCharges("BUY", total).total;

  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }
  if (!canAfford(total.add(charges), wallet.balance)) {
    throw new ApiError(400, "Insufficient funds for this trade and its charges");
  }

  const updatedWallet = await tx.wallet.update({
    where: { userId },
    data: { balance: { decrement: total.add(charges) } },
  });

  const existingHolding = await tx.holding.findUnique({
    where: { userId_symbol: { userId, symbol } },
  });

  const holding = existingHolding
    ? await tx.holding.update({
        where: { userId_symbol: { userId, symbol } },
        data: {
          quantity: existingHolding.quantity + quantity,
          avgBuyPrice: computeWeightedAvgPrice(existingHolding.quantity, existingHolding.avgBuyPrice, quantity, total),
        },
      })
    : await tx.holding.create({
        data: { userId, symbol, quantity, avgBuyPrice: price },
      });

  const transaction = await tx.transaction.create({
    data: { userId, symbol, side: "BUY", quantity, price, total, charges },
  });

  return { wallet: updatedWallet, holding, transaction };
}

export async function executeSell(
  tx: Prisma.TransactionClient,
  userId: string,
  symbol: string,
  quantity: number,
  price: Prisma.Decimal
) {
  await lockWallet(tx, userId);

  const holding = await tx.holding.findUnique({
    where: { userId_symbol: { userId, symbol } },
  });
  if (!holding || !canSell(quantity, holding.quantity)) {
    throw new ApiError(400, "Insufficient holdings to sell");
  }

  const total = price.mul(quantity);
  const charges = computeCharges("SELL", total).total;
  const wallet = await tx.wallet.update({
    where: { userId },
    data: { balance: { increment: total.sub(charges) } },
  });

  const remainingQuantity = computeRemainingQuantity(holding.quantity, quantity);
  const updatedHolding =
    remainingQuantity === 0
      ? await tx.holding.delete({ where: { userId_symbol: { userId, symbol } } }).then(() => null)
      : await tx.holding.update({
          where: { userId_symbol: { userId, symbol } },
          data: { quantity: remainingQuantity },
        });

  const transaction = await tx.transaction.create({
    data: { userId, symbol, side: "SELL", quantity, price, total, charges },
  });

  return { wallet, holding: updatedHolding, transaction };
}
