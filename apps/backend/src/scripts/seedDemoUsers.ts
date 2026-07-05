// Seeds a handful of demo accounts with varied, realistic portfolios so the
// leaderboard and Market/Portfolio pages have real signal for a first-time
// visitor (recruiter demo) instead of a single empty account.
//
// Idempotent — safe to re-run; each demo user (and their wallet/holdings/
// transactions) is deleted and recreated fresh every time.
//
// Run with: pnpm --filter @mocket/backend seed:demo
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";
import { getQuotes } from "../services/pricing.js";

const STARTING_BALANCE = "100000";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_PIN = "0000";

const AVATARS = [
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/rf2tm0acjgmcawzvardw.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/stel0tavrlhrxxvfq0mj.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/fh6ryx53hoc9ioxgzz6n.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/zbwoszxkryveenz5d2am.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/jrcjbhxn0njurj9u71vr.png",
];

interface DemoUser {
  name: string;
  username: string;
  email: string;
  // costBasisFactor simulates having bought at a different historical price
  // than today's live quote (e.g. 0.9 = bought 10% cheaper than now, a
  // paper gain). A brand-new real trade always has zero P&L until the
  // market moves — this backdating is purely cosmetic seed data so the
  // leaderboard shows realistic spread immediately instead of nine ties.
  costBasisFactor: number;
  holdings: { symbol: string; quantity: number }[];
}

const DEMO_USERS: DemoUser[] = [
  {
    name: "Priya Sharma",
    username: "priya_sharma",
    email: "priya.sharma@mocket.demo",
    costBasisFactor: 0.92,
    holdings: [
      { symbol: "RELIANCE.NS", quantity: 10 },
      { symbol: "TCS.NS", quantity: 5 },
    ],
  },
  {
    name: "Rahul Verma",
    username: "rahul_verma",
    email: "rahul.verma@mocket.demo",
    costBasisFactor: 1.05,
    holdings: [
      { symbol: "HDFCBANK.NS", quantity: 15 },
      { symbol: "ICICIBANK.NS", quantity: 10 },
      { symbol: "SBIN.NS", quantity: 20 },
    ],
  },
  {
    name: "Ananya Iyer",
    username: "ananya_iyer",
    email: "ananya.iyer@mocket.demo",
    costBasisFactor: 0.85,
    holdings: [
      { symbol: "TITAN.NS", quantity: 8 },
      { symbol: "ASIANPAINT.NS", quantity: 5 },
    ],
  },
  {
    name: "Vikram Mehta",
    username: "vikram_mehta",
    email: "vikram.mehta@mocket.demo",
    costBasisFactor: 1.1,
    holdings: [
      { symbol: "BAJFINANCE.NS", quantity: 6 },
      { symbol: "MARUTI.NS", quantity: 3 },
    ],
  },
  {
    name: "Sneha Kapoor",
    username: "sneha_kapoor",
    email: "sneha.kapoor@mocket.demo",
    costBasisFactor: 0.97,
    holdings: [
      { symbol: "WIPRO.NS", quantity: 25 },
      { symbol: "ITC.NS", quantity: 30 },
    ],
  },
  {
    name: "Arjun Nair",
    username: "arjun_nair",
    email: "arjun.nair@mocket.demo",
    costBasisFactor: 1.02,
    holdings: [
      { symbol: "ADANIPORTS.NS", quantity: 12 },
      { symbol: "POWERGRID.NS", quantity: 20 },
      { symbol: "BHARTIARTL.NS", quantity: 15 },
    ],
  },
  {
    name: "Divya Rao",
    username: "divya_rao",
    email: "divya.rao@mocket.demo",
    costBasisFactor: 0.9,
    holdings: [
      { symbol: "TCS.NS", quantity: 15 },
      { symbol: "HCLTECH.NS", quantity: 10 },
    ],
  },
  {
    name: "Karan Singh",
    username: "karan_singh",
    email: "karan.singh@mocket.demo",
    costBasisFactor: 1.15,
    holdings: [
      { symbol: "SBIN.NS", quantity: 40 },
      { symbol: "PNB.NS", quantity: 50 },
    ],
  },
];

async function main() {
  const allSymbols = [...new Set(DEMO_USERS.flatMap((u) => u.holdings.map((h) => h.symbol)))];
  console.log(`Fetching live quotes for ${allSymbols.length} symbols...`);
  const quotes = await getQuotes(allSymbols);

  for (const [i, demoUser] of DEMO_USERS.entries()) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: demoUser.email }, { username: demoUser.username }] },
    });
    if (existing) {
      await prisma.transaction.deleteMany({ where: { userId: existing.id } });
      await prisma.holding.deleteMany({ where: { userId: existing.id } });
      await prisma.wallet.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const hashedPin = await bcrypt.hash(DEMO_PIN, 10);

    const user = await prisma.user.create({
      data: {
        name: demoUser.name,
        username: demoUser.username,
        email: demoUser.email,
        password: hashedPassword,
        pin: hashedPin,
        avatar: AVATARS[i % AVATARS.length],
        otpVerified: true,
      },
    });

    await prisma.wallet.create({ data: { userId: user.id, balance: STARTING_BALANCE } });

    for (const { symbol, quantity } of demoUser.holdings) {
      const quote = quotes[symbol];
      if (!quote) {
        console.warn(`  No quote for ${symbol}, skipping this position for ${demoUser.username}`);
        continue;
      }

      const price = new Prisma.Decimal(quote.price).mul(demoUser.costBasisFactor);
      const total = price.mul(quantity);

      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: user.id } });
        if (total.gt(wallet.balance)) {
          console.warn(`  ${demoUser.username} can't afford ${quantity}x ${symbol}, skipping`);
          return;
        }

        await tx.wallet.update({ where: { userId: user.id }, data: { balance: { decrement: total } } });
        await tx.holding.create({ data: { userId: user.id, symbol, quantity, avgBuyPrice: price } });
        await tx.transaction.create({
          data: { userId: user.id, symbol, side: "BUY", quantity, price, total },
        });
      });
    }

    console.log(`Seeded ${demoUser.username} (${demoUser.holdings.length} positions)`);
  }

  console.log(`Done. Seeded ${DEMO_USERS.length} demo users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
