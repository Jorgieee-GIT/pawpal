# PawPal

PawPal is a cozy virtual pet game about looking after a companion, making a home, and playing with friends. Adopt a pet, keep it happy, decorate its rooms, grow flowers, cook recipes, collect items, and try the arcade games. You can also add friends, send postcards, and challenge them in Paw Brawl.

## For players

Create an account with a username and password. PawPal does not ask for an email address or phone number. Pick a nickname you are comfortable sharing because friends use your username to find you.

Each account can adopt one pet. Choose its species carefully because that choice is permanent. You can customize your pet's look later.

### What you can do

- Care for your pet and watch it grow.
- Decorate your rooms and customize your pet.
- Grow flowers, discover recipes, and collect items.
- Play arcade games and challenge friends in Paw Brawl.
- Add friends and send postcards.

## Project access

PawPal's source code is private and is not offered as open-source software. Viewing or working with this repository does not grant permission to copy, modify, redistribute, or publish the code. Contact the project owner for permission.

## Run locally

These instructions are for the owner and invited collaborators. You will need Node.js, npm, and a PostgreSQL database.

1. Install the dependencies from the project folder:

   ```sh
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Create `server/.env` with your local database connection and a private session secret:

   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/pawpal
   JWT_SECRET=replace-this-with-a-long-random-secret
   ```

3. Initialize the database from the consolidated `database/schema.sql`, then start the client and server:

   ```sh
   npm run db:init --prefix server
   npm run dev
   ```

   `database/schema.sql` is the checked-in SQL source for setting up the current database structure. The local migration folder is excluded from Git.

4. Open [http://localhost:5173](http://localhost:5173).

For a hosted deployment, configure the frontend's `VITE_API_URL` to point to the backend and set production secrets on the server. Never commit `.env` files or real credentials.

## Project

PawPal is built with React, TypeScript, Vite, Express, and PostgreSQL. The frontend is in `client/`, the API is in `server/`, and the database setup is in `database/schema.sql`.

The [architecture guide](docs/architecture.md) describes the source layout and development checks.
