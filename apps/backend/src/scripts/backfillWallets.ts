// Seeds a Wallet for any pre-existing user missing one. Safe to re-run.
// Run with: pnpm --filter @tradexcel/backend backfill:wallets
import prisma from "../db/prisma.js";

const STARTING_BALANCE = "100000";

async function main() {
  const usersWithoutWallet = await prisma.user.findMany({
    where: { wallet: null },
    select: { id: true, username: true },
  });

  if (usersWithoutWallet.length === 0) {
    console.log("No users missing a wallet.");
    return;
  }

  await prisma.wallet.createMany({
    data: usersWithoutWallet.map((user) => ({
      userId: user.id,
      balance: STARTING_BALANCE,
    })),
  });

  console.log(
    `Created ${usersWithoutWallet.length} wallet(s) for: ${usersWithoutWallet
      .map((u) => u.username)
      .join(", ")}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
