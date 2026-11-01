-- Paw Brawl 3.3: audit-only Arena Fee ledger, no spendable server wallet.
-- Run once on Neon before deploying updated Render backend.
-- Only NEW matches pay the fee; already-created matches retain 0% as promised.
-- A winning match removes up to 5% of the gross pool from circulation.
-- Fee is rounded down to a multiple of winners (1 or 2) so payouts stay equal.
-- Draws, voids and cancelled/declined/expired matches refund stakes in full.
CREATE TABLE IF NOT EXISTS arena_fee_ledger (
    mode TEXT NOT NULL CHECK (mode IN ('classic_1v1','duo_2v2')),
    match_id UUID NOT NULL,
    gross_pool INTEGER NOT NULL CHECK (gross_pool >= 0),
    fee_amount INTEGER NOT NULL CHECK (fee_amount >= 0 AND fee_amount <= gross_pool),
    winning_players SMALLINT NOT NULL CHECK (winning_players IN (1,2)),
    payout_per_winner INTEGER NOT NULL CHECK (payout_per_winner >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (mode, match_id),
    CHECK (gross_pool = fee_amount + winning_players * payout_per_winner)
);
CREATE INDEX IF NOT EXISTS arena_fee_ledger_created_idx ON arena_fee_ledger(created_at DESC);

-- Existing challenges/rooms are fee-free. New inserts inherit 5%.
ALTER TABLE multiplayer_challenges
    ADD COLUMN IF NOT EXISTS arena_fee_percent SMALLINT NOT NULL DEFAULT 0 CHECK (arena_fee_percent BETWEEN 0 AND 5);
ALTER TABLE multiplayer_challenges ALTER COLUMN arena_fee_percent SET DEFAULT 5;
ALTER TABLE duo_rooms
    ADD COLUMN IF NOT EXISTS arena_fee_percent SMALLINT NOT NULL DEFAULT 0 CHECK (arena_fee_percent BETWEEN 0 AND 5);
ALTER TABLE duo_rooms ALTER COLUMN arena_fee_percent SET DEFAULT 5;
