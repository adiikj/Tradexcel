import { PrismaClient } from "@prisma/client";

// Neon is serverless Postgres: the compute suspends when idle and has a
// per-branch connection cap. Two pool settings keep us inside that cap:
//
//   connection_limit - how many connections Prisma opens at once. The default
//                      is based on the CPU count, which is a guess that has
//                      nothing to do with what the database will accept.
//   pool_timeout     - how long Prisma waits for a free connection. The
//                      default is 10s, which is short when the compute is
//                      resuming and answering late.
//
// Both can be set on DATABASE_URL itself, in which case they are left alone.
// The query string is rebuilt with URLSearchParams rather than `new URL`, so a
// password containing reserved characters is never re-encoded.
const CONNECTION_LIMIT = "5";
const POOL_TIMEOUT = "20";

function withPoolSettings(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const [base, query] = raw.split("?");
  const params = new URLSearchParams(query ?? "");
  if (!params.has("connection_limit")) params.set("connection_limit", CONNECTION_LIMIT);
  if (!params.has("pool_timeout")) params.set("pool_timeout", POOL_TIMEOUT);
  return `${base}?${params.toString()}`;
}

// Reuse a single PrismaClient across hot-reloads in dev to avoid exhausting
// database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasources: { db: { url: withPoolSettings(process.env.DATABASE_URL) } } });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
