import { Prisma } from "@prisma/client";

export function computeWeightedAvgPrice(
  existingQuantity: number,
  existingAvgPrice: Prisma.Decimal,
  buyQuantity: number,
  buyTotal: Prisma.Decimal
): Prisma.Decimal {
  return existingAvgPrice.mul(existingQuantity).add(buyTotal).div(existingQuantity + buyQuantity);
}

export function computeRemainingQuantity(heldQuantity: number, sellQuantity: number): number {
  return heldQuantity - sellQuantity;
}

export function canAfford(total: Prisma.Decimal, walletBalance: Prisma.Decimal): boolean {
  return !total.gt(walletBalance);
}

export function canSell(sellQuantity: number, heldQuantity: number): boolean {
  return sellQuantity <= heldQuantity;
}

export function calculateHoldingsValue(
  holdings: { symbol: string; quantity: number; avgBuyPrice: Prisma.Decimal }[],
  quotes: Record<string, { price: number } | null>
): Prisma.Decimal {
  return holdings.reduce((sum, holding) => {
    const quote = quotes[holding.symbol];
    const price = quote ? new Prisma.Decimal(quote.price) : holding.avgBuyPrice;
    return sum.add(price.mul(holding.quantity));
  }, new Prisma.Decimal(0));
}
