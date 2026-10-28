# Clerk authentication implementation and review log

Review started: 28 October 2026. This is the single working record for the current authentication and cloud-save implementation. It documents code inspected and actions observed; it is not a claim that every possible authentication failure has been eliminated.

## Provenance and responsibilities

The Clerk implementation was already present as uncommitted changes when this review began. Its original implementation agent runs outside the reachable agent tree. Changes described as **baseline** below were inferred from the working tree and Git diff, not witnessed being authored. Files may continue changing concurrently.

The coordinating agent assigned three roles: `auth_repair` owns production fixes, `auth_audit` owns independent scenarios and audit tests, and `auth_documentation` owns this file. Findings go from audit to repair, then back to audit for verification. No deployment, commit, Clerk dashboard configuration, or production database change is implied by this record.

## Architecture and data flow

The project remains a React/Vite application, not a Next.js migration. Clerk React manages account UI and session tokens; an Express API verifies sessions through Clerk Express. Neon’s serverless SQL client persists owner-scoped saved-build snapshots in PostgreSQL. This implementation does not use Prisma.

1. `src/main.tsx` wraps the application in `AuthProvider`. Without a plausible configured publishable key, the app uses the default guest account context.
2. Account controls open Clerk sign-in/sign-up modals and preserve the active build in a ten-minute, one-use `sessionStorage` draft for redirect flows.
3. `SessionBridge` exposes loaded/user/token state. Moving away from an authenticated user clears the active build, compatibility issues, and redirect draft. Build-page UI also clears pending installation, preview, and build name.
4. Guests read and write `retroforge.savedBuilds` in browser `localStorage`. Signed-in users list/create/delete cloud saves using `/api/builds` with a bearer token obtained from Clerk. Browser originals remain on the device.
5. Browser-to-cloud import requires an explicit UI confirmation. Requests are chunked at 100 builds. The database assigns new UUIDs and deduplicates imports by `(user_id, source_id)`.
6. The API derives owner identity from Clerk, validates request data with Zod, and delegates to parameterized SQL. List/delete queries include the owner. Client-supplied owner fields are not authoritative.
7. `useSavedBuilds` scopes data to account identity, aborts pending requests on account changes/unmount, and serializes cloud mutations. A prior account’s late response must not populate the next account’s displayed saves.

Baseline API surface: `GET /api/builds`, `POST /api/builds`, `POST /api/builds/import`, `DELETE /api/builds/:id`. There is no update, public-sharing, pricing-verification, or account-deletion cascade endpoint in the inspected implementation.

## Baseline file inventory

