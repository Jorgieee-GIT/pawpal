# PawPal 4.6 — Notification Seen State & Slider Styling

**Patch-only update.** Apply this over PawPal **4.5** (`PawPal_4_5_Admin_Panel_2_0_PATCH_ONLY.zip` already applied). All file paths inside this ZIP match the existing project layout.

## Exactly what changed

- `client/src/App.tsx`: Opening the notification bell now marks the five displayed items as seen (without accepting or declining friend requests or multiplayer challenges). The red dot clears immediately. Background polling, refreshing, and other tabs respect a pending seen confirmation; if saving fails, the correct unread state is reloaded. The bell also records announcements as seen.
- `server/src/index.ts`: Persistent per-user seen flags now affect the `/api/notifications` feed across announcement, friend-request, PawMail, Classic challenge, and Duo invite types. Added authenticated `POST /api/notifications/seen`. A notification is validated against the logged-in user's actual feed before storing seen state, so one player cannot mark another's notifications. Existing announcement read records remain synchronized.
- `database/migrations/018_notification_seen.sql`: New `player_notification_seen` table. Repeated requests from the same account are distinct by event creation time, so new invitations still trigger a dot. Run this **before** deploying the new backend.
- `client/src/SettingsModal.css`: Paw-shaped volume slider keeps its original thumb and pink filled portion; the unfilled portion is now light gray rather than black/dark, including in dark mode.
- `client/src/AdminConsole.tsx`: Displays the real progress percentage on admin reward and cooldown sliders.
- `client/src/AdminConsole.css`: Custom cross-browser slider track: pink fill, light-gray remainder, and matching thumb/focus styling. Mobile-friendly and retains keyboard/touch use.
- `README.md`: This file (the only Markdown file in the patch).

## Install and deploy

1. Back up your existing PawPal 4.5 project.
2. Extract this ZIP into your existing project directory, overwriting matching files while preserving the `Website 5 (Pawpal)/` folder structure.
3. **Neon first:** Run `database/migrations/018_notification_seen.sql` after migration 017.
4. **Render second:** Deploy the updated backend. The notifications endpoint requires the new table.
5. **Vercel third:** Deploy the updated frontend. Ordinary Vercel updates will appear inside your installed PWABuilder Android app; do not rebuild the APK for this change.
6. Hard-refresh PawPal if an old tab cached a previous frontend.

## Verify with two real accounts

- Admin publishes an announcement. Player sees a red dot. Opening the notification bell clears it; closing/reopening the bell does not bring it back. Opening the announcement shows its content without restoring a dot.
- Player receives a friend request. Opening the bell clears its red dot; request remains pending until accepted or declined. When a new request is sent later, the new item is unread.
- Player receives a Classic or Duo invitation. Viewing the bell clears the dot but does not accept or forfeit the invitation.
- Have a player receive PawMail. Viewing the bell clears its notification dot, but the letter itself stays unread in PawMail until opened.
- Refresh the page or log in on a different device to verify that seen state persists. New notifications still produce new red dots.
- Check the volume slider in PawPal Settings and the reward/cooldown sliders in Admin (also dark mode/mobile).

## Validation and limits

- Client and server TypeScript checks passed.
- Modified CSS files parsed with PostCSS.
- The ZIP was verified and contains no audio files, artwork replacements, `.env` files, `node_modules`, or extra Markdown documents.
- Live Neon migration, full Vite bundle, and live two-account interaction remain untested here. TypeScript-based HTTP smoke tests could not run because the source dependencies contain Windows-native esbuild binaries.

No password rules, multiplayer match state, wagers, or notification action outcomes were changed.
