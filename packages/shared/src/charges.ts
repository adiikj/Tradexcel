// Simulated per-trade charges for NSE equity delivery, in the shape a discount
// broker's contract note shows them. The backend computes the real amounts with
// Decimal math (services/charges.ts); the frontend uses these rates for estimates.
export const CHARGE_RATES = {
  brokeragePercent: 0.03, // of turnover...
  brokerageCap: 20, // ...capped at ₹20 an order
  sttPercent: 0.1, // securities transaction tax, buy and sell
  exchangePercent: 0.00297, // NSE transaction charge
  sebiPerCrore: 10, // SEBI turnover fee, ₹10 per ₹1 crore
  stampDutyPercent: 0.015, // buy side only
  gstPercent: 18, // on brokerage + exchange + SEBI fees
} as const;

export type ChargeBreakdown = {
  brokerage: number;
  stt: number;
  exchange: number;
  sebi: number;
  stampDuty: number;
  gst: number;
  total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Number-based estimate for display. Matches the backend to the paisa for
// ordinary trade sizes; the backend's figure is the one actually charged.
export function estimateCharges(side: "BUY" | "SELL", turnover: number): ChargeBreakdown {
  const r = CHARGE_RATES;
  const brokerage = round2(Math.min((turnover * r.brokeragePercent) / 100, r.brokerageCap));
  const stt = round2((turnover * r.sttPercent) / 100);
  const exchange = round2((turnover * r.exchangePercent) / 100);
  const sebi = round2((turnover * r.sebiPerCrore) / 1e7);
  const stampDuty = side === "BUY" ? round2((turnover * r.stampDutyPercent) / 100) : 0;
  const gst = round2(((brokerage + exchange + sebi) * r.gstPercent) / 100);
  return { brokerage, stt, exchange, sebi, stampDuty, gst, total: round2(brokerage + stt + exchange + sebi + stampDuty + gst) };
}
