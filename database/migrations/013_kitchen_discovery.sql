-- Kitchen discovery and recipe mastery: safe, additive, rerunnable migration.
-- Existing players retain the original 12 recipes; new players start with six.
ALTER TABLE pet_kitchens ADD COLUMN IF NOT EXISTS discovered_recipes JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE pet_kitchens ADD COLUMN IF NOT EXISTS recipe_records JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE pet_kitchens ADD COLUMN IF NOT EXISTS step_scores JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS pawpal_migration_log (
    migration_id TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Preserve legacy unlocks on the first application only, even if this file is rerun.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pawpal_migration_log WHERE migration_id = '013_kitchen_discovery') THEN
        UPDATE pet_kitchens
        SET discovered_recipes = '["berry_parfait","cloud_pancakes","cozy_soup","moon_cookies","honey_toast","starry_omelet","peach_smoothie","pumpkin_pie","garden_salad","cheesy_pasta","starlight_cake","moonlight_ramen"]'::jsonb
        WHERE discovered_recipes = '[]'::jsonb;
        INSERT INTO pawpal_migration_log (migration_id) VALUES ('013_kitchen_discovery');
    END IF;
END $$;
