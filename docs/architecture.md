# PawPal source map

## Frontend

`client/src/App.tsx` coordinates the session, shared player state, navigation, and overlays. Feature screens and local assets are grouped under `client/src/features/` by domain.
Feature views receive typed props so changing tabs keeps the existing state lifecycle.

- `features/auth/`: sign-in, recovery, and adoption screens.
- `features/rooms/`: room controls, pet care, furniture, and visiting pet artwork.
- `features/social/`: friends and postcard presentation.
- `features/shop/`: shopping and customization.
- `features/arcade/`: arcade selection, mini-games, and Paw Brawl views.
- `features/garden/`, `features/kitchen/`, `features/missions/`, `features/multiplayer/`, `features/admin/`: their respective feature screens and local assets.
- `shopCatalog.ts`, `gameCatalog.ts`, `PawIcons.tsx`, `types.ts`: shared catalogs, icons, and data contracts.
- `api.ts`, `hooks/useApiRequest.ts`: API base URL, authenticated requests, in-flight GET deduplication, and session expiry.
- Garden, kitchen, missions, and multiplayer screens live in their corresponding feature folders.

Feature panels and game screens use `React.lazy` with a `Suspense` placeholder so the login
screen only downloads the core app. `main.tsx` also splits the admin, develop, and
reset-password entry points. React is emitted as a separate long-lived vendor chunk.
Keep new tab panels lazy, and import shared artwork (for example `FoodArt` from
`KitchenArt.tsx`) directly so one panel does not pull in another feature's bundle.

Add feature-specific UI to its panel. Keep cross-feature player updates in `App.tsx` and use
the shared request/action callbacks for mutations.

## Backend

`server/src/index.ts` starts the HTTP server and live database listener.
`server/src/app.ts` builds the Express application and registers middleware and feature routes.
Creating the application alone does not start a listener, so tests can use an in-memory database boundary.

- `routes/`: admin, auth, health, pets, shop, rooms, live events, notifications, friends,
  mail, garden, arcade, kitchen, and missions/achievements.
- `auth.ts`, `http.ts`: session validation and async route error handling.
- `petState.ts`: pet fields, offline decay, waking, transactional mutations, and level progression.
- `live.ts`: connected clients, friend broadcasts, and PostgreSQL LISTEN/NOTIFY.
- `missions.ts`: mission definitions, schedules, progress, and event recording.
- `petCatalog.ts`, `furnitureCatalog.ts`: initialized item catalogs and room layout defaults.
- Existing multiplayer, duo, password recovery, and admin-console modules register through `app.ts`.

Feature routes import shared services; services do not import route modules or the startup entry.
Keep routes registered before the JSON 404 and centralized error handlers. Player activity
routes must remain after the wake middleware. Keep full `/api/...` paths: auth, mission
tracking, and economy logs use those paths.

## Formatting and checks

Use **K&R braces**, four-space indentation, double quotes, and semicolons. No automatic formatter is configured.
Keep route declarations inline:
```ts
if (ready) {
    start();
} else {
    wait();
}

app.post("/api/admin/login", handle(async (req, res) => {
    // Handler body stays multiline.
}));
```

Document functions with this comment structure. Include `@param`, `@returns`, and `@throws` only when they apply.
When editing a function on a different calendar day, update its `Last Updated` date. Keep `Author: Jorge` and set `Last Updated By: Jorge`.

```ts
/*
 * DOCU: Briefly describe the purpose of the function
 * @param {dataType} paramName - Short description of the parameter's role
 * @returns {dataType} - Description of what the function returns (if applicable)
 * @throws {Exception} - List any possible exceptions (if applicable)
 *
 * Last Updated: YYYY-MM-DD
 * Author: Jorge
 * Last Updated By: Jorge
 */
```

Git history is the source of truth for when tracked code was last changed and who made the change. Use `git log -1 --format="%ad %an" --date=short -- path/to/file` for the latest file change, or `git blame path/to/file` for line-level history. Function comment dates are manually maintained and may not match the latest edit unless the editor updates them.

```sh
npm run build
npm run test:routes --prefix server
```

The route regression tests use database stubs and do not connect to Neon.
