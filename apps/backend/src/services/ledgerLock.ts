import { Prisma } from "@prisma/client";

// Row-level locks that serialize trades against one ledger. Every trade reads
// a balance/holding, checks it, then writes - under READ COMMITTED two
// concurrent requests can both pass the check (double-sell, overdraw, lost
// holding updates). Every buy and sell touches the ledger's balance row, so
// locking that row first makes all trades on the same ledger run one at a
// time. Must be the first statement inside the interactive transaction.

export async function lockWallet(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;
}

export async function lockContestEntry(tx: Prisma.TransactionClient, entryId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "ContestEntry" WHERE "id" = ${entryId} FOR UPDATE`;
}
