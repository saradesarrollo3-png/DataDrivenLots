
-- Add tx_hash column to traceability_events table
ALTER TABLE "traceability_events" ADD COLUMN IF NOT EXISTS "tx_hash" text;
