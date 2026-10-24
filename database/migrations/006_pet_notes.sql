-- Safe to run on existing Neon PostgreSQL databases.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_note VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS note_expires_at TIMESTAMPTZ;