| File | Purpose and observed change |
| --- | --- |
| `src/auth/AuthProvider.tsx` | Clerk provider/theme, session context bridge, active-build isolation and redirect restoration. |
| `src/auth/runtime.ts` | Typed account context and guest fallback. |
| `src/auth/AccountControls.tsx` | Guest/loading states, sign-in/sign-up, signed-in user menu. |
| `src/auth/draft.ts` | Preserve, validate, expire, restore once, or discard redirect drafts; tolerates unavailable storage. |
| `src/hooks/useSavedBuilds.ts` | Guest/cloud persistence, scoped remote state, cancellation, mutation lock, import and retry. |
| `src/lib/cloudBuilds.ts` | Bearer-authenticated fetch adapter, response parsing and error messages. |
| `src/zod/cloudSchema.ts` | Create/import validation; trimmed names of 1–120 characters, imports of 1–100 snapshots. |
| `src/zod/buildSchema.ts` | Existing runtime schemas reused for build snapshots and response validation. |
| `src/components/SaveStatus.tsx` | Persistence location, busy/error/retry state and explicit import action. |
| `src/Pages/BuildPage.tsx` | Replaces inline local-only save state with shared hook; save/import/delete feedback and account-change cleanup. |
| `src/Pages/build/MobileBuildPanel.tsx` | Busy-state disabling and accessible delete labels for mobile save controls. |
| `src/components/NavBar.tsx` | Adds account controls; adjusts narrow-layout space. |
| `src/Pages/PreBuilts.tsx` | Adds account controls to its separate header and adjusts narrow layout. |
| `src/Pages/Home.tsx` | Gives Load Builds a `/build?panel=build` destination; related navigation change. |
| `src/main.tsx` | Application auth wrapper; theme initialization remains before render. |
| `src/index.css` | Imports Clerk shadcn theme CSS. |
| `server/app.ts` | Injectable Express app; Clerk identity, validation, size limit, API routes and sanitized errors. |
| `server/repository.ts` | Typed owner-scoped Neon SQL repository; create/list/delete/import. |
| `server/migrations/001_saved_builds.sql` | Saved-build UUID primary key, non-null owner/name/build, name-length check, source deduplication and owner/creation index. |
| `server/migrate.ts` | Applies the initial migration in a transaction from the configured database URL. |
| `server/dev.ts` | Starts API on loopback port 3000. |
| `server/server.js` | Old Hello World Express entry removed. |
| `api/[...path].ts` | Vercel API entry; returns 503 when required server configuration is missing and lazily initializes app/repository. |
| `.env.example` | Variable-name template with placeholders only. |
| `.gitignore` | Allows the example env file; ignores Clerk local metadata. Existing secret-ignore rules remain relevant. |
| `vite.config.ts` | Proxies development `/api` requests to the local API. |
| `vercel.json` | Vite/npm build configuration and output directory. |
| `tsconfig.server.json` | Strict no-emit server/API/server-test type checking. |
| `package.json`, `package-lock.json` | Clerk/Neon/Express typing and test tooling, combined dev/API/migration/auth-test scripts, Node 22 and npm declaration. |
| `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Removed in the baseline package-manager consolidation. |
| `.github/workflows/deploy.yml` | Node changes from 20 to 22. |
| `eslint.config.js` | Ignores generated coverage, test results, and local database artifacts. |
| `src/data/type.ts` | Removes a stray `3` after the case type; incidental correction present in baseline. |
| `tests/server.auth.test.ts` | Baseline API authorization/validation/import tests and real Clerk verifier tests with locally generated signing keys. |
| `tests/savedBuilds.test.tsx` | Baseline hook/draft tests using jsdom and mocked fetch/account context. |

Unrelated preexisting directories such as `.impeccable/`, `.taste-skill/`, and `context/` are not attributed to auth implementation. This document does not inventory secrets or local database contents.

## Configuration, migration and deployment

Required configuration names: `VITE_CLERK_PUBLISHABLE_KEY` (browser/build-time), `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, and `CLERK_AUTHORIZED_PARTIES` (server). Only the publishable key belongs in frontend configuration. Never prefix server secrets with `VITE_`. Authorized parties is a comma-separated list of permitted frontend origins. Configure real development/preview/production origins deliberately; do not copy a development origin list into production.

Baseline workflow: install using `npm ci` on Node 22, configure private environment variables, run `npm run db:migrate` against the intended database, then run `npm run dev` locally. The API uses port 3000 and Vite proxies `/api`; `npm run preview` serves built frontend assets and does not start the API. Build checks use `npm run build`; audit checks use `npm run test:auth` and `npm run lint`.

The migration uses `CREATE TABLE/INDEX IF NOT EXISTS`; this is an initial-schema script, not a general schema-version migration framework. Its existence does not prove it has run on any deployed database. Deployment also requires confirming the hosting function routing, matching Clerk environments/keys, allowed origins, and reachable database configuration. These operations must be recorded separately if performed.

## Verification matrix

Final local review evidence: `npm run test:auth` passed **25/25 tests across four files** (10 baseline tests, seven independent API audit tests, eight independent frontend audit tests). API tests use local HTTP listeners; the approved unrestricted run was required because sandbox loopback listeners produced `EPERM`. This is not a live Clerk/browser/database certification.

