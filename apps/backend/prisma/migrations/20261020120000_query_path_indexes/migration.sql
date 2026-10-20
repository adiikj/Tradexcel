-- Indexes for the hottest read paths.
--
-- Transaction: the journal, the analytics replay and the activity feed all
-- read one user's trades newest-first, and the table had no index at all.
-- PriceAlert: the alert checker scans for untriggered alerts every two
-- minutes, so without this it reads every alert ever created; the second
-- index serves the alerts panel.
-- ContestEntry: "which contests have I entered?" and "who won?".
-- Contest: the settlement job looks for contests whose end time has passed.

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Contest_endAt_idx" ON "Contest"("endAt");

-- CreateIndex
CREATE INDEX "ContestEntry_userId_idx" ON "ContestEntry"("userId");

-- CreateIndex
CREATE INDEX "ContestEntry_finalRank_idx" ON "ContestEntry"("finalRank");

-- CreateIndex
CREATE INDEX "PriceAlert_triggered_idx" ON "PriceAlert"("triggered");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_createdAt_idx" ON "PriceAlert"("userId", "createdAt");
