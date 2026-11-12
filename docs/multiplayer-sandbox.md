# Local multiplayer sandbox accounts

This creates two local-only accounts for testing PawPal multiplayer:

- `pawpal_test1` — cat pet
- `pawpal_test2` — dog pet

Both accounts have level 50 pets, 1 billion Paw Coins, full breed/color/cosmetic/furniture/theme inventories, all rooms unlocked, full kitchen supplies and recipes, completed mission progress, and an accepted friendship with each other. The script generates fresh passwords and prints them after a successful seed. It also clears any local admin restrictions on these two accounts so their multiplayer features are available.

## Requirements and safety

- Point `server/.env` at a local PostgreSQL database that has been initialized and migrated.
- The seed script refuses any database host except `localhost`, `127.0.0.1`, or `::1`.
- It also requires an explicit environment flag and command-line confirmation.
- Do not remove these guards or point the script at a hosted database.

## Seed or reset the sandboxes

In PowerShell from the project folder:

```powershell
$env:PAWPAL_ENABLE_SANDBOX_SEED = "YES"
npm run sandbox:seed
Remove-Item Env:PAWPAL_ENABLE_SANDBOX_SEED
```

The command creates or resets the two named users and their pet/inventory/mission fixture. Each run generates new passwords and invalidates previous sessions. Store the printed credentials only in your local test notes; do not commit them.

Sign into the two accounts in separate browser profiles to challenge each other. The fixture itself doesn’t start matches, claim rewards, or send messages.
