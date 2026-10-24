-- Batch 12 Kitchen 2.0: safe, additive migration
CREATE TABLE IF NOT EXISTS pet_kitchens (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 ingredients JSONB NOT NULL DEFAULT '{}'::jsonb,
 meals JSONB NOT NULL DEFAULT '{}'::jsonb,
 active_recipe TEXT,
 recipe_step INTEGER NOT NULL DEFAULT 0,
 cooking_started_at TIMESTAMPTZ
);
