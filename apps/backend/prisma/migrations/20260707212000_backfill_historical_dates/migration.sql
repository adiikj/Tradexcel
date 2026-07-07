-- The previous migration left "historicalDates" nullable with no default,
-- so any pre-existing Contest row got NULL there — which crashes Prisma
-- reads since the schema types it as a required Date[]. Backfill to an
-- empty array (== "not a replay contest") and lock in NOT NULL + DEFAULT,
-- matching how "symbols" was hardened during the Phase 1 migration.
UPDATE "Contest" SET "historicalDates" = ARRAY[]::DATE[] WHERE "historicalDates" IS NULL;
ALTER TABLE "Contest" ALTER COLUMN "historicalDates" SET NOT NULL;
ALTER TABLE "Contest" ALTER COLUMN "historicalDates" SET DEFAULT ARRAY[]::DATE[];
