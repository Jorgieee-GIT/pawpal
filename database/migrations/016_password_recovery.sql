-- PawPal: admin-assisted password recovery. Run on Neon before deploying the API.
-- Tokens are hashed at rest, single-use, and expire in five minutes.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_key_hash CHAR(64) NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','expired','completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS password_reset_requests_user_time_idx
    ON password_reset_requests(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_requests_status_idx
    ON password_reset_requests(status,created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES password_reset_requests(id) ON DELETE SET NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
    ON password_reset_tokens(user_id,expires_at DESC);
