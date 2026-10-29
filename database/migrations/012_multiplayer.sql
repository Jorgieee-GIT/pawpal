-- PawPal multiplayer challenges, escrow, and server-authoritative turn-based battles.
-- Run with: psql "$DATABASE_URL" -f database/migrations/012_multiplayer.sql
CREATE TABLE IF NOT EXISTS multiplayer_challenges (
    id UUID PRIMARY KEY,
    game_id TEXT NOT NULL,
    challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wager INTEGER NOT NULL CHECK (wager > 0 AND wager <= 1000000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished', 'declined', 'cancelled', 'expired')),
    battle JSONB,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (challenger_id <> challenged_id)
);
CREATE INDEX IF NOT EXISTS multiplayer_challenges_challenger_idx ON multiplayer_challenges(challenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS multiplayer_challenges_challenged_idx ON multiplayer_challenges(challenged_id, created_at DESC);
CREATE INDEX IF NOT EXISTS multiplayer_challenges_expiring_idx ON multiplayer_challenges(status, expires_at);
