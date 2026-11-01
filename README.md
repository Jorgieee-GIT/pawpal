# PawPal 3.6 — Multiplayer Reliability Hotfix (November 2, 2026)

**This is a PATCH for the exact `Website 5 (Pawpal)(5).zip` project you uploaded.**
Only the files listed below are shipped. Existing audio, images, `.env`, database contents,
Git repository and unrelated assets are NOT included or replaced.

## Confirmed bugs found in the uploaded version

1. **Duo wagered room creation and joining:** `server/src/duoClash.ts` used `input.data.wager`,
   `input.data.code`, and `input.data.team` after `zod.parse()` (which returns the object directly).
   That caused `Cannot read properties of undefined (reading 'wager')` and related errors.
2. **Failed backend/frontend TypeScript builds:** The uploaded backend had **8 TypeScript errors**,
   frontend **3 TypeScript errors**. These could prevent a successful Render/Vercel redeploy.
3. **Forfeit failures and confusion:** Both routes now accept a safe retry after a finished match
   without paying any coins twice, and show specific migration/deployment errors when payout
   cannot commit. The confirmation modal stays open with the error so players can retry.
4. **Unresponsive attack controls:** Classic used to disable *all* attacks during post-round
   animations; those animations have been shortened and no longer lock input for the next turn.
   Both clients now prevent duplicate clicks while the server acknowledges a submitted move.
   Server/client clock offsets, stale polling, and expired rounds are addressed, with a
   visible Refresh battle round option if needed.
5. **Duo action stuck:** A new round starts with a basic Paw Strike selection rather than
   retaining an unaffordable skill or a Cover cooldown. The UI tells you why Lock In is
   disabled (stun, Focus, cooldown, missing target, reconnect pause, deadline).
6. **Render cold start / timer stalls:** Both backends can catch up a missed round on the
   next authenticated read, not only their repeating timer. Server checks remain authoritative.

## Files changed (exact paths; relative to your project folder)

- `client/src/Multiplayer.tsx` — action state, timer sync, stale reloads, faster animations,
  forfeit error, recovery controls, and TypeScript fix.
- `client/src/DuoClash.tsx` — action readiness, timer sync, polling protection, per-round
  reset, wager/forfeit messaging, and TypeScript fix.
- `client/src/MatchExitConfirmation.tsx` — inline forfeit failure message.
- `client/src/Multiplayer.css` — clear error and round-sync controls.
- `client/src/DuoClash.css` — action-disabled explanation and refresh control.
- `server/src/multiplayer.ts` — safe forfeit retries, readable missing-migration errors,
  server time and recovery of expired Classic rounds.
- `server/src/duoClash.ts` — corrected parsed wager/code/team access, safe forfeit retries,
  server time and Duo timeout recovery.
- `server/tests/multiplayerRoutesSmoke.test.ts` — actual mocked HTTP routes for paid Duo
  creation/joining, moves, and idempotent forfeits.
- `README.md` — this changelog (existing README content preserved below).

## Installation

1. **Back up your current project.** This patch is based specifically on the uploaded
   `Website 5 (Pawpal)(5).zip`, not an earlier patch or some other local version.
2. Extract the ZIP **into the directory containing your `Website 5 (Pawpal)` project folder**.
   The paths inside this ZIP start with `Website 5 (Pawpal)/`; allow overwrite of matching files.
3. Run a clean install and build, *not* with node_modules copied from another operating system:

   ```bash
   cd server
   npm ci
   npm run build
   cd ../client
   npm ci
   npm run build
   ```

4. Redeploy **Render first**, then **Vercel**. The endpoints in this patch must be running
   on Render or the old forfeit/room bug will persist even with the new frontend.
5. **No new database migration** is required by this patch. Your previous migrations must
   already be applied. In Neon, check `SELECT to_regclass('public.arena_fee_ledger');`.
   If null, run the existing `database/migrations/014_paw_brawl_arena_fee.sql` *once*,
   before testing wagered matches. Duo also depends on migration 013; free Classic on 015.
6. Start with a **0-coin Classic match** using two real accounts; submit attacks/Guard,
   try the forfeit confirmation, and confirm both accounts see the result. Then test a
   free Duo match with four real accounts; finally test small paid wagers.
7. If a forfeit still fails, read the **inline red error text** in the confirmation and
   inspect your Render logs. Do not retry random wagers without checking match history.

## Verification

- Server `npm run build` / TypeScript: PASS.
- Client TypeScript (`tsc -b`): PASS.
- CSS parsing: PASS.
- HTTP route regression (mocked DB): PASS for Duo create/join/moves and both forfeits,
  including double-submission protection.
- 88-breed combat, conditional skill, status visual, progression and Arena Fee tests: PASS.
- Vite's *full bundle* on this Linux runner: NOT COMPLETED because the upload's
  installed `node_modules` contains Windows-native Rollup/esbuild binaries. Use `npm ci`
  on your build environment to install the correct platform binaries.
- Four-account live Neon/Render multiplayer: NOT TESTED here. Please test before using
  large wagers. Tests here use simulated database responses rather than your live DB.

**Existing behavior preserved:** one Paw Brawl card with Classic 1v1 and Duo 2v2;
fixed-height battle modals and uniform headers; 5% Arena Fee; Level 10+ for paid matches;
free matches for all levels; team names, species skills, Shield rules, and no combat replay.
No audio asset or emoji was added.

**Cleanup reminder:** Your uploaded folder still contains
`database/PAWMAIL_BATCH57_MIGRATION.sql`, which you previously requested to delete.
Patch-only ZIPs cannot delete existing local files by overwriting; remove it manually if
no longer needed. Keep old migration 013/014/015 files for schema setup/recovery.

---

# PawPal 3.5 — Level 10 Wager Eligibility (patch only, November 2, 2026)

This ZIP includes **only eight edited/new files**, with the same folder structure as your PawPal project. It contains **no audio, images, or extra Markdown files**.

## What's changed

