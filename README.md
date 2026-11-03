# PawPal 4.7 — Admin API Response Diagnostics (Patch Only)

Apply this patch on top of **PawPal 4.6**. It contains **only changed source files and this README.md**. No audio, images, pet artwork, dependencies, local environment files, or extra Markdown documents are included.

## Files changed

- `client/src/AdminConsole.tsx`: Admin Panel 2.0 API calls now report an actionable error for a missing API URL, failed connection, HTML/404 response, or JSON error. No more unexplained “Invalid server response” errors.
- `client/src/Admin.tsx`: The existing Admin login, player, and password-management requests receive the same clearer API diagnostics.
- `server/src/index.ts`: Unknown `/api` routes now return a JSON 404 instead of Express's HTML 404. Missing Neon tables/columns return a helpful 503 error. Existing routes, authentication, gameplay, and notification logic remain intact.
- `README.md`: Deployment and diagnosis instructions (this file).

## Why Overview, Games, Multiplayer, and other tabs showed “Invalid server response”

Those new admin tabs request API paths like `/api/admin/dashboard`, `/api/admin/activity`, and `/api/admin/multiplayer-monitor`. In PawPal 4.6, the frontend simply reported “Invalid server response” whenever an API returned HTML instead of JSON. Most often, this means:

1. **Render is still serving an older PawPal backend** that does not have the 4.5+ admin API routes. Express responds with HTML `404 Cannot GET...`.
2. **Vercel has no `VITE_API_URL`, or the value is wrong**. Vercel can serve your React HTML page when the frontend tries to request `/api/...` from its own host.
3. **Neon has not had migration 017 or 018 applied**. Unlike the first two, this usually returns a JSON 503/500 response, but also needs to be checked.

This patch makes the underlying error visible. It **does not deploy your backend or execute database migrations** for you.

## Installation and deployment

1. Back up your current project. Extract this archive into the parent directory of `Website 5 (Pawpal)` and overwrite matching files.
2. **Neon:** If not already applied, execute `database/migrations/017_admin_console.sql` and `database/migrations/018_notification_seen.sql` against the **same Neon database** used by Render. Both migrations exist in the earlier 4.5 and 4.6 patches; this patch doesn't duplicate them.
3. **Render:** Verify it deploys the current `server/src/index.ts` and `server/src/adminConsole.ts`. In a monorepo, check that the Render Root Directory is `server`, the build command runs your server TypeScript build, and the start command runs the built backend. Trigger a manual deploy if auto-deploy didn't run. Look for `PawPal API running on port ...` in the logs.
4. **Vercel:** In Project Settings → Environment Variables, set `VITE_API_URL` to your **HTTPS Render backend base URL** (for example, `https://YOUR-SERVICE.onrender.com`). **Do not append `/api`**. Set it for the Production environment, then redeploy Vercel so Vite picks up the build-time environment variable.
5. Refresh `/admin`, log in again, and open Overview, Games, Multiplayer, Economy, and Announcements.

## Fast diagnosis without an admin token

Open your Render backend directly in a browser at:

`https://YOUR-RENDER-BACKEND.onrender.com/api/admin/dashboard`

The following results have different meanings:

- **HTTP 401 with JSON** (such as `{"error":"Admin session expired. Sign in again."}`): The new Admin API route exists; it is correctly rejecting access without an admin token.
- **HTTP 404 / `Cannot GET /api/admin/dashboard`**: Render is running old code, or you are using the wrong service URL.
- **HTTP 502/503/504 or a Render HTML page**: The service may be starting, failing to deploy, or unreachable. Inspect its deployment logs.

Then visit:

`https://YOUR-RENDER-BACKEND.onrender.com/api/system/status`

- **HTTP 200 JSON**: Admin game settings are available (migration 017 is likely present).
- **HTTP 503 JSON mentioning game settings or migration**: Check migration 017 and that Render points to the correct Neon database.

In Chrome DevTools → Network, select a failed request such as `dashboard` and inspect the **Request URL**, **Status**, and **Response**. It should go to Render, not the Vercel frontend URL, and return JSON. Never share or paste your admin Authorization token publicly.

## Notes and verification

- Frontend and backend TypeScript checks passed against the reconstructed PawPal 4.6 source and preceding required patches.
- No database schema changes, new dependencies, or Android APK rebuild are needed for this patch.
- This cannot verify your actual Render/Neon deployment: confirm the live HTTP responses using the checks above.
- Your PWABuilder APK uses the deployed Vercel website and should receive this frontend change without installing a new APK.
