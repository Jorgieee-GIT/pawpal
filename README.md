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