- **Classic Clash 1v1:** Removed the 12-per-day rematch restriction. Added a **Free (0 Paw Coins)** match option for all levels. Positive wagers require **both players at Level 10 or above** when a challenge is created and when it is accepted.
- **Duo Clash 2v2:** Removed the 12-per-day same-group wager limit. Positive wagers require **every one of the four players at Level 10 or above**, checked when creating/joining the paid room and again before all stakes are deducted when the game begins.
- **UI:** The current pet level is passed to both modes. Players below Level 10 see a clear locked-wager message and can create free challenges/rooms; server validation is authoritative (including the other players' levels).
- **Unchanged:** 5% Arena Fee for positive wagers, existing payout/refund/transaction protections, combat rules, team names, lobby modal styling, and all audio assets.

## Files edited in this ZIP

- `client/src/App.tsx`
- `client/src/Multiplayer.tsx`
- `client/src/DuoClash.tsx`
- `server/src/multiplayer.ts`
- `server/src/duoClash.ts`
- `database/schema.sql` (updated for new installations)
- `database/migrations/015_free_classic_brawl.sql` (new additive migration)
- `README.md` (this file)

## Install / deployment

1. **Apply PawPal 3.4 first.** Extract this ZIP *one folder above* the existing `PawPal` directory, then overwrite matching files.
2. Run **`database/migrations/015_free_classic_brawl.sql` in Neon first**, to permit zero-coin Classic wagers. Then redeploy **Render (server)** and **Vercel (client)**. Do not rerun the old migrations.
3. Verify Level 9 players can play Free in both modes, but cannot wager; verify Level 10 players can wager against other Level 10+ players; verify a Level 9 opponent is rejected server-side. Test paid matches and full-refund paths with small stakes.
4. Existing security checks for double settlement and insufficient funds remain in place. Only the **repeat-match frequency restriction** has been removed.

---

# PawPal 3.4 — Paw Brawl Polish & Forfeit Fix (patch-only, November 2, 2026)

**This ZIP contains only changed/new files, not a complete replacement project.**
Extract it **one level above your existing `PawPal` folder**, allowing matching files to be overwritten, or copy the contents of its `PawPal` directory into your existing project. Keep all unmodified files and audio where they are.

## Exactly which files were edited

| File | Changes |
|---|---|
| `client/src/MatchExitConfirmation.tsx` | Portaled confirmation dialog above both games, focus management, consistent header. |
| `client/src/Multiplayer.tsx` | Classic forfeit reliability, action-order highlighting, results summary, polling reliability. |
| `client/src/Multiplayer.css` | Forfeit layering, active turn portrait, compact 1v1 results. |
| `client/src/DuoClash.tsx` | Arena pet targeting, private team suggestion, ready indicators, timed effects, detailed results, explicit forfeit route and polling. |
| `client/src/DuoClash.css` | Responsive targeting highlights, pet animations, result tables, team-signal styling and dark mode. |
| `client/src/BrawlStatusBadges.tsx` | Corrected Shield rounds remaining and Cover cooldown icon. |
| `server/src/duoClash.ts` | Transactional explicit forfeit endpoint, private target suggestions, battle statistics, no auto-retarget, wager anti-abuse limit. |
| `server/src/brawlAbilities.ts` | Modest species-stat retuning, preserving distinct pet roles. |
| `server/tests/brawlBalance.simulation.ts` | Tighter seeded balance smoke-test range. |
| `server/src/multiplayer.ts` | Classic match totals and paid rematch limit. |
| `server/tests/duoClash.test.ts` | Regression tests for simultaneous knockouts and no retargeting, plus existing 88-breed tests. |
| `README.md` | This change summary and installation instructions. |
| `CLEANUP_LEGACY_FILES.ps1` | Optional one-time removal of obsolete Markdown docs and Batch 57 manual setup file. |

**Not included:** audio, images, MP3s, other Markdown documents, `node_modules`, existing database migrations, unrelated screens. **No combat replay added. No new database migration.**

## Gameplay improvements

- **Forfeit:** X and Forfeit open the same fixed-header confirmation dialog. The dialog stays open until the server confirms success; errors do not silently dismiss it. Duo has a dedicated `POST /api/multiplayer/duo/:id/forfeit` endpoint; both modes settle coins inside row-locked transactions.
- **Battlefield:** existing Classic attack animations are retained; Duo now gives SVG-only active-pet lunge, hit feedback, selectable pet outlines, and visible target/focus. Both show the active pet in the compact Speed-order portraits.
- **Team play:** clicking a living pet selects a valid attack/support target (also keyboard accessible). Duo teammates may send one private enemy-target suggestion per round; enemies never receive the signal or hidden moves. Teammate actions can show **Locked** without exposing what move was chosen.
- **Match results:** Classic retains totals for damage/heals/specials; Duo includes all four players' damage/healing/Cover totals and cosmetic *Heavy Hitter*, *Top Protector*, *Helping Paw*, and *Clutch Rescue* labels. Existing 2v2 lifetime statistics remain.
- **Clarity & networking:** corrected three-round Shield display, Cover cooldown badge, reduced overlapping Duo polls, server-side daily cap of 12 paid rematches per same duo quartet and 12 Classic matches per same pair. Duo free matches are unrestricted. Existing 5% Arena Fee unchanged.
- **Fair targeting:** an action whose target was knocked out earlier in a round never silently hits a different pet.
- **Breed balance:** kept the 88 kits and breed abilities, but reduced Panda/Penguin base durability and modestly improved starter Bunny, Dog, Hamster, Fox and Axolotl base stats. The deterministic 1,920-match 1v1 strategy simulation improved from a 35%–65% species-win spread to approximately 41%–53%. This measures one scripted strategy, **not** live player skill or Duo pair win rates.

## Deploy and verify

1. Preserve your existing project folder, `.env` files, all sounds and assets.
2. Copy only the changed files from this patch to the matching paths in your project.
3. For already-deployed PawPal 3.3, redeploy **Render and Vercel**; **no new Neon SQL**. Do not rerun migrations for this patch.
4. Test **Classic forfeit**, **Duo forfeit with four real accounts**, free/paid payouts, team signals, reconnect, and mobile layout after deployment.
5. Optional cleanup on Windows PowerShell from the project root: `powershell -ExecutionPolicy Bypass -File .\CLEANUP_LEGACY_FILES.ps1`. This removes local Markdown files other than README.md and the obsolete `database/PAWMAIL_BATCH57_MIGRATION.sql` manual setup file; it does **not** drop database tables. The archive did **not** contain a separate `AdminSetup` file, so the working `Admin.tsx` admin screen is preserved.

**Test status:** 88-breed Duo, Arena Fee, and seeded 1,920-match Classic balance scripts passed using a TypeScript-transpiled test harness; syntax parsing for modified TS/TSX and PostCSS validation passed. Full npm production builds and real authenticated four-account flows are **not yet verified** here due to unavailable npm dependencies. Deploy free matches for initial live verification before wagering.

---

> **PawPal 3.3:** Both Classic and Duo charge up to 5% Arena Fee only on winning wagered matches. Existing installations must have already applied `database/migrations/014_paw_brawl_arena_fee.sql`; this 3.4 patch adds no database migrations.

> **PawPal 3.1 UI:** Both Paw Brawl modes launch in uniform modals, not expanded sections. This behavior is preserved by the 3.4 patch.

# PawPal 2.6 — Compact Paw Brawl Match Cockpit

## Paw Brawl 2.8 — Three-round Shield (Gameplay Update)

- Shield lasts for the creation round plus two subsequent rounds (3 total) before expiring at round-end. Breaking Shield early still removes it immediately; expiration never awards the Shield-break Focus refund.
- The server, game HUD, in-game instructions, and Develop guide use the same authoritative duration. The Shield badge shows how many **future** rounds remain after the last resolved round.
- Existing anti-stall protections remain: maximum 34 Shield, Guard +16 then +8 then +0 on consecutive uses, Guard Focus only on its first consecutive use, direct attacks penetrate at least 40% Shield, and overtime/round caps still apply.
- After increasing ordinary attack Shield penetration to 40%, the scripted 1v1 sample showed Panda around 65% wins (versus 60% under previous 2-round rules) and Axolotl around 42% (versus 43%). This is only one automated strategy and not proof of live balance. Further PvP tuning may be needed if defensive strategies become dominant.
- Includes targeted expiry, broken-Shield refund, floating Shield-expiration indicator, 88-breed combat, and scripted 1v1 tests. Redeploy **both Render and Vercel**. No database migration; finish active battles before updating.

## Paw Brawl 2.7 — Pet and Platform Alignment (UI Fix)

- The player and enemy platforms always render behind their pet SVGs, including during idle, hit, and attack animations.
- Enemy pet and its oval use a shared 48% battlefield ground line, raised together instead of moving the oval alone.
- Pet animation scaling uses the bottom/feet as its transform origin; per-device foot offsets keep both pets grounded on desktop, tablet, and mobile.
- Combat stats, skills, Focus costs, server logic, and the arena art remain unchanged. Only `client/src/Multiplayer.css` is modified.


**Latest UI update · November 1, 2026**

Paw Brawl 2.6 fixes the opponent sprite/platform alignment, makes floating hit numbers clearer, keeps active-effect icons on a fixed single row, makes each special `?` explain only the selected skill, adds an if-hit HP estimate to Paw Strike, and keeps the entire match within a non-scrolling viewport-fitting modal. **Battle rules and stats remain unchanged from 2.5.**

## Previous 2.5 combat update (unchanged mechanics)

This complete project builds on PawPal 2.4 and retains all existing Garden, Kitchen, Missions, Friends, PawMail and multiplayer features.

## What's new

- **Short special labels:** The battle buttons, in-match skill help, Paw Brawl Guide and Develop gallery display compact ability metadata such as **`4 Focus, 2 rounds`**. The actual ability description explains the normal action and conditional bonus without repeating the cost/cooldown sentence. Passive descriptions no longer start with “Always-on ability”.
- **Floating numbers for both players:** The server records before/after changes for each locked-in action. At the hit's animation impact, the pet displays **red HP damage**, **violet poison damage**, **green healing**, **blue Shield gained/lost**, **gold Focus changes**, **red counter/recoil damage**, and **red overtime damage**. Dodge, critical hits, poison application and stuns have descriptive labels. End-of-round poison, Shield expiry and pressure appear as separate events, not as invented attack damage. Both the HUD and battlefield show the same server-owned values. Old saved rounds without numeric event data still animate normally.
- **Distinct species archetypes:** Species HP now differs substantially between fast attackers and heavy tanks. ATK and DEF were also adjusted so damage stays meaningful with larger HP. SPD differences remain meaningful for turn order, dodging and breed speed triggers. Both players can see their own and the opponent's ATK / DEF / SPD directly in the compact stat bars. Unlock-grade bonuses and all 88 kits remain.
- **Shield retuning:** 34 Shield cap, first Guard **16 Shield +1 Focus**, second consecutive Guard **8 Shield +0 Focus**, subsequent Guards **0/+0**. Guardboost passives may add Shield up to the cap. Shield expires after three rounds (including its creation round). Special-generated barriers and poison/healing were scaled moderately, while basic attack damage was raised to reflect new HP totals. Direct attacks now bypass at least 40% of Shield to offset the longer duration.
- **Arena revamp:** The former green landscape is now a pastel-purple **Moonstone Coliseum** with an arch, twin pillars, illuminated arena markings and subtle sparkles. Both existing oval pet platforms, enemy height, sprite anchors, and attack movement are preserved. CSS-only scenery supports mobile, tablet, desktop, dark UI and reduced motion.

## Starter species stats (before breed profile and unlock bonuses)

| Pet | HP | Attack | Defense | Speed |
|---|---:|---:|---:|---:|
| Cat | 153 | 32 | 12 | 15 |
| Dog | 178 | 30 | 17 | 10 |
| Bunny | 140 | 30 | 10 | 18 |
| Fox | 150 | 33 | 11 | 15 |
| Hamster | 162 | 28 | 15 | 13 |
| Panda | 210 | 27 | 21 | 9 |
| Penguin | 195 | 28 | 20 | 11 |
| Axolotl | 168 | 28 | 14 | 12 |

Each breed's precise live numbers (including the style/profile and rank bonuses) are shown in `PAWBRAWL_FULL_ROSTER.md` and through the Paw Brawl Guide.

## Testing and deployment

Run `npm ci && npm run build` inside **both** `server` and `client`, then run:

- `npm run test:brawl`
- `npm run test:brawl:conditional`
- `npm run test:brawl:progression`
- `npm run test:brawl:visual`
- `npm run test:brawl:balance`

**Local verification:** The full combat, conditional, progression, floating-event regression tests and 1,920 scripted strategy matchups passed using a TypeScript-transpiled test harness with mocked external dependencies. Modified TS/TSX files passed syntax parsing; frontend CSS was separately inspected. The full dependency-based build, live authenticated two-account flow and actual-device rendering remain unverified because npm installation did not complete here.

**Deploy:** Update **Render (server)** and **Vercel (client)** together. No new DB migration is required. Finish or forfeit matches already in progress before updating, because active match JSON stores old HP and ability snapshots.

---

# PawPal 2.3 — Previous Conditional Special Skills (historical; superseded by 2.5)

**Historical section:** Paw Brawl 2.3 rules have been superseded by the PawPal 2.5 section above. Keep this as background only.

All **88 breeds have 2 Focus-costing active specials** plus their own passive. They are **not first-move/last-move skills**; each has an ability-specific trigger and always retains its basic effect. For example, bunny Speed can improve damage or prepare a dodge converting to Shield against a non-attacking move; heavy pandas make time-limited Shield, earn Focus if that special barrier is broken, and can spend Shield for extra attack damage. Other breeds use HP, Focus, enemy Shield, critical hits, healing, counters, and disruption. There are 176 individually named active skills and 26 underlying skill-effect families.

In the original 2.3 release, Shield lasted two rounds and Guard gave 12/+1 Focus, then 6/+0, then 0/+0 on repeated uses. The live 2.8 rules are 3-round Shield and 16/+1, 8/+0, then 0/+0. Attacks now penetrate at least 40% Shield. **Different specials can be used in consecutive rounds** when the player can afford both and their separate cooldowns permit; this allows a four-plus-four Focus panda Shield → Shield Slam combo within the limited Shield window. Focus cap 8; current Shield cap 34. The other anti-stall mechanics, stun protection and round limit remain.

The live server-defined catalog powers the battle UI, in-game guide, and Develop gallery. The generated `PAWBRAWL_FULL_ROSTER.md` contains all 88 detailed kits. Run `npm run test:brawl:conditional`, `npm run test:brawl`, `npm run test:brawl:progression`, `npm run test:brawl:balance`, then build frontend/backend with `npm ci && npm run build`. Redeploy both Render and Vercel. No database migration. Complete active matches before updating.

**Verification in this environment:** Server combat tests and seeded balance simulation passed using a transpiled mock-loader. All modified TS/TSX files were syntactically parsed. Full dependency-based production builds and live authenticated two-account matches have not been verified because dependencies are not installed in this environment.

---

# PawPal — Five area soundtracks integrated and loudness-matched (November 1, 2026)

The five user-provided MP3s are included under `client/public/audio/` and routed through the Settings audio manager: `bgm_main.mp3` for general/social tabs, `bgm_garden.mp3` for Lucky Garden, `bgm_kitchen.mp3` for Kitchen, `bgm_arcade.mp3` for Mini-games, and `bgm_multiplayer.mp3` for Multiplayer. Files were normalized using FFmpeg two-pass EBU R128 loudness normalization toward **-18 LUFS**, with a **-2 dBTP** ceiling. Post-encoding measurements are approximately -18.4 to -18.8 LUFS. The five tracks share one Settings volume control; source recordings retain their individual dynamics and music style, so instantaneous perceived loudness may still vary with the musical passage.

Music is **off by default** to avoid unwanted audio and browser autoplay restrictions. Players can enable it through the header **Settings** button, select a volume, and optionally pause on a hidden browser tab. Preferences persist in localStorage. Track transitions crossfade over 800 ms, loops are enabled, and the music manager retries playback after a user gesture if browser autoplay rules initially block it. When moving between tabs that use the same main track, playback continues without restarting. No sound effects have been added yet.

**Deploy:** Frontend (Vercel) only. No backend change or database migration. Verify that Vercel serves `/audio/bgm_main.mp3` and the other four static MP3s, and test the volume/music toggle, changing tabs, looping, and screen locking on real devices. The source archive does not contain node_modules; run `npm ci && npm run build` in the client directory as usual. The full Vite production build and end-to-end authenticated browser playback could not be verified in this runtime; TypeScript checks, FFmpeg audio decode/analysis, and archive checks were performed.

---

# PawPal Kitchen — Four more cooking games, game guide & balanced meals (November 1, 2026)

This update builds on the previous 21-recipe Kitchen with **four additional randomized cooking games** for a total of **13**:

- **Dough Rolling (`roll`)** — drag a rolling pin across four uneven dough strips (or use accessible Roll buttons) until smooth. Four different thickness values are generated every attempt. The dough geometry updates during the interaction, with subtle transform-based flour animations.
- **Ingredient Catch (`catch`)** — guide a basket under falling fresh ingredients while avoiding spoiled ones. Seven randomized drops (four fresh, three spoiled) have shuffled order, varying positions, and individual falling durations; falling uses `requestAnimationFrame`, not a fixed-rate UI timer. Pointer, touch, desktop arrows, and onscreen move buttons work.
- **Stove Rush (`stove`)** — monitor three illustrated pans at once and tap each one when its timer enters the green zone. Pan durations and start offsets vary; all bars update using `requestAnimationFrame` and GPU-friendly transforms, with continuously animated steam/flames. Unattended pans eventually overcook instead of blocking progress forever.
- **Seasoning Challenge (`season`)** — adjust Sweet, Salty and Zesty flavor amounts using a different three-part set of clues each round. A gently animated bowl and custom shaker illustrations show the ingredients. Keyboard/tab and touch buttons work.

New game steps are assigned to **13 existing recipes** by type; recipe names, ingredient requirements, known recipes, meal inventory IDs and permanent discoveries are unchanged. All 21 meals now provide approximately **45–55% of their previous pet care stat and serving-XP benefits**. Cooking quality still does not affect coin rewards or pet stats. No new database tables or columns are required. **Existing ready-made meals use the updated benefits when served.** If possible, finish an in-progress recipe before deploying because preparation-step sequences have been revised.

**Kitchen `? Info`** next to the heading opens a scrollable guide for **all 13 games**. It uses the same artwork components as the cooking interactions. **Develop → Kitchen studio** also lists **every one of the 16 brand-new original SVG artworks**, covering rolling, fresh/spoiled ingredient catching, pans/flames, seasoning bowls/shakers, and effects, alongside the original 66 previews and the four directional SVG previews. No replacement placeholder images are used. The new TypeScript, TSX, artwork and gameplay code follows **four-space indentation** with multiline blocks and braces, and `server/src/kitchenCatalog.ts` has been reformatted into readable multiline recipe entries.

**Lucky Garden** now has one **Flower Book · Info** action in the heading instead of two buttons for the same dialog. The existing collection and odds tabs remain available inside the dialog.

**Deploy:** update **Render and Vercel** together. No new Neon migration is needed if the previous Kitchen discovery migration `database/migrations/013_kitchen_discovery.sql` was already applied. If you have not run that migration yet, apply it **before** deploying this Kitchen backend. Do not initialize or replace a live database.

**Verification:** frontend and backend TypeScript checks passed, 11 server catalog/gameplay checks passed, 5,000 simulated random rounds passed for the four new games, and all 16 new SVG components rendered in a static browser fixture. Responsive artwork and game-panel layout checks passed at 320, 360, 390, 430, 768, 1024 and 1440px without horizontal overflow. Full authenticated two-account cooking flows and real mobile touch responsiveness were **not** tested; the complete Vite production bundle could not run using the Windows-specific archived dependencies because the Linux Rollup optional binary is missing. A clean `npm ci && npm run build` is required during deployment.

---

## Kitchen: randomized challenges and consistent arrow controls (November 1, 2026)

- **Every one of the nine cooking games changes its challenge on each start, replay, or preparation step.** Precision Chopping randomly chooses a new target for each of its three cuts, while Chopping, Pancake Flip and Boiling Point use a randomly selected marker speed and target position. The target band is visible while playing; the score uses the same live marker position as its animation.
- **Perfect Baking:** a new target between 155°C and 205°C (5-degree increments) is selected each round. The ideal band is **target ±10°C**, narrower than the previous 165–195°C range. The starting oven setting is deliberately offset, and the Cooler/Hotter buttons change it by 5°C. The target band is also marked on the temperature meter.
- **Perfect Pour:** the target changes among 55%, 60%, 65%, 70%, 75%, 80%, and 85%, with a visible target line and label. Releasing the pour scores distance from the round's target, not a hard-coded 75%.
- **Cake Decorating and Plate Puzzle:** all six permutations can occur, without immediately repeating the prior permutation. **Rhythm Mixing:** the full-screen arrow-key/swipe sequence varies between 5 and 7 prompts, with changing directions and no identical adjacent instructions. **Ingredient Washing:** now uses a 4–6 step randomized directional rinse pattern rather than five identical taps; supports on-screen direction buttons, desktop arrow keys, and touchscreen swipes anywhere on screen, **including outside the modal**. Only active Rhythm/Washing gameplay captures keyboard and touch swipes; the backdrop doesn't close those steps accidentally.
- **Arrow artwork:** all directional prompts and buttons use one shared Lucide ArrowRight SVG rotated to left/up/right/down, with the same stroke width. Four direction previews are available under **Develop → Kitchen studio**, in addition to the existing 66 original Kitchen artwork previews.
- Challenges and scores remain **frontend-only and cosmetic**; recipe and ingredient persistence, pet needs, actual coin/XP rewards and backend contracts do not change. **Redeploy Vercel only**; Render and Neon do not need updating for this patch. No migration is needed. Existing recipes and progress remain compatible.
- Validation: client and server TypeScript checks pass; 5,000 simulated random rounds pass challenge invariants and cover all nine minigames; original Kitchen/Garden/PawMail/Brawl server tests pass; responsive markup checks pass at 320–1440px. Full Vite production bundling remains unverified locally due to a missing Linux Rollup package in the archived dependencies; run `npm ci && npm run build` in a clean deployment environment. Real touch-device gameplay and authenticated end-to-end flows should still be checked.

## Kitchen Rhythm Mixing — keyboard and full-screen swipe controls

- On desktop, follow the randomized arrow sequence using **Left / Up / Right / Down** on the keyboard. The game listens at the window level and prevents the arrow keys from scrolling the page while the mixing step is active.
- On touchscreens, swipe in the requested direction **anywhere on screen, including outside the cooking modal**. Swipes shorter than 42px or ambiguous diagonal gestures are ignored; scrolling is suppressed only for active swipe movements. The overlay remains open on backdrop touches during Rhythm Mixing (and Washing); use the close (X) control to leave.
- No on-screen arrow-tap buttons for Rhythm Mixing. Progress and correct steps are shown in the arrow sequence. Washing additionally accepts on-screen directional buttons; other minigames retain their normal interaction types, with randomized goals.
- Frontend-only change; no Render deployment or database migration is needed. Redeploy Vercel.

# Kitchen randomized tap sequences (October 30, 2026)

The Kitchen minigames **Cake Decorating**, **Plate Puzzle**, and **Rhythm Mixing** now generate a fresh shuffled tapping sequence for each new cooking step/attempt. The order appears on screen and the buttons are checked against that same order. A new attempt does not repeat the immediately previous pattern. Rhythm Mixing now uses whole-screen swipes or keyboard arrows with a longer randomized sequence; this older note describes a previous implementation.

These are frontend-only changes. No new SVG assets, Render deployment, or Neon migration are necessary. The original **66 Kitchen SVGs** and their Develop > Kitchen studio gallery remain intact. Redeploy Vercel only. All other gameplay and existing inventories are preserved.

---

# Kitchen animation, artwork and responsive UI polish (October 30, 2026)

This frontend-only follow-up to the 21-recipe Kitchen revamp preserves recipes, cooking progress, backend rewards, database migrations and the existing Develop > Kitchen studio SVG catalog.

- The sliding timing indicators in Precision Chopping, Pancake Flip, and Boiling Point use `requestAnimationFrame` and composited transforms instead of reacting to a 100 ms UI timer. Click scoring samples the same continuous animation clock so the displayed center position and earned score agree more closely.
- Larger food SVG artwork now fills the complete left section of recipe cards on tablet/desktop; on phones, the food illustration uses a full-width area above the recipe details and actions.
- The four Kitchen section buttons align their SVGs and labels on mobile, with a separate overlaid Pantry count badge.
- Removed the `k3-hero` block and the four redundant section description paragraphs. Original SVG artwork and the Develop gallery remain unchanged.

Verification: client and server TypeScript checks pass; existing Garden, Kitchen, PawMail and Paw Brawl catalog tests pass. Static page-layout checks passed at widths 320, 360, 390, 430, 600, 768, 900, 1024, 1280 and 1440 px. Browser timing test measured 32 unique frame positions and a near-center click scored 99/100. These are layout/integration fixtures, not live account testing. Local Vite production bundling is still unavailable from the archived Windows dependencies; use clean `npm ci` on Vercel.

**Deployment:** Redeploy Vercel only. No Render update or Neon migration is needed for these frontend-only changes.

---

## Kitchen 3: recipe discovery, cooking games and the Develop gallery

This release includes the original 12 recipes plus 9 new dishes (21 total), 18 shop ingredients, 6 starter recipes and 15 discoverable recipes for **new** players, deterministic recipe discovery, recipe clues, an experiment station, a pantry, recipe records, and nine distinct cooking interactions (rinse, precision chop, flip, bake, simmer/boil, pour, frost, plate, rhythm mix). Recipes use the same ingredient item IDs and existing meal storage, so existing stocks and prepared meals are not reset. Finished meals restore the same amount of pet stats regardless of cooking grade; cooking scores are visual/journal-only and award **no additional Paw Coins or XP**.

### Required Neon migration (one time, before deploying the new Render backend)

Apply `database/migrations/013_kitchen_discovery.sql` to your **current** Neon database before deploying the updated server. You can paste it into Neon's SQL Editor or run `psql "$DATABASE_URL" -f database/migrations/013_kitchen_discovery.sql`. This adds three JSONB columns to `pet_kitchens` and an idempotent migration marker. It preserves all 12 original recipes as known for existing Kitchen users; new users begin with the six starter recipes. Rerunning the migration will not unlock legacy recipes for newly created accounts. Do not run old schema initialization scripts against an already-live database.

Then redeploy **Render and Vercel**. Both must use this updated API/UI contract. Do not deploy only the new frontend against the old Kitchen API.

`/develop` → **Kitchen studio** includes every Kitchen SVG from the actual player art components: **39 ingredient/dish illustrations, 10 cooking tools, 12 preparation-stage variants, and 5 visual effects = 66 previews**. All new artwork is within `client/src/KitchenArt.tsx`, reused by `Kitchen.tsx` and `Develop.tsx`.

### Server-side protection

Ingredient purchase and experiment consumption, discovery and recipe completion use database transactions and locked pet/Kitchen rows. Recipes are predefined; unsuccessful experiments use one ingredient only. The server hides unknown recipes' ingredient lists and steps. A server time threshold limits instant step completion. The client sends a cooking quality score for a **cosmetic personal record only**, not for coins, XP, pet stat bonuses, or competitive rankings. Completely preventing fabricated journal scores would require authoritative game simulation on the server.

Run `npm run test:kitchen` in `server/` to check recipe uniqueness, exact ingredient matching, hidden recipe metadata, meal prices and rating thresholds.

---

# PawPal — Garden Timer, Tablet Navigation & Unified Headings (October 2026)

- Garden beds now show a stable, single-line countdown (`MM:SS`) with tabular numerals. Growth-stage details remain available as accessible labels and hover titles. Ready plots display a short **Ready!** badge instead of a multiline message.
- Navigation collapses behind the existing hamburger toggle at phone and tablet widths up to **1100px**; wider desktops retain the persistent sidebar. Opening and closing the menu preserves the existing navigation functionality.
- The four Lucky Garden inventory counters (Seeds, Watering cans, Harvested, Discovered) remain in **one row** at widths up to **700px**.
- Main page headings for Friends, Market, Wardrobe, Mini-games, Multiplayer, Kitchen, Missions and Lucky Garden now use one shared SVG/icon component and consistent alignment.
- The navigation label **Missions & stats** is shortened to **Missions**, matching the main page title.
- This is a **frontend-only** update: server logic, Garden odds, Paw Coins, database records and multiplayer rules are unchanged. Redeploy **Vercel only**.

---

# PawPal Lucky Garden — Compact Layout Update (October 2026)

- Garden navigation label now reads **Lucky Garden**. Removed the requested extra descriptive text from the Garden header, under the plots, and inside the Flower Book dialog.
- Flower beds now display **three per row on mobile and tablet**, and **six per row on desktop**. Each raised-bed graphic and its action controls have been resized to suit the denser grid.
- Garden Shed supply cards use stacked, full-width purchase controls on mobile; quantities and Buy buttons remain accessible at narrow widths.
- These are presentation-only changes. The Garden harvest rates, prices, saved plots, backend, and database schema are unchanged. **Redeploy the Vercel frontend only.**

## Previous Garden update


## Garden gameplay

The **Garden** tab has been rebuilt around a mystery-flower harvest loop while preserving the original three starting plots, twelve-plot expansion prices, existing flower inventory, coins, XP, and other PawPal systems.

- **Plant:** a mystery seed costs **40 Paw Coins** and grows over **5 minutes**.
- **Water:** a watering can now costs **10 Paw Coins** and reduces remaining growth by one minute. Watering does **not** improve rarity odds.
- **Harvest:** the server chooses the flower rarity, variant, and coin reward when planted, but does not transmit that unrevealed information in normal pet responses. The actual flower and payout are shown only after a successful server-validated harvest.
- **Flower Book:** five discoverable flower types, with per-rarity discovery counts and best payouts, persist in each pet's existing `garden` JSONB column. Players can view their discoveries and the published odds/reward guide directly from Garden.
- **Visuals:** the six new illustrated raised-bed states (empty, seed, sprout, bud, ready and locked) are shared with **Develop → Garden**. Garden has a grassy outdoor background, fence, flower-bed signs, growing animations, and a compact 3-column mobile/tablet and 6-column desktop layout.

| Rarity | Probability | Paw Coins per harvest |
|---|---:|---:|
| Wilted | 10% | 20–30 |
| Common | 55% | 37–50 |
| Uncommon | 25% | 55–80 |
| Rare | 9% | 100–150 |
| Legendary | 1% | 400–600 |

Expected coin payout is **59.55 coins per 40-coin seed**, before watering costs. Existing growing plots retain their previously assigned rewards so players do not lose progress. Discovery tracking starts with the first harvest after this update; historical flower rarities cannot be reconstructed from a total-harvest count alone.

### Technical notes

- New files: `server/src/gardenRules.ts`, `server/tests/gardenRules.test.ts`, `client/src/GardenBedArt.tsx` and `client/src/GardenPanel.tsx`.
- Updated: `server/src/index.ts`, `client/src/GardenArt.tsx`, `client/src/Develop.tsx`, `client/src/Develop.css`, `client/src/App.tsx` and `client/src/style.css`.
- All normal pet responses redact pre-harvest rarity/reward/variant. Harvest replies include a one-time `gardenReveal` receipt with the actual result. Existing Garden JSONB handles discoveries: **no database migration required**.
- This source archive restores `database/schema.sql` and existing SQL migration files absent from the immediately preceding ZIP; these are not new migrations for Garden.
- Run `npm run test:garden` in `server/` and `npm run build` in both `client/` and `server/` after installing dependencies (`npm ci`). Deploy both **Vercel and Render**.

---

# PawMail Envelope Color and Unlock Progression Update

- The Classic Letter still adopts the chosen envelope color fully.
- Every premium envelope keeps its own themed background and SVG artwork. The color picker now adds a subtle 20% tint, visible in the live preview as well as sent and received letters. Existing designs are unchanged as collectables.
- The ten level-gated envelopes now unlock at pet levels 10, 14, 18, 22, 26, 30, 35, 40, 45 and 50. Their prices rise from 5,000 to 30,000 Paw Coins. The original 10 non-level-gated paid envelopes still cost 2,000 Paw Coins.
- Prices and level requirements are updated in the frontend catalog, Develop PawMail gallery and server-authoritative purchase catalog. Previously purchased envelopes remain owned and usable.
- Redeploy both Vercel and Render. No database migration is required.

---

# PawPal: PawMail Artwork Gallery in Develop

This frontend-only update adds a **PawMail** tab in the administrator's **Develop** page (`/develop`). The gallery shows all 21 existing envelopes with their exact in-game SVG motif, matching themed background, design ID, required pet level and Paw Coin price. It includes search and filters for Level 1 designs and level unlockables. All artwork previews are read-only, with no purchases or player-state changes.

The envelope list and SVG renderer now live together in `client/src/PawMailArt.tsx` and are imported by both the PawMail player screens and the Develop gallery. This prevents the admin previews from drifting away from the actual game art. The gallery also participates in the existing SVG health inspection. On small screens it displays two columns, expanding to three on tablets and four on desktop.

**Deployment:** redeploy **Vercel only**. The server, database, original envelope costs, unlock levels and purchases are unchanged. No migration is required. For testing, open `/develop` using the existing admin account, select **PawMail**, and inspect all 21 designs on desktop and mobile. TypeScript checks verify compilation; review the gallery visually in a deployed browser as well.

---

# PawPal

## PawMail refresh (Friends tab)

PawMail stays inside Friends. The Friends heading has Inbox and Write Letter shortcuts, and each accepted friend has a direct Write PawMail icon. The permanent composer section has been removed. Inbox, Sent, full postcard view, Reply, Write Letter, and Envelope Collection now open as responsive modals. Existing notifications bring players directly to the Inbox modal. Received and sent letters are still available only until the existing 24-hour expiration.

The Envelope Collection contains the original 11 designs (including the free Classic Letter) plus 10 illustrated, level-locked designs. The new designs unlock at pet levels 10, 14, 18, 22, 26, 30, 35, 40, 45, and 50. Their prices rise from 5,000 to 30,000 Paw Coins. Each includes its own SVG illustration and themed backgrounds in the gallery and sent postcards. The original premium designs remain at their previous 2,000-coin prices.

The server is authoritative for unlock levels, designs, ownership, and prices. The `/api/mail/designs` response now includes a `catalog` with `id`, `title`, `price`, and `level` alongside `owned`; `/api/mail/sent` adds the authenticated user's still-active sent letters. Purchasing a locked design is rejected on the backend regardless of the frontend state. There is no new database migration because the existing mail and purchased-envelope tables are reused.

### Deployment and verification

Redeploy **both the frontend (Vercel) and backend (Render)** to apply the new envelope catalog and Sent mailbox. No new database migration is needed. Install fresh platform-compatible dependencies when building (`npm ci` in `client` and `server`), retaining your own secrets and environment settings.

Both TypeScript checks passed. The existing 88-breed battle regressions passed. Mail catalog regressions passed for 21 unique designs, 10 gated progression levels, increasing costs, ownership, and affordability. Representative Inbox, Composer, and Collection modal layout fixtures passed at 320, 360, 390, 430, 768, 1024, and 1440 pixels without horizontal overflow (individual fixtures use the relevant widths). The actual authenticated frontend and live database purchase/sent/receive flows were not tested in this environment.


This frontend-only change retains the latest atmosphere, Kitchen, Missions, Wardrobe, Multiplayer and room fixes.

- Pets with active notes, including friends' pets visiting the Living Room, display a small pink mail-and-heart badge next to their name. Pets without an active note have no badge.
- Tap/click that icon to read the **full 20-character Pet Note** in a compact pastel popover at the top-right of the Living Room. The note no longer occupies extra space above the pet or blocks pet artwork.
- Only one note is open at a time. Tapping the same icon again, tapping elsewhere, pressing Escape, or using the X control closes it. Notes disappear at the existing expiry time, and room refreshes continue to use server-provided notes.
- The Pet Note editing modal retains the input, live preview, 20-character limit, Save and Remove actions. The **Try one** quick note suggestions and their buttons have been removed.
- No changes to note database storage, 24-hour expiration, friendships, or backend routes.

## Verification and deployment

- Frontend and backend TypeScript checks passed. A focused CSS browser fixture was checked at 320, 390, 768, and 1440 pixels with no horizontal overflow and the popover above the pet sprites. This test does not replace a full signed-in multi-account browser test.
- This release requires **Vercel/frontend redeployment only**. No backend redeployment or database migration is needed.
- `README.md` is the only Markdown file in the source ZIP.

---

# Room Atmosphere, Pet Note and Room Background Responsive Update

This complete source builds on the preceding PawPal release and preserves all previous Kitchen, Missions, Wardrobe, Multiplayer, and minigame features.

- The Living Room atmosphere trigger is now a wide rectangular, full-bleed swatch using the active atmosphere colors. It has no inner padding, including on small phones.
- Atmosphere options retain the **Make it yours** eyebrow and **Room atmosphere** title. Their Buy, Apply, Selected, and unlock-level action labels use the same pink, bordered pill/button styling as Market purchase actions. Purchases and level locks remain server-authoritative and unchanged.
- The Pet Note toolbar icon is centered. The editor has a new pastel card, a live note preview beside the pet illustration, character count, and clear Save/Remove controls. The existing 20-character limit, save/remove API routes, and 24-hour expiry remain unchanged. The redundant expiry paragraph was replaced by a short explanation of where friends see the note.
- Room architecture uses aspect-preserving nested SVG viewports for paintings, framed wall art, bedroom windows, and sports room fixtures. The full-bleed background and floor remain responsive, but important shapes no longer squish when the room becomes narrow. This shared component also updates the Develop room previews.

## Checks

- Client and server TypeScript checks passed.
- Representative browser layout tests using the updated stylesheet passed at 320, 360, 390, 430, 768, 1024, and 1440 px widths with no horizontal overflow. This is a layout fixture, not a full signed-in end-to-end play session.
- The source package contains only `README.md` among Markdown files and excludes dependencies, secrets, build outputs, and local testing fixtures.
- **Deploy Vercel (frontend) only.** No backend or database changes are required for this revision.

---

# Kitchen, Missions, Wardrobe and Room Atmosphere Update

This revision builds on the previous complete PawPal source.

- Kitchen: removed the redundant Pantry navigation tab. Cooked and purchased meals remain available from the Living Room's existing meal/pantry controls. Recipe cards now show each ingredient's **owned/required** quantity, with green and pink indicators for available and missing ingredients; Cook remains unavailable when supplies are insufficient. Recipe purchases remain server-priced at twice the ingredient cost.
- Missions: daily selection now displays **5 quests**, weekly **10**, with milestones unchanged. Added gifts, pet notes and daily surprises to the weekly mission rotation on top of the previous expanded mission catalog. Milestone category filters scroll horizontally; removed the large summary cards and ready-to-claim counter, while retaining Claim all.
- Wardrobe: split Owned/Shop mode controls from the Head/Eyes/Neck/Clothes equipment categories, using distinct rows and styles on phones and desktop.
- Sleeping: browsing pages, Wardrobe, shopping, decorating, pet notes and claiming missions no longer wake a sleeping pet. The frontend explicitly wakes a pet when launching a minigame; the backend only wakes on pet-care actions, serving meals, actually playing an arcade game or accepting/taking a Paw Brawl turn. Sleeping no longer automatically ends at full energy; use the Wake button when needed.
- Room: buy and equip atmospheres in the Living Room's Room atmosphere modal instead of the Market. Clearly distinguish selected, owned, purchasable and level-locked themes. The modal retains the requested "Make it yours" eyebrow and "Room atmosphere" title, with the redundant extra heading, description and active-theme badge removed. Atmosphere and Pet Note room buttons remain compact SVG icon-only controls with accessible labels.

## Verification and deployment

Both client and server TypeScript checks pass. Paw Brawl regression checks pass for all 88 breed kits using compiled Node tests. CSS mock layout checks passed at 320, 360, 390, 430, 768, 1024 and 1440 px widths without horizontal overflow. Those are representative layout checks, not a live multi-account or database integration test. Redeploy **frontend (Vercel)** and **backend (Render)**; no new database migration is required if the previous Kitchens and Missions migrations are applied.

---

# PawPal Arcade, Kitchen, Wardrobe, Market, and Missions Refresh (October 29, 2026)

This is the complete source package based on **PawPal_PawClaw_Small_Inside_Machine_Info.zip**. It retains the latest multiplayer, minigames, Paw Claw, and account-dashboard updates.

## What changed

- **Whack-a-Mole:** The ready screen now uses the same SVG illustration as its minigame card.
- **Paw Claw:** The prize odds in the info popup are sorted from highest to lowest percentage (56%, 20%, 16%, 4.8%, 2.4%, 0.8%). The odds and server prize algorithm are unchanged.
- **Circular info controls:** Slightly reduced the Paw Claw `!`, Garden `?`, and Paw Brawl special `?` buttons without removing their dialogs or keyboard labels.
- **Market:** Room atmospheres are ordered by required unlock level, so Night Room (Level 8 requirement) sits immediately before the higher-tier unlockable atmospheres instead of appearing among starter choices.
- **Wardrobe:** Owned, Shop, Head, Eyes, Neck, and Clothes have matching 42px-high buttons on phones and remain on one row.
- **Kitchen:** Recipe book, Ingredients, and Pantry are now selectable tabs near the top, so users no longer scroll past every ingredient to reach recipes. The recipe cards have side-by-side **Cook** and **Buy** buttons. A ready-made meal costs **exactly twice the sum of its recipe's ingredient prices**. The backend computes and enforces this cost, deducts the coins, and adds one meal to the pantry; purchasing does not grant cooking progress or cooking XP. Players can cook for less or buy for convenience. Pantry has quick Serve buttons.
- **Missions:** Replaced the long introductory paragraph with a compact Daily / Weekly / Milestones experience, reward summaries and category-filtered milestones. Daily shows 6 active quests, Weekly 8, and the expanded Milestones catalog has 290 entries across 29 tracked activities. Milestones render 18 at a time, with Show More. The Claim all button sits beside the reset timer (or permanent-progress label) on each tab.
- **New mission tracking:** Paw Claw, individual minigames, ready-made meal purchases, friends, PawMail, outfit changes, room atmospheres and visits, furniture placement, finished Paw Brawls, friend gifts, pet notes, and daily-surprise claims. Existing care, garden, arcade, cooking, meal serving, and shopping tracking is preserved. Completed multiplayer battles are recorded server-side, including a draw.
- **Server-authoritative claim all:** A single database transaction locks the pet, checks each active completed mission, inserts idempotent claim records, applies XP/coin rewards and level-ups, and prevents duplicate credit.

## Deploy and verification

- **Redeploy BOTH Vercel (client) and Render (server)**. The new Kitchen and Missions functionality requires the updated backend. No database migration is necessary as long as the existing `011_mission_center.sql` and Kitchen migrations from prior versions were applied.
- Existing claims and mission IDs stay valid; new activity families begin accumulating events **after** deploying the new backend (there is no historical backfill for events previously not tracked).
- Frontend and backend TypeScript checks passed; the existing Paw Brawl 88-kit regression test passed after compiling tests to JavaScript for Linux.
- A representative UI fixture using the actual CSS was inspected at 320, 375, 390, 768, 1024, and 1440 px; there was no horizontal page overflow, all six Wardrobe buttons were equal-height on phones, and no buttons overflowed their labels.
- A full Linux production Vite build remains blocked by archived Windows-only native dependencies (fresh `npm ci` on Vercel resolves the platform dependency). A live multi-account workflow and database-backed reward/claim verification have not been performed; test them after deployment.
- This ZIP contains **README.md as its only Markdown file**.

---

# PawPal Mini-Games Gameplay, Rewards, and Responsive UI Update

This complete PawPal source package builds on the latest Multiplayer and Account Dashboard update. It changes only frontend mini-game code. Existing accounts, multiplayer battles, backend rules, and database schemas are unchanged. Redeploy the **Vercel frontend**; Render and Neon do not require updates for this revision.

## Mini-game improvements

- **Cactus Jump:** Removed the extra Jump button. Tap the game on mobile or press Space/Up on desktop. One cactus spawns at a randomized fixed interval of 1.6 to 2.4 seconds, independently of level. Increasing run duration raises cactus travel speed instead of increasing cactus density. Cacti have a lower, grounded draw position, and the scene has new pastel desert dunes, distant mesas, sunlight, and a sandy running track.
- **Paw Run:** Removed the Left and Right buttons. Swipe horizontally on touch devices or use Left/Right arrow keys.
- **Heart Color Match:** Removed text announcing upcoming color-choice unlocks. The actual central color circle in each SVG paint palette is larger, and choices use a four-column responsive grid.
- **All arcade game modals:** Unified the gamepad title icon alignment, close control (X), score/level/lives HUD styling based on Whack-a-Mole, and mobile dimensions. The canvas no longer duplicates the score inside the artwork.
- **Paw Claw:** Replaced the oversized possibilities text/button block with a circular `!` information control. The actual odds modal still opens with its full prize information. Removed the redundant server-awarded-prizes footnote, retaining the 15-second cooldown text.
- **Rewards on Retry:** For Memory Tiles, Heart Color Match, Cactus Jump, Paw Run, and Whack-a-Mole, pressing **Retry** now calls the server to award the completed game's coins/XP before starting the next round. **Collect coins & quit** and closing with X from the Game Over screen use the same claim-first logic. Buttons are disabled during claim to prevent duplicate submissions. If the backend responds with its existing 8-second reward cooldown, the frontend retries automatically after the cooldown; if the claim ultimately fails, it does not discard the completed score. Paw Claw already grants rewards when the claw drops, so its Play Again behavior remains unchanged.

## Verification and limits

- Frontend and backend `tsc --noEmit` checks passed.
- Source invariant tests confirmed the cactus randomized spawn, unchanged backend difficulty rules, removal of extra movement buttons, hidden color progression description, consistent HUD, and claim-first Retry code paths.
- Mobile 320 x 568 browser layout fixtures rendered Color Match and Cactus Jump without visible clipping; a broader automated browser run timed out and was not counted as a pass. These fixtures are not live gameplay tests.
- A complete Vite production bundle was not possible from the archived Windows `node_modules`, because its Linux Rollup native dependency is missing. On Vercel, install dependencies fresh (`npm ci`) and run `npm run build`.
- Live reward payouts and all minigames on real accounts should still be tested after deployment. No database migration is needed.

---

# PawPal Multiplayer UI & Account Summary Update

This package includes the complete PawPal source code. The multiplayer game rules and database are unchanged by this UI update.

## Updates

- **Multiplayer** now has a single page title. Removed the "Meadow" suffix, "Choose a multiplayer game", "Game Library", and the duplicate wallet summary.
- The **1v1 friend battles** panel has two responsive buttons: "Challenge a Friend" and "Change Game". Both remain easy to press on narrow phones.
- **Recent Battles** is now a button beside the Multiplayer title. It opens a scrollable dialog showing up to five recent results, including an empty state, and can be opened without choosing a game. The dialog supports the Escape key, backdrop dismissal and returning focus to the trigger.
- The global account summary now has three prominent cards showing current Paw Coins, pet level (with XP progress), and accepted friends. The mobile menu remains available beside the welcome heading.
- Audited project source and docs to replace em dash characters with simpler punctuation.

## Verification and deployment

- Client and server TypeScript type checks passed.
- Existing Paw Brawl regression tests passed for 88 breed kits, Focus/Guard rules and other combat checks.
- Browser-based layout checks passed at 320, 360, 390, 430, 600, 768, 844, 1024 and 1440 pixel widths for the page, challenge dialog, and history dialog. Checks covered overflow and visible buttons. These were layout fixtures, not a live two-account test.
- A production Vite build could not complete locally because the archived Windows dependencies lack the Linux Rollup binary. Production deployment should install fresh packages on Vercel.
- Only frontend code and static project documentation changed; redeploy the **frontend**. No database migration is needed.

---

# PawPal - Multiplayer Meadow Modal & Mobile UX Update

**Updated October 29, 2026.** This is the **complete PawPal project source**, including its React/TypeScript client, Node/TypeScript backend and database scripts. The current release changes only the **frontend** (`client/src/Multiplayer.tsx` and `client/src/Multiplayer.css`); the previously completed Paw Brawl server rules are preserved without changes. Keep your existing `.env` secrets outside this ZIP. **Redeploy Vercel (frontend) to apply these UI changes.** Render (backend) and Neon do not need changes if already deployed from the previous update. No database migration is needed.

## What's new

- **Single-line turn/counter bar on phones:** Timer, short action status (`Choose a move` / `Move locked · waiting`) and ready counter remain side by side at narrow widths, even after a move is submitted. The status text may truncate on very narrow devices rather than wrapping to a second row. All four action buttons remain within the match modal.
- **Special skill information:** The `?` icon in the special-skill action no longer has an unnecessary second circular border/background. Tapping the icon still opens the actual breed skill/passive explanations, independent of whether the attack can currently be selected.
- **Challenge a Friend modal:** Select Paw Brawl, then press **Challenge a friend**. The separate popup contains real accepted friends, a custom wager, wager presets, coin balance checks, prize preview and submit/cancel buttons. It fits within the viewport, with its inner form scrollable if necessary; the submit buttons stay visible. A successful submission closes it, and an unsuccessful attempt stays open for correction.
- **Invitation notification bars:** The old large Battle Invitations card is removed. Pending incoming invitations appear as concise bars showing the challenger, game, wager, expiry, and **Accept/Decline** controls. Pending outgoing invitations show **Cancel & refund**. They refresh through the existing polling/event updates, and PawPal's existing header-bell notifications continue working from other tabs.
- **Battle Log modal:** The expandable log within the battle screen is replaced by a **Battle log** button that opens a separate scrollable popup. The log never pushes the move buttons down, and its close control returns you to the active match. It supports many entries and works on mobile and desktop.
- **Simpler heading:** “Choose a multiplayer game” is now the sole subtext under “Multiplayer Meadow.” The previous tagline, extra “Pick a game...” paragraph and “Paw Brawl is playable now...” footer have been removed.
- **Keyboard:** Challenge/Log popups can close with Escape, and their close buttons receive keyboard focus when opened; focus returns to the opening control when closed.

## Paw Brawl rules retained

- Two *real PawPal accounts* play 1v1 with backend-authoritative wager reservation and payout. Friends challenge each other using their currently equipped pet and breed; once a match begins, its breed and stats are fixed until that match ends.
- The two players choose secret moves in shared 30-second rounds. Neither player is assigned an automatic move if the timer expires. Speed and dodge affect combat. An 18-round cap uses remaining HP percentage; exact ties refund wagers.
- All eight species retain 11 breed kits each (88 total), unique special/passive names, Focus costs of 3–7, an **8 Focus** cap, and individual cooldowns. Higher-unlock Breed Grades get modest HP, Attack and Defense advantages, while lower grades can still win.
- **Paw Strike:** +1 Focus per action (+2 total for Stride breeds). **Guard:** +1 Focus per action and 14 → 7 → 0 Shield for consecutive guards; other moves reset the Shield streak. Guard still generates Focus when Shield is exhausted. **Focus:** +3 Focus, up to the cap. **Special:** spends its breed-specific Focus cost.
- The distant opponent's platform stays oval and the opponent's SVG stays smaller. The first-round lunge fix calculates travel distance before starting the hit animation; damage is shown at impact. The Battle Info and special-help overlays remain available.

## Setup and checks

1. Unzip the project and preserve your own `server/.env` and any other environment configuration. Do not copy credentials from an old bundle into a public repository.
2. `cd server && npm ci && npm run build && npm run test:brawl` for a clean backend verification.
3. `cd client && npm ci && npm run build` for a clean frontend verification.
4. Redeploy the **frontend to Vercel**. Backend redeployment is not required for this UI-only revision if your Render server already runs the prior rules. No SQL migration is needed.
5. Test with two actual accounts: send/accept/decline/cancel invitations, check existing header notifications, select a move on a narrow phone and verify the counter remains on one row, open the skill `?`, open/scroll/close battle logs, and test the mobile/desktop challenge dialog.

**Verification performed for this revision:** Both the client and server TypeScript checks passed. The existing combat regression tests passed across 88 breed kits (compiled to JavaScript and run with a placeholder database URL; no DB connection was required). Browser-based *layout mock* checks passed at **320 × 568, 390 × 844, 768 × 1024, 1440 × 900 and 844 × 390** for single-line counters, visible action controls, nonoverflowing Meadow invitation bars, viewport-fitting challenge modals and scrolling battle-log dialogs. The archived Windows `node_modules` lack the Linux-native Rollup/esbuild dependencies, so a complete Vite production build was not possible here; after a fresh `npm ci` on the deployment machine it should be checked. **Live multiplayer interaction between two real accounts has not been verified.**

## Code formatting cleanup (November 2026)

- Application TypeScript/TSX, CSS, SQL, configuration JSON, and entry HTML have been reformatted for four-space indentation and readable multiline blocks.
- Conditional and loop bodies use braces with statements on separate lines; string literals in the TypeScript/TSX source use double quotation marks.
- `.editorconfig` and `.prettierrc.json` specify the preferred four-space and double-quote conventions for future editing.
- **Kitchen** and **Lucky Garden** both use the same circled-question-mark icon followed by `Info` in their header buttons.
- This release does not change gameplay, rewards, database schemas, or API contracts.


## Settings & future background music

The moon/sun header toggle was replaced with a Settings modal (the gear icon in the top bar).
Players can choose Light, Dark, or System (follows their device), set music on/off and volume,
and choose whether music pauses when the browser tab is hidden. These preferences are saved
in the browser's local storage. Changing the site's theme does **not** change the pet's room atmosphere.

The five BGM mappings are prepared in `client/src/musicTracks.ts`:

| Zone | Expected file |
| --- | --- |
| Living Room, Friends, Market, Wardrobe, Missions | `bgm_main.mp3` |
| Lucky Garden | `bgm_garden.mp3` |
| Kitchen | `bgm_kitchen.mp3` |
| Mini-games | `bgm_arcade.mp3` |
| Multiplayer | `bgm_multiplayer.mp3` |

**The soundtrack files have not been provided yet and are not included in this package.**
They are deliberately mapped with `source: null` so the site never attempts to load missing
MP3 files. Once the approved audio files arrive, put them in `client/public/audio/` and set
`source: "/audio/<filename>.mp3"` for each track. Music starts only when players opt in,
loops, and crossfades on game-section changes. One volume slider applies to every track.
To actually equalize the *perceived* loudness across different recordings, analyze/normalize
the supplied files to a common loudness target and set their per-track `loudnessTrim` if
needed. Equal HTML audio volume values alone do not guarantee equal loudness.

The Light, Dark, and System preview SVGs are also available under Develop → Settings art.
This update needs a **frontend (Vercel) redeploy only**, without backend or database changes.

### Paw-shaped music slider

The Settings music volume control uses `client/public/paw-volume-thumb.svg` as the native range-input handle. The same SVG is previewable under **Develop → Settings art**. The range control retains keyboard, mouse, and touchscreen interaction and applies the saved music volume to all five normalized tracks.


## Settings and modal consistency update (November 2026)

- Settings now use the paw-shaped **Music volume** slider as the sole music control. At 0% the music is off; increasing the slider enables playback. Old `musicEnabled: false` preferences migrate to 0%, preserving the previous mute choice.
- Music pauses automatically whenever the browser tab is hidden. The separate background-pause toggle was removed. All five loudness-balanced MP3 tracks are included in `client/public/audio/`.
- Settings volume slider has inset horizontal spacing, and the Done button has no default browser-style border. Modal headers use titles with smaller subtitles below and rounded-square X buttons on the right, matching Challenge a Friend.
- Paw Brawl's status cards sit above the illustrated arena instead of covering either pet. Pressing the battle X, Escape, or clicking outside an active battle requests confirmation. Confirming posts to the existing backend `/api/multiplayer/challenges/:id/forfeit` endpoint, which settles the match as a loss. Closing a finished battle still simply dismisses it.
- `client/src/MatchExitConfirmation.tsx` is reusable for any future live multiplayer game: supply the game name, consequences, cancel action, and server-backed forfeit action. Do not award results or settle matches in the frontend.
- The changes are frontend-only. Redeploy the Vercel frontend; no Neon migration or Render redeployment is required.
- Validation: frontend and backend TypeScript checks passed, source behavior checks passed, previous game tests passed. Responsive static-layout checks passed at 320, 390, 768, 1024 and 1440 px. The complete Vite build and live authenticated match settlement are not verified locally because archived build dependencies are platform-specific.


## November 1, 2026 — UI feedback, Garden/Missions badges, Friends request states

- **Lucky Garden action feedback:** only the clicked seed/watering/harvest/unlock/buy button looks busy while a request is in flight. Other temporarily disabled buttons keep their normal colors; genuinely unavailable controls remain dimmed.
- **Paw Brawl:** raised the enemy's shallow oval platform to visually meet the smaller, distant opponent; combat positioning and lunge measurements are unchanged.
- **Navigation alerts:** a small red dot appears beside Missions when at least one mission is completed but not claimed, and beside Lucky Garden when a flower is ready to harvest. Mission status refreshes on actions, on the Missions tab, on tab visibility, and periodically. Garden growth status is checked even when outside Lucky Garden.
- **Friends:** Send PawMail, Gift 25 coins, and Unfriend SVGs/touch targets are larger on desktop and mobile.
- **Friend-request counter:** counts only *new incoming requests not yet viewed*, not requests you sent. Opening the Add Friends / Requests modal marks the incoming requests as seen; pending requests remain listed so they can still be accepted/removed. Viewed request state is stored per user account in the current browser's localStorage and persists through reloads. A future request from the same person gets a new creation timestamp and counts as new. There is no database migration: the existing `/api/friends` query now also returns the friendship's `created_at` timestamp. Seen state does not synchronize between different browsers/devices.

No new environment variables or SQL migration are required. Run the usual `npm install` and `npm run build` commands in both `client` and `server` after extracting. On this patching environment, the TypeScript source files passed syntax transpilation, but a complete dependency-based build was not verified because npm package installation did not complete.

## November 1, 2026 — Milestone balance, Kitchen labels, page headings and Paw Brawl guide

- **Milestone rewards rebalanced:** Permanent achievement/milestone missions award **30–120 Paw Coins** and **12–48 EXP** by tier rather than **175–850 Paw Coins** and **50–230 EXP**. Only *future claims* use the new rewards; previous claims and balances stay unchanged. Daily and weekly missions are unaffected. All values remain server-authoritative in `server/src/index.ts`; no migration is required.
- **Kitchen button label fix:** A legacy rule gave the words in Recipe Book / Experiment / Market / Pantry tabs the same pale-white background as the Pantry quantity badge. The tab's `.k3-tab-label` now has a transparent background, no badge padding or border, and inherits the correct tab color. Kitchen button text is not text-selectable on touch or rapid clicks. Pantry count badges retain their visible capsules.
- **Page headers:** The shared `SectionHeading` titles now follow the same rose-plum typography, SVG accent color, and eyebrow color on every primary tab (including dark mode). All main gameplay pages retain the small uppercase eyebrow *above* the larger title.
- **Paw Brawl info:** The top-right `PLAYABLE` label on the game tile is now a circular `?` control, separate from the game selection button. The guide modal uses the shared Challenge a Friend header, subtitle, square X and backdrop. It pulls the complete authoritative combat catalog from the existing public `GET /api/multiplayer/rules` endpoint: **8 species, 88 breeds**, each with HP/ATK/DEF/SPD, unlock level, special, Focus cost, cooldown, passive and descriptions. Includes basic move rules, a species filter, an All Pets view and a search field. The guide works without entering a multiplayer match; choosing `?` does not choose the game. Responsive layouts and dark mode are included.
- **Deployment:** Redeploy both Render **backend** (milestone values) and Vercel **frontend** (UI and combat guide) using this ZIP. No SQL, environment-variable, package or dependency changes are necessary.
- **Verification:** Modified TS/TSX files passed TypeScript syntax transpilation. Full `npm run build` could not be completed here because the package registry/cache did not provide every dependency; confirm the build in a network-enabled development environment. Live browser interactions were not verified in this environment.


## Paw Brawl Focus charging update (November 1, 2026)

- **Paw Strike (Attack):** charges **+1 Focus** per selected attack action, even if it misses or is dodged. The breed **Stride** passive adds another +1 (so those breeds receive **+2 Focus** per attack).
- **Guard (Shield):** charges **+1 Focus** per selected guard action, including when Shield is at its maximum or Guard fatigue grants zero Shield. Guard Shield still follows the 14 → 7 → 0 consecutive-use pattern.
- **Focus:** remains +3 Focus. **Special:** retains its breed-specific Focus cost/cooldown. All Focus gains respect the shared **8 Focus** cap.
- Frontend combat buttons, in-match move guide, public Paw Brawl guide and Develop tab display these rules from the shared `/api/multiplayer/rules` response. Server remains authoritative over actual battle resolution.
- Updated combat regression checks cover base Focus gain, repeated Guard, Stride bonus and the cap; no database migration is required. Deploy both the frontend (Vercel) and backend (Render).


## Paw Brawl 2.3 — historical conditional specials (superseded)

This section supersedes all previous Paw Brawl rules and descriptions elsewhere in this README.

- **88 playable breeds**, **176 named active specials**, and separate passive traits. Neither special has a forced FIRST or LAST designation. Both can be activated whenever they are ready. The main effect always works; its situational conditional bonus depends on the breed/ability, not which of the two buttons is pressed.
- **Bunny** (fast): Meadow Moonhop deals normal attack damage and an additional +3 only when strictly faster than the enemy. Clover Vanish is an independent Focus-costing evasive attack: it prepares a dodge; if the bunny is faster and the enemy uses Focus or Guard instead of attacking, the unused dodge converts into up to 10 Shield. Equal-Speed bunnies have no +3 Speed bonus, but their ordinary skill effects still resolve.
- **Panda** (heavy): Bamboo Harmony Strike generates a temporary Shield and arms a one-time up-to-2-Focus refund if an opponent's attack actually breaks that Shield before expiry. Bamboo Last Stand (Shield Slam) still deals base attack damage, plus 1 damage per 3 Shield the panda had before attacking (maximum +7); it consumes up to 5 Shield. Without Shield, its base damage still works. Other defensive pandas use similarly complementary defensive pairings. The fast Red Panda variants instead have speed skills.
- **Current 2.8:** Shield expires after 3 rounds (creation round plus two more). Expiry does not trigger the panda refund. Regular attacks now bypass at least 40% Shield; max Shield 34. The first consecutive Guard gains up to 16 Shield and +1 Focus, second 8 Shield and no Focus, third onward neither. Gaining any new Shield refreshes that Shield's shared expiry; a normal Guard cannot inherit an older special's break-Focus reward.
- Attack +1 Focus, Focus action +3 (cap 8); specials cost 4–6 Focus, have separate cooldowns, and can be used consecutively when Focus and individual cooldowns allow. Crowd-control immunity, poison, and overtime pressure are retained.
- Ability conditions come from the server-owned `server/src/brawlAbilities.ts` catalog. The battle buttons, in-match guide, global Paw Brawl Guide, and Develop panel display the actual server skill definitions and conditional bonuses.
- **Regression tests:** `npm run test:brawl:conditional`, `npm run test:brawl`, `npm run test:brawl:progression`, and `npm run test:brawl:balance`. The conditional test checks bunny speed ties/unused dodge, the panda break refund and Shield Slam, three-round expiry, all 176 names, and Guard fatigue.
- **Deployment:** Redeploy both Render backend and Vercel frontend. No schema migration, new environment variables, or dependencies. Finish active matches before updating because saved matches resume under new combat rules.


## Paw Brawl 2.4: easy skill explanations and live status indicators

- Paw Brawl Guide, Develop and each match's special-help modal now show **NORMAL EFFECT**, **EXTRA BONUS** and **COST** in plain language. Every breed's two skills and passive use the single server-owned skill catalog.
- In the fight's two top stat panels, **both you and your opponent** can see active effects with their numeric values: poison damage per round and rounds left, counter damage, Shield and expiry, prepared dodge, pending attack boosts, stun, stun protection, Focus refund on Shield break, Guard fatigue and used Last Stand.
- On mobile, status badges wrap neatly inside each stat panel. Status badges do not cover the characters.
- The complete illustrated-in-words roster is `PAWBRAWL_FULL_ROSTER.md` and includes a beginner glossary.
- This version changes display and documentation only, not the actual battle damage, cooldown, or reward calculations. The server should still be redeployed because skill text comes from the server API. No database migration is needed.

### Paw Brawl 2.6: compact battle interface

- The main match modal occupies a fixed, viewport-fitting area. Its battlefield expands into available space instead of the modal scrolling or growing when effects activate. Very short screens use a compact control/HUD layout.
- The enemy platform and opponent sprite use the same ground anchor. Combat numbers appear beside the affected pet, with up to three high-priority floating events per hit. The numbers still come from the server's resolved state; combat rules and damage values are unchanged.
- The HUD shows a stable, one-line row of icon-only effects for both pets. The number beside each icon is its value (for example, poison damage); the small circled number is the rounds remaining. Hover or keyboard-focus an icon for the full explanation. On touch screens, the row can be swiped horizontally to reach extra effects.
- Each special's `?` button explains **that skill only**, not both specials and the passive together. Paw Strike shows an **if-hit HP estimate** that accounts for current attack, defense and Shield; dodge, random effects and later move resolution can still change the result.
- Both special action buttons have centered icons and titles. The `?` controls remain independent of the action, including when it is disabled.

This release modifies battle presentation only. It does not change the server damage calculations, database schema or character statistics. Test with two real accounts on multiple screen sizes before deployment.

## Paw Brawl 3.0: Duo Clash (latest)

**One Paw Brawl card, two modes: Classic 1v1 and Duo Clash 2v2.** Four real registered accounts bring one permanent pet each. Features include private lobby codes, friend invitations and notification-bell routing, two balanced teams, simultaneous hidden actions, enemy targeting, ally support, Cover Teammate, one-time team rescue, 45-second disconnect protection, optional equal-stake team wagers, and separate Duo statistics. Both arenas have pet SVG Speed-order indicators.

**Database migration required on Neon** (unlike 2.8): run `database/migrations/013_duo_clash.sql` before deploying the backend. See [`DUO_CLASH_3_0.md`](DUO_CLASH_3_0.md) for complete setup, rules, security and regression-testing notes. Deploy both backend (Render) and frontend (Vercel). Test with four independent real accounts starting at a 0-coin stake. No new npm dependencies or environment variables.

## Paw Brawl 3.2: Duo Wager & Room Setup Refinements

Duo Clash 2v2 now matches Classic 1v1's wager UI (coin icon, editable field, quick presets, live payout summary). The default entry is **100 Paw Coins per player**, with **Free / 25 / 50 / 100** quick options and any whole-number stake from 0–100. The established server-side wager maximum and equal-contribution transaction handling are unchanged. A 0-coin practice match is recommended for first testing.

The host **never enters a room code**. When creating a private lobby, the Render backend generates a secure, unique code in `PAW-XXXXXXXX` format and displays it read-only with a Copy button. Existing `PAWXXXXXXXX` room codes remain joinable. Only players joining an existing room type a friend's code. Team names are now **Moonpaws** (lavender) and **Starwhiskers** (peach) in team selection, waiting lobby, battle header, invitations, and results. The underlying numerical team IDs remain unchanged; no database migration is needed for 3.2.

If already on **3.1**, redeploy both the **Vercel frontend** and **Render backend** to use the new hyphenated code generator. Existing 3.1 backend still works with the new 3.2 frontend but continues generating the previous code format. As with earlier Duo builds, complete a four-account staging match before enabling wagered battles in production.
