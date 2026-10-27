PawPal V9 visual update (based on V8)

- Foxes have larger pointed ears, cheek fur, elongated white muzzle and bushier white-tipped tails.
- All V8 clothes follow the rounded pet torso, with distinctive pattern/color variations.
- Clothes render behind the head; neck, eyes and head accessories render in front.
- No PostgreSQL migration required beyond V8.

Install: back up your V8 project and replace client/src/PetArt.tsx only.


## Latest update: Atmosphere wall/floor alignment

The admin-only `/develop` Atmosphere gallery now aligns its visible baseboard with the room's actual wall/floor transition. Living Room uses the existing approximately 53% boundary; Bedroom, Creative Studio, and Sports Room use the 66% boundary. Premium themes (Aurora Prism through Celestial Opal) now adapt their gradient boundary to these room types, including in gameplay. Existing furniture, theme colors, pets, unlocks, and admin access are unchanged.

### Test checklist

1. Log in as admin and open `/develop` → Atmosphere.
2. For each of Bedroom, Creative Studio, and Sports Room, select Aurora Prism, Cosmic Nebula, Crystal Lagoon, Solar Eclipse, and Celestial Opal. Verify the baseboard line sits directly on the wall/floor color transition.
3. Repeat with Living Room; verify its original boundary remains aligned.
4. Compare the same themes in actual gameplay rooms on desktop and mobile.

The project archive has been checked for integrity; a full browser rendering test was not performed.


## Admin portal consistency and password reset update

- The signed-in `/admin` header now has a **Developer gallery** button leading to `/develop`. The developer gallery already has an **Admin dashboard** return link. Both use the same admin session and require administrator access.
- Both portals now use matching pastel backgrounds, header treatment, branding, typography, buttons, and content widths. Existing dashboard features and gallery previews are retained.
- **Reset player password** accepts **6–100 characters** (previously 12–100), validated in both the form and backend. Passwords are still hashed with bcrypt. The ordinary player registration minimum remains 6.
- Deploy **both client and server** for the password reset change. No database migration is required.

### Check after deploying

1. Sign in at `/admin` and click **Developer gallery**. Return using **Admin dashboard**.
2. Check both dashboards at desktop and mobile widths; confirm existing artwork tabs and account tools still work.
3. As admin, reset a test player's password to exactly 6 characters, then verify login with that password. Check that 5 characters are rejected.
4. Verify regular player accounts cannot access either private portal.

## Admin dashboard visual consistency fix

Both `/admin` and `/develop` now load the same `client/src/AdminShared.css` design system. The two pages share their header dimensions, brand icon, page width, background, typography, title layout, navigation buttons, card borders, and responsive breakpoints. The gallery keeps its unique artwork tools and the account dashboard keeps its player-management table. The administrator password reset minimum remains six characters. Deploy the frontend to see the change; if the old appearance persists, hard-refresh the browser or clear its cached site assets.

**Check:** Compare `/admin` and `/develop` side by side at desktop and mobile widths; test navigation both ways and gallery tabs. A production browser visual test was not run in this environment.


## Admin panel welcome and copyright

Both `/admin` and `/develop` display **Welcome, Jorge Jose** in their authenticated headers. Both pages also display a footer with the current year, PawPal copyright, and Jorge Jose. The welcome message is hidden until an admin session is active. This update is frontend-only; no database migration or backend deployment is required.


## Room background alignment and developer preview (October 2026)
- Fixed the real gameplay Living Room atmosphere backgrounds, including Aurora Prism through Celestial Opal. The wall/floor divider is aligned with the actual background transition.
- All four gameplay rooms now use the same theme-aware wall/floor background rules (Living Room 53%, other rooms 66%).
- The admin `/develop` Atmosphere tab now uses the actual gameplay `living-room` classes, real `window` and `wall-art`, and the actual `RoomFurniture` component with `furnitureLayout()` starter positions. This is a read-only visual preview; no pet is required.
- Test all 17 themes in all four rooms both in gameplay and `/develop`, especially the five premium themes and mobile view. The developer preview does not simulate live pets, overlays, or room interaction.
- Frontend-only change: redeploy Vercel.


