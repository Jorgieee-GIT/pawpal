# PawPal browser QA

Run this when you want to check the website yourself. It uses Playwright and tests desktop, tablet, and phone layouts.

## One-time setup

From the project folder, install the QA browser runner and Chromium:

```sh
cd qa
npm install
npx playwright install chromium
cd ..
```

Start PawPal in another terminal with `npm run dev`, then run:

```sh
npm run qa
```

The public pass checks the welcome page, signup and login switching, policy modals, card sizing, and page overflow at three viewport sizes. It does not create accounts or submit forms.

## Optional signed-in pass

To also check the game, use a dedicated test account. Set `PAWPAL_QA_USERNAME` and `PAWPAL_QA_PASSWORD` in your shell before running `npm run qa`. The signed-in pass visits Room, Friends, Market, Wardrobe, Mini-games, Multiplayer, Lucky Garden, Kitchen, Missions, and Settings at desktop, tablet, and phone sizes. It inventories the visible buttons on each screen, checks that they have accessible labels, and saves a JSON report per screen size under `qa/test-results/`.

The report flags likely state-changing controls, such as purchases, reward claims, and messages, for review. It does not click those controls or modify game data. The inventory covers buttons visible in the screens the runner visits; it is not a static scan of every conditional button in the source code. Admin and Develop panels need separate admin credentials and are not included. Don't commit test credentials.

Set `PAWPAL_BASE_URL` if the client is running somewhere other than `http://127.0.0.1:5173`.

Playwright writes an HTML report to `qa/playwright-report` and failure artifacts to `qa/test-results`.
