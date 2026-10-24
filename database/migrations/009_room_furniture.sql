-- Batch 10: independent furniture layouts per room.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS room_layouts JSONB NOT NULL DEFAULT '{}'::jsonb;
