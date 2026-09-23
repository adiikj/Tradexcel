-- Database-level backstop for the trading engine: a balance can never go
-- negative and a holding row only exists while it holds shares (zero-quantity
-- holdings are deleted on sell). Application code locks the ledger row before
-- trading (src/services/ledgerLock.ts); these catch anything that slips past.
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_balance_non_negative" CHECK ("balance" >= 0);
ALTER TABLE "ContestEntry" ADD CONSTRAINT "ContestEntry_balance_non_negative" CHECK ("balance" >= 0);
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "ContestHolding" ADD CONSTRAINT "ContestHolding_quantity_positive" CHECK ("quantity" > 0);
