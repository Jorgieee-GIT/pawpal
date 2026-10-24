-- Batch 7: PawMail. Run once against the SAME database used by the API.
CREATE TABLE IF NOT EXISTS paw_mail (
 id UUID PRIMARY KEY,
 sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 design TEXT NOT NULL CHECK (design IN ('strawberry','lavender','sunshine','moonlight')),
 message TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 expires_at TIMESTAMPTZ NOT NULL,
 read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS paw_mail_recipient_expiry_idx ON paw_mail(recipient_id,expires_at DESC);
