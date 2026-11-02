# PawPal 4.1 - Login after Password Reset

## What's changed

- `client/src/ResetPassword.tsx`
  - On successful password reset, clears the old PawPal login token and the pending forgot-password ticket from this browser.
  - Shows the success message briefly (1.2 seconds), then redirects to the login screen.
  - All "Go to login", "Return to login", and reset-page close links explicitly open the login screen rather than the main game.
- `client/src/App.tsx`
  - Handles `/?login=1` as an explicit sign-in destination and removes stale local credentials.
  - Shows a clear "Password updated" message on successful reset.
  - When the backend returns HTTP 401 for an expired or revoked session, clears the invalid saved token and returns to the login form instead of staying on an unresponsive page.
  - Removes the temporary login query parameters from the address bar after loading.

## How to apply

1. Apply this **after PawPal 4.0** (which follows 3.9).
2. Close running dev servers if desired. Extract the ZIP in the parent directory of `Website 5 (Pawpal)`, maintaining folder paths and replacing matching files.
3. In `client`, run `npm run dev`. Keep your existing backend running for local tests.
4. Visit `http://localhost:5173/?login=1` if you want to force the login screen immediately.
5. Reset a password using a valid single-use link. After success you should return to the login form automatically and be able to sign in with the new password.
6. For production, deploy the changed **Vercel frontend**. No Render change or Neon migration is needed.

## Why you saw "Please sign in again"

PawPal invalidates previous login tokens when a password is reset. The old frontend kept an invalid token in browser localStorage and showed the backend's 401 message. This patch clears that expired session and displays the login form. This is intentional account security behavior, not a new password failure.

## Verification

- PawPal frontend TypeScript project: `node node_modules/typescript/bin/tsc -b --pretty false` passed against the overlaid 3.6-4.0 project source.
- No new database tables, backend changes, audio, images, or additional Markdown files.
- Actual running-browser and live deployment behavior still needs confirmation in your local project and Vercel.
