-- PawPal 4.6: viewed notifications are no longer treated as new just because
-- an invitation remains pending. The unread marker follows the account across devices.
CREATE TABLE IF NOT EXISTS player_notification_seen (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    event_created_at TIMESTAMPTZ NOT NULL,
    seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, kind, event_id, event_created_at)
);
CREATE INDEX IF NOT EXISTS player_notification_seen_time_idx
    ON player_notification_seen(user_id, seen_at DESC);
 