| Scenario | Baseline mechanism/evidence | Review status |
| --- | --- | --- |
| Anonymous list/create/delete/import | Injected-identity exact-route tests assert 401 and no repository calls | Passed |
| Signed, forged, expired, wrong-authorized-party tokens | Actual Clerk verifier with local RSA keys; malformed/unsigned/future/pending/missing-user cases also tested | Passed locally; not hosted Clerk login or revocation |
| Cross-user list/delete and spoofed owner fields | In-memory owner isolation; parsed-input assertions; production SQL inspected for owner conditions | Passed fixture tests; real SQL unverified |
| Malformed JSON, invalid snapshots/names, large bodies | Zod, 1 MB limit, malformed and excessive/partially invalid imports | Passed |
| Duplicate imports and per-owner deduplication | Baseline fixture tests; production uniqueness/transaction inspected | Passed fixture tests; actual DB constraints unverified |
| Guest local saves and explicit retained-original import | Mocked-fetch hook tests; rapid save/save and save/delete regression tests; blocked storage | Passed |
| Late responses during account changes | Stale list and save completion tests, abort assertion and serialized writes | Passed tested sequences; full UI/browser account switch unverified |
| Signout, active build clearing, session-loading transitions | SessionBridge/BuildPage cleanup inspected; incomplete-discovery persistence guard tested | Guard passed; full provider-driven UI transition unverified |
| Token expiry/network/database errors and retry | Null client token prevents fetch; refreshed-token retry; sanitized repository-error and write-failure tests | Passed tested error paths |
| Missing configuration and asset/API deployment routing | API configuration gate and hosting configuration inspected | Inspection only; deployed behavior unverified |
| CSRF/origin policy | Simple cross-origin text/form writes rejected, no allow-origin header; token authorized-party verifier tests | Passed tested cases; cookie/revocation/live-browser CSRF coverage incomplete |
| Secret leakage and SQL safety | Exception response/log tests; production parameterized queries inspected | Error redaction passed; no exhaustive secret scan or DB integration claim |
| Actual sign-in/signup/OAuth/MFA/session revocation across devices | Requires configured live Clerk instance and browser session | Not verified in this record |

## Findings and repairs

Baseline code is not assumed secure merely because it exists or because test files exist.

| Finding | Repair reported by repair agent | Verification |
| --- | --- | --- |
| **Medium: data integrity/UX.** Two guest save/delete actions before React rerender could use a captured browser array, losing a new save or resurrecting deleted data. | `src/hooks/useSavedBuilds.ts` now reads current browser storage at mutation time. Storage persistence still occurs before updating React state, so storage failure cannot produce a false successful state. | Auditor regression tests passed for save/save, save/delete, and blocked storage. |
| **Medium: data integrity/UX.** Opening a same-page login modal preserved a draft that could overwrite edits made after opening the modal when login completed. | `src/auth/draft.ts` tracks whether the current page preserved the draft. Same-page restore consumes the stale snapshot while retaining the live builder; an actual page reload resets the module flag and permits valid redirect restoration. | Auditor tests passed for retaining subsequent edits and restoring valid/ignoring expired or malformed redirect snapshots. |

Baseline verification reported by the coordinator: `npm run build` passed client/server TypeScript and Vite; the existing large-builder-chunk warning remains. `npm run lint` passed. The auditor's first `npm run test:auth` attempt hit sandbox `listen EPERM 127.0.0.1`; its approved unrestricted rerun passed all 10 baseline tests. This was an execution-environment restriction, not five confirmed application failures. Expanded audit results follow below.

Final verification: auditor independently reported all 25 tests passing after the two fixes and `npx eslint tests/auth.audit.test.ts tests/savedBuilds.audit.test.tsx` passing. Coordinator reran `npm run build` and `npm run lint` after those fixes; both passed. Vite still warns about the large builder chunk. Build execution regenerated tracked `dist/index.html` and generated dist assets; these are build outputs, not additional auth feature changes.

The independent audit added `tests/auth.audit.test.ts` (seven API/verifier checks) and `tests/savedBuilds.audit.test.tsx` (eight hook/draft regression checks). The repair agent changed only `src/hooks/useSavedBuilds.ts` and `src/auth/draft.ts`. No additional production defect was confirmed in this bounded review.

