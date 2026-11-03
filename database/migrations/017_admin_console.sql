-- PawPal Admin Panel 2.0: additive only. Apply after 016_password_recovery.sql.
CREATE TABLE IF NOT EXISTS admin_game_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO admin_game_settings(key,value) VALUES
('maintenance_mode','false'::jsonb),
('feature_arcade','true'::jsonb),
('feature_garden','true'::jsonb),
('feature_kitchen','true'::jsonb),
('feature_multiplayer','true'::jsonb),
('feature_missions','true'::jsonb),
('feature_pawclaw','true'::jsonb),
('feature_shop','true'::jsonb),
('arcade_reward_percent','100'::jsonb),
('garden_reward_percent','100'::jsonb),
('arcade_cooldown_seconds','8'::jsonb),
('claw_cooldown_seconds','15'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    target TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_audit_recent_idx ON admin_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_announcements (
    id UUID PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    body VARCHAR(1200) NOT NULL,
    audience TEXT NOT NULL CHECK (audience IN ('all','selected')),
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    publish_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_announcements_recent_idx ON admin_announcements(created_at DESC);
CREATE TABLE IF NOT EXISTS admin_announcement_reads (
    announcement_id UUID NOT NULL REFERENCES admin_announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (announcement_id,user_id)
);

CREATE TABLE IF NOT EXISTS player_reports (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('bug','player','feedback','other')),
    description VARCHAR(1000) NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS player_reports_recent_idx ON player_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_error_logs (
    id BIGSERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    error_code VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_error_recent_idx ON admin_error_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_player_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_presence_recent_idx ON admin_player_presence(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS admin_coin_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_coin_events_recent_idx ON admin_coin_events(created_at DESC);

-- Single-admin player access controls. No additional admin roles are introduced.
CREATE TABLE IF NOT EXISTS admin_user_access (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    suspended BOOLEAN NOT NULL DEFAULT FALSE,
    lucky_games_access BOOLEAN NOT NULL DEFAULT FALSE,
    disabled_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
