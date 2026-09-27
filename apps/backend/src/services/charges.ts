import { Prisma } from "@prisma/client";
import { CHARGE_RATES } from "@tradexcel/shared";
import type { Side } from "@prisma/client";

// Simulated NSE delivery charges on main-wallet trades (rates in the shared
// package, so the trade modal's estimate uses the same schedule). Each line is
// rounded to the paisa like a contract note; contest trades stay charge-free.

const D = (n: number | string) => new Prisma.Decimal(n);
const pct = (turnover: Prisma.Decimal, percent: number) => turnover.mul(percent).div(100).toDecimalPlaces(2);

export type Charges = {
  brokerage: Prisma.Decimal;
  stt: Prisma.Decimal;
  exchange: Prisma.Decimal;
  sebi: Prisma.Decimal;
  stampDuty: Prisma.Decimal;
  gst: Prisma.Decimal;
  total: Prisma.Decimal;
};

export function computeCharges(side: Side, turnover: Prisma.Decimal): Charges {
  const r = CHARGE_RATES;
  const brokerage = Prisma.Decimal.min(pct(turnover, r.brokeragePercent), D(r.brokerageCap));
  const stt = pct(turnover, r.sttPercent);
  const exchange = pct(turnover, r.exchangePercent);
  const sebi = turnover.mul(r.sebiPerCrore).div(1e7).toDecimalPlaces(2);
  const stampDuty = side === "BUY" ? pct(turnover, r.stampDutyPercent) : D(0);
  const gst = pct(brokerage.add(exchange).add(sebi), r.gstPercent);
  const total = brokerage.add(stt).add(exchange).add(sebi).add(stampDuty).add(gst);
  return { brokerage, stt, exchange, sebi, stampDuty, gst, total };
}
