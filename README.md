## Kitchen Rhythm Mixing — keyboard and full-screen swipe controls

- On desktop, follow the randomized arrow sequence using **Left / Up / Right / Down** on the keyboard. The game listens at the window level and prevents the arrow keys from scrolling the page while the mixing step is active.
- On touchscreens, swipe in the requested direction **anywhere on screen, including outside the cooking modal**. Swipes shorter than 42px or ambiguous diagonal gestures are ignored; scrolling is suppressed only for active swipe movements. The overlay remains open on backdrop touches during Rhythm Mixing; use the close (X) control to leave.
- No on-screen arrow-tap buttons for Rhythm Mixing. Progress and correct steps are shown in the arrow sequence. Other minigames keep their existing controls.
- Frontend-only change; no Render deployment or database migration is needed. Redeploy Vercel.

# Kitchen randomized tap sequences (October 30, 2026)

The Kitchen minigames **Cake Decorating**, **Plate Puzzle**, and **Rhythm Mixing** now generate a fresh shuffled tapping sequence for each new cooking step/attempt. The order appears on screen and the buttons are checked against that same order. A new attempt does not repeat the immediately previous pattern. For Rhythm Mixing, arrows remain in fixed button positions while the displayed sequence changes, so the player actually follows the new pattern rather than pressing the buttons left to right.

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
- **Paw Strike:** no standard Focus gain (some passives can grant Focus). **Guard:** no Focus gain and 14 → 7 → 0 Shield for consecutive guards; other moves reset the streak. **Focus:** +3 Focus, up to the cap. **Special:** spends its breed-specific Focus cost.
- The distant opponent's platform stays oval and the opponent's SVG stays smaller. The first-round lunge fix calculates travel distance before starting the hit animation; damage is shown at impact. The Battle Info and special-help overlays remain available.

## Setup and checks

1. Unzip the project and preserve your own `server/.env` and any other environment configuration. Do not copy credentials from an old bundle into a public repository.
2. `cd server && npm ci && npm run build && npm run test:brawl` for a clean backend verification.
3. `cd client && npm ci && npm run build` for a clean frontend verification.
4. Redeploy the **frontend to Vercel**. Backend redeployment is not required for this UI-only revision if your Render server already runs the prior rules. No SQL migration is needed.
5. Test with two actual accounts: send/accept/decline/cancel invitations, check existing header notifications, select a move on a narrow phone and verify the counter remains on one row, open the skill `?`, open/scroll/close battle logs, and test the mobile/desktop challenge dialog.

**Verification performed for this revision:** Both the client and server TypeScript checks passed. The existing combat regression tests passed across 88 breed kits (compiled to JavaScript and run with a placeholder database URL; no DB connection was required). Browser-based *layout mock* checks passed at **320 × 568, 390 × 844, 768 × 1024, 1440 × 900 and 844 × 390** for single-line counters, visible action controls, nonoverflowing Meadow invitation bars, viewport-fitting challenge modals and scrolling battle-log dialogs. The archived Windows `node_modules` lack the Linux-native Rollup/esbuild dependencies, so a complete Vite production build was not possible here; after a fresh `npm ci` on the deployment machine it should be checked. **Live multiplayer interaction between two real accounts has not been verified.**
