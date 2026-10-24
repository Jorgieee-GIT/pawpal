-- Batch 9: two free rooms, two coin-unlockable rooms. Safe to rerun.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS active_room TEXT NOT NULL DEFAULT 'living';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS unlocked_rooms JSONB NOT NULL DEFAULT '["living","bedroom"]'::jsonb;
