-- "symbols" was added with a default (20260707210000) and the default was
-- meant to be dropped by 20260707153800 - which runs before that column
-- exists, so on a database built from scratch the drop never happened and
-- the column was left with a default the schema doesn't declare. Drop it
-- here so the end state is the same however the history was applied.
--
-- No-op on a database where the default was already dropped.
ALTER TABLE "Contest" ALTER COLUMN "symbols" DROP DEFAULT;