## Premium atmosphere visual refresh (October 2026)
- Aurora Prism, Cosmic Nebula, Crystal Lagoon, Solar Eclipse and Celestial Opal now use pastel wall and floor colors instead of saturated, full-room gradient blends.
- Each premium atmosphere has a distinct decorative wallpaper pattern (crystals, constellations, lagoon scallops, sun medallions or opal diamonds). The floor remains solid and the baseboard follows the real room split.
- The real gameplay room and admin `/develop` atmosphere preview share the same CSS. Living Room uses a 53% wall split; Bedroom, Creative Studio and Sports Room use 66%.
- No atmosphere IDs, unlock levels, prices, furniture, pet assets or database records were changed.
- Test all five premium themes in all four room types in gameplay and `/develop`; verify the wallpaper stays on the wall, floor stays solid and baseboard aligns on desktop/mobile.


## Premium atmosphere architectural redesign and room floor ratio

- All four rooms now use the Living Room's 53% wall / 47% floor split, including `/develop` previews. The baseboard aligns to the same split.
- Aurora Prism, Cosmic Nebula, Crystal Lagoon, Solar Eclipse and Celestial Opal now feature five distinct vector architectural wall illustrations (crystal gallery, observatory, lagoon arches, solar hall and opal jewel room) instead of repetitive wallpaper gradients.
- Premium floor panels have light theme-specific line details while retaining the flat pastel wall/floor colors.
- The actual gameplay room and `/develop` use the same CSS selectors and theme artwork. Existing room furniture, pets, prices, unlocks, and backend remain unchanged.
- Test each of the five themes across Living Room, Bedroom, Creative Studio and Sports Room, then compare gameplay to `/develop` at desktop and mobile widths.
- This archive was checked for integrity, but a full browser rendering test was not performed.


## Distinct room architecture (October 2026)
- Added `client/src/RoomArchitecture.tsx`, shared by actual gameplay and `/develop` atmosphere previews.
- Living Room: classic wall-panel trim. Bedroom: arched upholstered-style alcoves and molding. Creative Studio: gallery wall panels, framed abstract art, and subtle studio floor grid. Sports Room: sports hall wall panels, circular emblems, and floor court markings.
- Architectural decorations are SVG and noninteractive; furniture, pets, room themes, purchases and unlocks are unchanged.
- Check all four rooms in gameplay and `/develop` at desktop/mobile widths, especially that room details do not obstruct pet and furniture interactions.
- A full browser comparison has not been performed.


## Room identity correction
- Replaced faint architecture lines with prominent permanent SVG scenery for Bedroom (canopy alcove), Creative Studio (gallery paintings and easel), and Sports Room (scoreboard, padded walls and court).
- Hid the generic oval living-room rug, living-room window and wall-art in the three non-living rooms.
- Shared `RoomArchitecture` is used in gameplay and `/develop`, so previews show the same room-specific illustration.
- Test each room with different atmospheres and on mobile. No backend changes.


## Neutral room architecture update (October 2026)

- Recolored the permanent room architecture with warm ivory, parchment, sand, and stone instead of room-specific pink, teal, and purple. The result is designed to complement all 17 atmosphere palettes.
- Retained distinct room identities: bedroom canopy/alcove, studio gallery and pegboard, sports scoreboard and court, living room cozy trim.
- Added understated room architectural details and atmosphere-aware translucent accents. No furniture SVGs, pet artwork, themes, pricing, unlocks, or backend data were changed.
- The same `RoomArchitecture` component is used by gameplay and the `/develop` gallery.
- Check all four rooms with blush and premium themes, on mobile and desktop. This update has not been visually verified in a browser.
