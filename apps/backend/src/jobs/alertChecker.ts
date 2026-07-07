import cron from "node-cron";
import prisma from "../db/prisma.js";
import { getQuotes } from "../services/pricing.js";
import { sendEmail } from "../services/mailer.js";

// Batches one quote fetch per unique symbol across all alerts, not one per alert.
export async function checkPriceAlerts(): Promise<number> {
  const alerts = await prisma.priceAlert.findMany({
    where: { triggered: false },
    include: { user: { select: { email: true, name: true } } },
  });

  if (alerts.length === 0) return 0;

  const symbols = [...new Set(alerts.map((a) => a.symbol))];
  const quotes = await getQuotes(symbols);

  let triggeredCount = 0;

  for (const alert of alerts) {
    const quote = quotes[alert.symbol];
    if (!quote) continue;

    const hit =
      alert.direction === "ABOVE"
        ? quote.price >= alert.targetPrice.toNumber()
        : quote.price <= alert.targetPrice.toNumber();

    if (!hit) continue;

    try {
      await sendEmail({
        to: alert.user.email,
        subject: `${alert.symbol} hit your target price`,
        html: `<h3>${alert.symbol} is now ₹${quote.price.toFixed(2)}, ${
          alert.direction === "ABOVE" ? "at or above" : "at or below"
        } your target of ₹${alert.targetPrice.toFixed(2)}.</h3>`,
        text: `${alert.symbol} is now ₹${quote.price.toFixed(2)}, ${
          alert.direction === "ABOVE" ? "at or above" : "at or below"
        } your target of ₹${alert.targetPrice.toFixed(2)}.`,
      });
    } catch (error: any) {
      console.error(`Failed to send alert email to ${alert.user.email}:`, error.message);
      // Not marking triggered lets the next tick retry.
      continue;
    }

    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { triggered: true, triggeredAt: new Date() },
    });
    triggeredCount += 1;
  }

  return triggeredCount;
}

export function startAlertCheckerJob() {
  checkPriceAlerts().catch((error) => console.error("Price alert check (startup) failed:", error));

  cron.schedule("*/2 * * * *", () => {
    checkPriceAlerts().catch((error) => console.error("Price alert check failed:", error));
  });
}
