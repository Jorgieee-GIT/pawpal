# PawPal source map

## Frontend

`client/src/App.tsx` coordinates the session, shared player state, navigation, and overlays.
Feature views receive typed props so changing tabs keeps the existing state lifecycle.

- `AuthScreen.tsx`, `AdoptionScreen.tsx`: sign-in, recovery, and adoption screens.
- `RoomPanel.tsx`, `RoomPets.tsx`: room controls, pet care, and visiting pet artwork.
- `FriendsPanel.tsx`, `PawPostcard.tsx`: friends and postcard presentation.
- `MarketPanel.tsx`, `WardrobePanel.tsx`, `OutfitWardrobe.tsx`: shopping and customization.
- `ArcadePanel.tsx`, `MiniGame.tsx`: arcade selection and shared mini-game UI.
- `shopCatalog.ts`, `gameCatalog.ts`, `PawIcons.tsx`, `types.ts`: shared catalogs, icons, and data contracts.
- `api.ts`, `hooks/useApiRequest.ts`: API base URL, authenticated requests, in-flight GET deduplication, and session expiry.
- Existing garden, kitchen, missions, and multiplayer components remain the feature entry points.

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

Use **K&R braces**, four-space indentation, double quotes, and semicolons.
Keep route declarations inline; `server/src/routes/` is excluded from Prettier to preserve this style:

<!-- prettier-ignore -->
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

```sh
npm run build
npm run test:routes --prefix server
```

The route regression tests use database stubs and do not connect to Neon.
