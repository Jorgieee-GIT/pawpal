-- Paw Brawl Duo Clash: additive, rerunnable migration. Existing 1v1 untouched.
CREATE TABLE IF NOT EXISTS duo_rooms (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wager INTEGER NOT NULL DEFAULT 0 CHECK (wager BETWEEN 0 AND 100),
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','active','finished','void')),
    battle JSONB,
    winner_team SMALLINT CHECK (winner_team IS NULL OR winner_team IN (0,1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS duo_rooms_participants_idx ON duo_rooms USING GIN (participants jsonb_path_ops);
CREATE INDEX IF NOT EXISTS duo_rooms_status_idx ON duo_rooms(status,updated_at);
CREATE TABLE IF NOT EXISTS duo_records (
    room_id UUID NOT NULL REFERENCES duo_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team SMALLINT NOT NULL CHECK (team IN (0,1)),
    outcome TEXT NOT NULL CHECK (outcome IN ('win','loss','draw')),
    wager INTEGER NOT NULL CHECK (wager BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS duo_records_user_idx ON duo_records(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS duo_invites (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES duo_rooms(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '20 minutes'),
    UNIQUE(room_id,recipient_id)
);
CREATE INDEX IF NOT EXISTS duo_invites_recipient_idx ON duo_invites(recipient_id,expires_at);
ALTER TABLE duo_records ADD COLUMN IF NOT EXISTS cover_damage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE duo_records ADD COLUMN IF NOT EXISTS rescues INTEGER NOT NULL DEFAULT 0;
ALTER TABLE duo_records ADD COLUMN IF NOT EXISTS damage_dealt INTEGER NOT NULL DEFAULT 0;
