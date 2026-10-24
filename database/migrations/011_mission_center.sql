-- Batch 13. Run once on the same PostgreSQL database used by the backend.
CREATE TABLE IF NOT EXISTS mission_events (
 id BIGSERIAL PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 metric TEXT NOT NULL,
 amount INTEGER NOT NULL DEFAULT 1 CHECK(amount>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mission_events_user_time ON mission_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS mission_events_user_metric ON mission_events(user_id,metric);
CREATE TABLE IF NOT EXISTS mission_claims (
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mission_id TEXT NOT NULL,
 period TEXT NOT NULL,
 claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,mission_id,period)
);
