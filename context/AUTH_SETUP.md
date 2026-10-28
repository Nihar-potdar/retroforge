# Clerk and Neon setup

The integration is on `og-code`. The app runs in guest mode until a valid Clerk publishable key is configured. No Clerk application or Neon database was provisioned: this machine is not authenticated to those services. Do not put credentials in chat, source, screenshots, or commits.

## 1. Create and link the development Clerk application

Use your own terminal to run `npx -y clerk@latest auth login`, then create a new development application in the [Clerk dashboard](https://dashboard.clerk.com). Select **email verification codes** and **Google**; disable password authentication if enabled by default. Link the application with `npx -y clerk@latest init --app <app_id> --no-skills` (review any proposed scaffold changes; the code integration already exists). Alternatively configure the keys manually without rerunning initialization.

Create or edit an ignored `.env.local` privately using `.env.example` as the field reference. Do not overwrite an existing environment file. Use the same Clerk application for frontend and API:

| Variable                     | Where used                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Public browser configuration, embedded at Vite build time                 |
| `CLERK_PUBLISHABLE_KEY`      | API middleware configuration                                              |
| `CLERK_SECRET_KEY`           | Server only; never prefix with `VITE_`                                    |
| `DATABASE_URL`               | Server only, Neon connection string with SSL                              |
| `CLERK_AUTHORIZED_PARTIES`   | Comma-separated exact frontend origins, without paths or trailing slashes |

For local development use `http://localhost:5173,http://127.0.0.1:5173` as authorized parties. Clerk email and Google methods are dashboard settings, not frontend toggles. Production Google OAuth requires production credentials configured through Clerk.

## 2. Create the Neon database and apply the migration

Create a dedicated project in the [Neon console](https://console.neon.tech). Use a development branch/database for local work and previews. Copy its connection string privately into `DATABASE_URL`; choose a database region close to the Vercel function region.

With Node 22.12+ (22.x) and npm installed:

```sh
npm ci
npm run db:migrate
npm run dev
```

The migration creates `saved_builds` and its owner index. It is transactional and repeatable. Run it explicitly against the intended database; application startup and builds never apply migrations. `npm run dev` starts Vite on 5173 and the API on 3000. If credentials are missing, the API returns a configuration error rather than terminating the frontend. `npm run dev:web` starts the frontend alone.

Browser saves use the existing `retroforge.savedBuilds` key. Sign-in does not upload them. **Import browser builds** asks before copying and preserves originals; retries skip previously imported source IDs for that account. Cloud errors retain the draft and build-name input. Saved builds are independent snapshots; repeated normal Save actions create distinct snapshots.

## 3. Configure Vercel

Use Vite framework settings with `npm ci`, `npm run build`, and `dist` output as supplied by `vercel.json`. The `api/[...path].ts` function handles `/api/builds` and nested routes alongside static frontend assets. Set all five variables separately for the intended Vercel environment. Redeploy after changing the browser publishable key because Vite embeds it at build time.

For previews, configure the exact preview frontend origin in `CLERK_AUTHORIZED_PARTIES`; do not use a wildcard. Keep preview data in a development Neon branch. For production, configure a claimed production Clerk instance, production keys, production Google credentials and allowed domains, a production Neon database, and the production frontend origin. Apply the migration before enabling cloud saves.

The existing GitHub Pages workflow only hosts the public static app; it does not host this API. Leave Clerk keys absent there to retain guest/browser-save mode. No deployment, push, or change to `main` is part of this integration.

## 4. Verify

```sh
npm run lint
npm run build
npm run test:auth
npx -y clerk@latest doctor
```

Automated tests cover real Clerk RSA JWT verification with local test keys, API ownership enforcement, input validation, guest persistence, failed saves, stale account responses, explicit imports, and redirect-draft expiration. API tests inject an in-memory repository; they do not prove a live Neon connection or actual database transaction behavior.

After configuring credentials, manually verify email-code and Google sign-up/sign-in, profile management, sign-out, hash-route return, guest draft restoration, desktop/mobile headers, cross-device save/load/delete, repeated imports, and account isolation with two separate accounts. Check compatibility warnings still gate loaded snapshots and multiple identical drives keep their instance IDs. The browser was unavailable during implementation, so visual and live-service verification remain pending.

## Implementation boundaries

Private snapshots are owned by Clerk user ID, never email or client-supplied ownership. There is no client database access, organization support, sharing, autosave, or rename/update API. Deleting a snapshot is permanent. Account deletion currently does not purge database rows automatically; a future verified Clerk webhook or operator cleanup is needed for that lifecycle. Sign-out clears private frontend state without deleting cloud or browser saves.
