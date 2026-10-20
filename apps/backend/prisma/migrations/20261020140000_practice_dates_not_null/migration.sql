-- The practice schema types "dates" as a required Date[], but the column was
-- created nullable, so a session row with no dates was possible and Prisma
-- would fail to read it. The table is empty at the time this runs.
ALTER TABLE "PracticeSession" ALTER COLUMN "dates" SET NOT NULL;
