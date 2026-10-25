-- Run in Neon SQL Editor before deploying the new server.
ALTER TABLE paw_mail ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'blush';
ALTER TABLE paw_mail DROP CONSTRAINT IF EXISTS paw_mail_design_check;
CREATE TABLE IF NOT EXISTS paw_mail_envelopes (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,design TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(user_id,design));
