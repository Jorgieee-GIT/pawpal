-- PawPal 3.5: Free Classic Clash matches for players below Level 10.
-- Allows wager = 0 without touching existing balances or challenge rows.
-- Run once in Neon before deploying the updated Render backend.

BEGIN;
ALTER TABLE multiplayer_challenges
    DROP CONSTRAINT IF EXISTS multiplayer_challenges_wager_check;
ALTER TABLE multiplayer_challenges
    ADD CONSTRAINT multiplayer_challenges_wager_check
    CHECK (wager >= 0 AND wager <= 1000000);
COMMIT;
