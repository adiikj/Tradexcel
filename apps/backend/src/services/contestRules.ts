import { Prisma } from "@prisma/client";

// Optional per-contest trading rules, checked on every contest buy (sells
// only ever reduce exposure, so they're always allowed).
export type ContestRules = { maxHoldings: number | null; maxPositionPercent: number | null };

type Holding = { symbol: string; quantity: number; avgBuyPrice: Prisma.Decimal };

// Returns why this buy breaks a rule, or null if it's allowed. Net worth is
// cash + holdings at current prices (a buy only moves value from cash into
// stock, so it's the same before and after the trade).
export function contestRuleViolation(
  rules: ContestRules,
  holdings: Holding[],
  quotes: Record<string, { price: number } | null>,
  balance: Prisma.Decimal,
  symbol: string,
  quantity: number,
  price: Prisma.Decimal
): string | null {
  const existing = holdings.find((h) => h.symbol === symbol);

  if (rules.maxHoldings != null && !existing && holdings.length >= rules.maxHoldings) {
    return `This contest allows at most ${rules.maxHoldings} different stock${rules.maxHoldings === 1 ? "" : "s"} at a time. Sell one to make room.`;
  }

  if (rules.maxPositionPercent != null) {
    const holdingsValue = holdings.reduce((sum, h) => {
      const current = h.symbol === symbol ? price : quotes[h.symbol] ? new Prisma.Decimal(quotes[h.symbol]!.price) : h.avgBuyPrice;
      return sum.add(current.mul(h.quantity));
    }, new Prisma.Decimal(0));
    const netWorth = balance.add(holdingsValue);
    const position = price.mul((existing?.quantity ?? 0) + quantity);
    if (position.gt(netWorth.mul(rules.maxPositionPercent).div(100))) {
      return `No single stock can be more than ${rules.maxPositionPercent}% of your contest portfolio. Try a smaller quantity.`;
    }
  }

  return null;
}