## Limits and open decisions

- Browser originals are device-local and remain available to later users of the same browser profile. Explicit import permits copying them to a chosen account; it does not establish who originally authored them.
- Saved builds contain client-provided component/price snapshots validated for shape. They are not authoritative catalogue or purchase-price records.
- The inspected API has no application-level account quota/rate limiter, pagination, or account-deletion cleanup. These must be assessed against the intended release scope.
- No production security guarantee follows from local tests. Live Clerk flows, actual database behavior, deployed origin/routing behavior, accessibility, and browser-device coverage require their own evidence.
- The existing GitHub Pages workflow uploads only `dist`, so it cannot host the new Express/Vercel API. Cloud saves need a server-capable deployment. Documentation flagged this difference to audit; deployed behavior remains unverified.
- API `Cache-Control: no-store` is set after the authenticated-owner check, so unauthenticated 401 responses do not explicitly receive that header. No private data leak was demonstrated; an explicit no-store policy for all auth/API failures remains a hardening gap.
- There is no live Clerk sign-in/signup/OAuth/MFA, session-revocation, cookie-flow, or browser integration evidence from this review. The local JWT tests exercise the installed verifier, not the hosted Clerk lifecycle. No real PostgreSQL migration/query or deployed hosting behavior was verified.

## Observed process log

1. Coordinator inspected the current worktree and found the ongoing Clerk/cloud-save implementation. The original implementation agent was not reachable through this session's agent tree.
2. Coordinator created a repair agent, independent audit agent, and this documentation role. Documentation requested reproducible results and explicit limitations from both peers.
3. Documentation inspected auth/frontend/backend/test code, environment variable names from `.env.example`, and tracked diffs. No `.env` secret values or local database contents were read by this role.
4. Created this file as the baseline architecture/change inventory and pending verification record. Subsequent entries will capture actual findings, repairs, and verification evidence.
5. Coordinator reported baseline build and lint passing. Auditor reported the approved baseline test rerun passing 10/10 after loopback listener restrictions blocked the sandbox attempt. Documentation flagged static GitHub Pages hosting versus server API requirements to audit.
6. Repair agent reported fixes to guest mutation freshness and same-page login draft restoration, and requested auditor regression tests. Documentation inspected the resulting files and recorded verification as pending rather than assuming the fixes passed.
7. Repair agent reported an intermediate approved auth-test run passing 17/17; the initial restricted run failed local-listener tests with `EPERM`. Auditor then added the frontend regressions and reported 25/25 across four files passing, including both fixes.
8. Coordinator reran build and lint after the repairs; both passed. Documentation finalized the matrix with executed-test versus inspection/live-service distinctions and retained release gaps explicitly. No commit or deployment was performed by this documentation role.

## Follow-up debugging with the installed Clerk skills — 28 October 2026

The current entry point had acquired a second `ClerkProvider` inside `AuthProvider`. A new startup integration test using the real installed Clerk React SDK reproduced its runtime exception: “You've added multiple <ClerkProvider> components in your React component tree.” Type checking and the existing 25 tests passed without detecting this entry-point failure.

Removed the redundant provider from `src/main.tsx` and moved `afterSignOutUrl="/"` onto the existing provider in `src/auth/AuthProvider.tsx`. Added three startup regression cases in `tests/auth.startup.test.tsx`: absent key, placeholder key, and configured key. Only the unrelated application content and stylesheet are mocked; provider wiring and the SDK remain real. These checks do not complete a hosted Clerk sign-in.

The newly installed skill example applications also caused six ESLint errors. Excluded `.agents/skills/**` from application linting. Local configuration presence and browser/server publishable-key equality were checked without printing their values; this does not verify credential validity or database connectivity.

Follow-up verification passed: `npm run test:auth` (28 tests across five files), `npm run lint`, and `npm run build`. The existing large-chunk build warning remains. API tests required permission to bind local listeners. No live Clerk sign-in, database mutation, or deployment was performed in this follow-up.
