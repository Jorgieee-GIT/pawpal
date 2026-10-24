CREATE TABLE IF NOT EXISTS pets (
 id UUID PRIMARY KEY,
 name VARCHAR(32) NOT NULL,
 species VARCHAR(8) NOT NULL CHECK(species IN ('cat','dog')),
 hunger INTEGER NOT NULL DEFAULT 80 CHECK(hunger BETWEEN 0 AND 100),
 happiness INTEGER NOT NULL DEFAULT 80 CHECK(happiness BETWEEN 0 AND 100),
 energy INTEGER NOT NULL DEFAULT 80 CHECK(energy BETWEEN 0 AND 100),
 cleanliness INTEGER NOT NULL DEFAULT 80 CHECK(cleanliness BETWEEN 0 AND 100),
 coins INTEGER NOT NULL DEFAULT 100 CHECK(coins >= 0),
 xp INTEGER NOT NULL DEFAULT 0 CHECK(xp >= 0),
 level INTEGER NOT NULL DEFAULT 1 CHECK(level >= 1),
 food INTEGER NOT NULL DEFAULT 3 CHECK(food >= 0),
 toys INTEGER NOT NULL DEFAULT 1 CHECK(toys >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owned_cosmetics JSONB NOT NULL DEFAULT '["none"]'::jsonb;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS equipped_cosmetic TEXT NOT NULL DEFAULT 'none';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_daily DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_game_at TIMESTAMPTZ;
-- Additive migration: existing pets are retained and linked to accounts when claimed.
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_species_check;
ALTER TABLE pets ADD CONSTRAINT pets_species_check CHECK (species IN ('cat','dog','bunny','fox','hamster','panda','penguin','axolotl'));
CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY,username VARCHAR(24) NOT NULL UNIQUE,email TEXT UNIQUE,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
CREATE UNIQUE INDEX IF NOT EXISTS one_pet_per_owner ON pets(owner_id) WHERE owner_id IS NOT NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owned_colors JSONB NOT NULL DEFAULT '["classic"]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owned_breeds JSONB NOT NULL DEFAULT '["classic"]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS affection INTEGER NOT NULL DEFAULT 70;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS room_theme TEXT NOT NULL DEFAULT 'blush';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owned_items JSONB NOT NULL DEFAULT '["basic_sofa"]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS placed_items JSONB NOT NULL DEFAULT '["basic_sofa"]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS garden JSONB NOT NULL DEFAULT '{"seeds":2,"flowers":0,"planted_at":null}';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_mission DATE;
CREATE TABLE IF NOT EXISTS friendships (requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL CHECK(status IN ('pending','accepted')),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(requester_id,recipient_id),CHECK(requester_id<>recipient_id));
CREATE TABLE IF NOT EXISTS game_records (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,game TEXT NOT NULL,best INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,game));
CREATE TABLE IF NOT EXISTS achievements (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,code TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now(),PRIMARY KEY(user_id,code));
CREATE TABLE IF NOT EXISTS gifts (id UUID PRIMARY KEY,sender_id UUID NOT NULL REFERENCES users(id),recipient_id UUID NOT NULL REFERENCES users(id),coins INTEGER NOT NULL,created_at TIMESTAMPTZ DEFAULT now());

-- V3: preserves all existing rows. Legacy last_daily values are honored to avoid free reclaims.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS daily_claimed_at TIMESTAMPTZ;
UPDATE pets SET daily_claimed_at = (last_daily::timestamp AT TIME ZONE 'UTC') + INTERVAL '23 hours 59 minutes' WHERE daily_claimed_at IS NULL AND last_daily IS NOT NULL;

-- V8: additive four-slot outfits. Existing cosmetics and progress are untouched.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS equipped_outfit JSONB NOT NULL DEFAULT '{"head":null,"eyes":null,"neck":null,"clothes":null}'::jsonb;
-- Migrate only old single-slot equipped items into an empty outfit. Safe to rerun.
UPDATE pets SET equipped_outfit=jsonb_set(equipped_outfit, ARRAY[CASE
 WHEN equipped_cosmetic IN ('bow','cap','crown','flower','halo','party','star_clip','moon_crown','fish_clip','yarn_hat','carrot_clip','clover_crown','forest_crown','cheek_bow','bamboo_clip','bamboo_hat','sailor_hat','bubble_crown','coral_clip') THEN 'head'
 WHEN equipped_cosmetic IN ('glasses','heart_shades') THEN 'eyes'
 WHEN equipped_cosmetic IN ('scarf','pearl_necklace','rainbow_scarf','bone_tag','puppy_bandana','seed_pouch','ice_scarf') THEN 'neck'
 WHEN equipped_cosmetic IN ('leaf_cape') THEN 'clothes'
 ELSE 'head' END],to_jsonb(equipped_cosmetic),true) WHERE equipped_cosmetic <> 'none' AND equipped_cosmetic IS NOT NULL AND equipped_outfit = '{"head":null,"eyes":null,"neck":null,"clothes":null}'::jsonb;
