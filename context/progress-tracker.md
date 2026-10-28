# Progress Tracker

Last updated: 28 October 2026. This is the current implementation and decision record for `auth-testing`. Update it after each meaningful change and record completed behavior separately from planned work. Never put credentials, database connection strings, session tokens, or claim URLs here.

## Current Phase

Polish the sign-in and saved-build interface on the existing RetroForge builder, preserving its current product behavior and visual identity.

## Current Goal

Make sign-in easy to find, explain browser versus account saves clearly, make saved builds large enough to recognize and reopen easily, and provide visible confirmation after a successful save. Keep enough space for the builder itself. Use the supplied frontend/design-taste/Impeccable/Clerk guidance and independent agent review/tests.

## Context Read and Source of Truth

- Reread the full supplied context set for this pass: `AGENTS.md`, `project-overview.md`, `architecture-context.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, `AUTH_SETUP.md`, this tracker, and all of `OG_CODE_ARCHITECTURE.md`, including appendices A–D. Also checked `docs/auth-implementation-log.md`, current auth/save/API source, the migration, and recent Git history.
- Current source and the detailed OG reference establish what actually exists. The original OG audit describes `og-code` at `deaace8`; current authentication additions and native-Node corrections live on `auth-testing`.
- `architecture-context.md`, parts of `code-standards.md`, and `ui-context.md` describe an unimplemented or future stack: Prisma, Liveblocks/React Flow, Trigger.dev, Vercel Blob, Next-style server components, and a cyan dark-only theme. Those are **not delivered architecture or an instruction to migrate this scoped UI pass**. The running app uses Vite/HashRouter, Zustand, Express, Neon SQL, Three.js, and the existing orange light/dark tokens in `src/index.css`.
- Some prose in `AUTH_SETUP.md` and baseline OG sections predates service configuration, branch creation, and deployment. Treat those passages as historical setup/baseline evidence; use the current decisions and verification below when resuming. Keep the relevant reference sections/indexes synchronized when implementation changes their contracts.

## Completed Work

### Original-code preservation and branch separation

- Audited the original application and recorded file/function ownership, imports, compatibility flow, state, persistence, 3D rendering, dormant scaffolding, and known limitations in `OG_CODE_ARCHITECTURE.md`.
- Created `auth-testing` from the original-code baseline and pushed the authentication work there. This work did not modify `main` or advance the preserved `og-code` branch.
- Relevant commits: `a1f157b` (Clerk and private Neon cloud saves), `75593b6` (native Node ESM deployment correction), and `2810586` (successful deployed API verification record). Subsequent UI work must remain on `auth-testing` unless the user requests another branch.

### Clerk integration

- Retained the React/Vite SPA and existing `HashRouter`; no Next.js or React Router framework conversion.
- Added one `AuthProvider` around the app, Clerk sign-in/sign-up modals, shared account controls in all header variants, and profile/sign-out controls. Missing or placeholder publishable configuration leaves the public app usable in guest mode.
- Kept Clerk's shadcn appearance theme and mapped its colors/type/corners to existing RetroForge tokens. A duplicate nested Clerk provider was removed; real-SDK startup tests cover missing, placeholder, and configured keys.
- Preserved the current logical build during authentication redirects through a validated, one-use `sessionStorage` draft with a ten-minute expiry. Same-page modal completion retains newer live edits instead of restoring an older snapshot. Redirects return to the originating full hash URL.

### Guest and cloud saves

- Extracted persistence ownership from `BuildPage` into `useSavedBuilds`; `BuildPage` still owns builder actions and the compatibility confirmation transaction.
- Guests keep named snapshots in `localStorage['retroforge.savedBuilds']`. Reads validate with Zod and do not overwrite malformed data merely by mounting. Guest mutations read the latest storage state and persist before reporting success, preventing stale rapid-save/delete updates and false success on blocked storage.
- Signed-in users list/create/delete private cloud snapshots. Browser and cloud collections stay separate; API failures retain the current build and name input.
- Added explicit, confirmed browser-to-account import. Originals remain on the device. Imports use batches of at most 100; each database batch is transactional and deduplicated by verified user/source ID so partial-import retries are safe.
- Added scoped request state, cancellation, mutation serialization, and identity checks before/after token acquisition. Late A → B → A responses cannot repopulate another account's collection. Sign-out/account switches clear private build/issues and pending builder UI; guest → account retains the active draft.
- Enabled the landing page's Load Builds action through the existing builder route/query contract.

### API and database

- Replaced the unused Hello World listener with an Express application factory, a local API listener, a Vercel catch-all function, and a typed Neon repository.
- The API verifies Clerk sessions and derives ownership from the verified Clerk user ID. Every list/delete query is owner-scoped; client owner fields are not authoritative.
- API surface: `GET /api/builds`, `POST /api/builds`, `DELETE /api/builds/:id`, and `POST /api/builds/import`. Shared Zod schemas validate requests, names are trimmed to 1–120 characters, request bodies are limited, and errors are sanitized. Unknown/unowned delete IDs return the same not-found response.
- Applied the initial `saved_builds` migration to the user's now-verified Neon database. It stores UUID, owner ID, name, full build JSONB, server creation time, and nullable browser source ID, with primary key, per-owner import uniqueness, and an owner/creation index.

### Tooling and deployment

- Standardized on npm/package-lock and removed stale pnpm files to prevent Vercel frozen-lockfile failures. Declared Node 22.x and updated the existing Pages CI Node version.
- Added local frontend/API startup, migration and auth-test scripts, strict server type checking, Vite's `/api` proxy to port 3000, safe environment template, Clerk-local ignore rules, and Vercel build configuration.
- Fixed the deployed `ERR_MODULE_NOT_FOUND` crash: native Node ESM needs explicit `.js` relative imports through the API/server/shared-schema closure. `tsconfig.server.json` now uses `NodeNext` module and resolution so extensionless server imports fail checking. The frontend retains bundler resolution.
- Builds/migrations are separate: the app/build never silently migrates a database. GitHub Pages remains static-only and does not host this cloud-save API.

## Architectural Decisions and Invariants

| Decision | Reason / constraint for future changes |
| --- | --- |
| All browsing, guides, presets and builder routes remain public | Authentication adds private cloud persistence; it does not gate learning/building. |
| Clerk handles identity; the server enforces snapshot ownership | Hiding controls in the browser is not authorization. Do not trust submitted user IDs or email ownership. |
| Save full product snapshots using the existing `SavedBuild`/`BUILD` contract | Preserve installed-drive instance IDs and original saved specifications. A snapshot is not an authoritative retailer quote. |
| Normal Save appends an independent snapshot | No rename/update/autosave behavior is implied. Duplicate names remain possible. |
| Save/load does not strengthen or bypass compatibility policy | Load must keep `BuildPage.installIfCompatible` and its success continuation. Deliberate incompatibility overrides remain possible. Existing boolean-rule/manual-storage gaps are documented, not fixed by this UI pass. |
| UI success follows completed persistence | Failed or cancelled requests must not clear the draft/name or claim the build was saved. |
| Import is explicit and retains browser originals | Sign-in never silently uploads or merges a browser's collection. Source IDs deduplicate imports, not ownership. |
| Global build, stored issues and page UI have different owners | Store replacement does not recompute compatibility automatically. Account transitions must clear the appropriate state together. |
| Exactly one builder Canvas remains mounted | Responsive save/sign-in UI must not duplicate the WebGL scene, model loaders, or subscriptions. |
| Preserve the incumbent visual world for this polish | Use actual current typography/tokens and provide larger readable save affordances without adopting the contradictory future-theme scaffold. |
| Server ESM and browser bundling have distinct requirements | Keep `.js` specifiers and NodeNext checking for server runtime dependencies. Do not fix Node imports by migrating the frontend stack. |
| Private configuration stays private | Only `VITE_CLERK_PUBLISHABLE_KEY` is browser configuration; no server secret gets a `VITE_` prefix. Commit only placeholders in `.env.example`; exclude private env, local DB, claim files and scratch artifacts. |

## Verification Recorded So Far

These are executed observations from the authentication work; they are not claims that the new UI polish has passed checks yet.

- Build, lint, and **28 auth tests across five files passed** before this polish pass. Tests cover real Clerk RSA verification with local test keys, API ownership/input boundaries, guest persistence, import behavior, stale responses, failed writes, redirect drafts, and real-SDK provider startup.
- An emitted-JavaScript API import succeeded under native Node without tsx after the ESM correction.
- Local Clerk audit verified CLI linkage, live backend key acceptance, matching frontend/backend publishable keys, and the correct development-instance/domain relationship. Email/Google were enabled; password was also required, differing from the originally requested passwordless-email preference. No silent dashboard change was made.
- Local Neon audit first detected an example connection string. After the user corrected it privately, `SELECT 1`, schema/constraint/index inspection, and the real repository's read for a nonexistent diagnostic owner succeeded. No user snapshots were read during that diagnostic query.
- Local frontend/API startup was verified on 5173/3000. Vite can fall back to 5174 if 5173 is occupied; 5174 was not in the inspected local Clerk authorized-party list. Run one frontend/API pair and restart after private environment changes.
- Vercel Preview deployment of the corrected auth branch reached READY. Its protected CLI request to the stable branch `/api/builds` returned the expected anonymous **HTTP 401**, replacing the earlier HTTP 500 function crash.
- Preview publishable keys matched and the authorized-party list included the exact stable branch origin: `https://retroforge-git-auth-testing-nihar-potdars-projects.vercel.app`.
- Preview `DATABASE_URL` and `CLERK_SECRET_KEY` are assigned as sensitive variables and masked in CLI pulls. Failed checks against returned masking placeholders were discarded as inconclusive; do not report those as failed real credentials.

## Completed Locally — Save and Sign-in UI Polish

The following decisions are implemented and locally verified. UI commit `fdf42e9` was pushed to `auth-testing` and reached READY on Vercel; the stable Preview API returned the expected anonymous HTTP 401 after deployment. A real hosted signed-in account save roundtrip remains a separate check.

- Preserve the orange light/dark garage theme and existing type/token system. This is a scoped refinement, not adoption of the future cyan scaffold or a redesign of the rest of the site.
- Added shared `SignInAction`: a distinct 44px Sign in CTA, disabled during account discovery, reused in navigation and the save destination explanation. Clerk's prebuilt modal now names RetroForge and uses existing semantic colors/type and 44px fields/buttons; configured methods, one provider, draft preservation, and hash return are unchanged. Sign-up remains available inside the prebuilt flow.
- Added shared, expandable `SavedBuilds` with 290px-wide snapshot cards, 18px names, CPU/GPU summaries, computed part count/price including duplicate drive instances, and named Load/Delete actions. Newest snapshots appear first without mutating storage order. Saved navigation opens the collection on desktop/mobile; successful Save expands it and resets its horizontal position. Desktop content height is bounded and scrolls internally; long names clamp visually to two lines with full accessible text/title.
- Added durable destination-specific named success feedback and an exact-UUID Saved card badge only after persistence succeeds. The duplicate save toast was removed. Confirmation is scoped to the current owner and a snapshot still in the collection; account changes clear private confirmation/errors with other UI. Failures retain draft/name. Successful asynchronous saves clear the name only if the current trimmed input still matches the submitted name, preserving edits made during the request.
- Changed `useSavedBuilds.save` success output from boolean `true` to the actual `SavedBuild` for exact-ID confirmation. `false`/`undefined` still mean blocked/stale completion. Callers and tests use the new frontend hook contract; API routes and snapshot/database shape are unchanged.
- Reused the same cards/status inside the existing mobile build drawer and labeled its content section “Build and saves”; added a real name label/ref, `aria-invalid` and error-description links. Invalid names focus the currently visible composer. Local validation/save errors do not show a misleading refresh Retry; actual cloud-list errors retain Retry. Pending saves/imports/deletes disable their repeat controls. Existing compatibility-gated loading and one Canvas are preserved.
- Independent design review and test agents checked the scoped flow. Ten component UI tests plus three save-flow integration tests bring the suite to 41 tests across seven files; build/type checks/lint pass. The integration cases cover mobile Saved expansion, visible mobile validation focus/ARIA, and retaining the draft name without false success on blocked browser storage. Fresh Chromium guest save/confirmation/delete checks passed at 1440×900, 768×1024, 390×844, 320×812, and dark 1024×600, with no horizontal page overflow or JavaScript exceptions. Branded sign-in modals opened at 1440 and 390 widths. Narrow navigation clipping and short-desktop canvas collapse were fixed; desktop main content scrolls with a 340px viewport minimum.
- The bounded whole-builder inspector still reports incumbent outside-scope small labels, fallback fonts, and panel styling. The Impeccable detector returned two incumbent font/grid advisories. These are not represented as globally clean UI or new save-flow failures.

## Follow-up — Compact save destination

- User requested that save location take less space. Removed the permanent browser/cloud destination banner and its duplicate sign-in CTA; the main header remains the sign-in entry point.
- `SavedBuilds` now shows its count followed by a small parenthetical `(Account)` or `(This device)` in the heading. Location is metadata rather than a separate section.
- `SaveStatus` renders only actionable import, success, or error feedback inside the saved-build collection. Idle status takes no space; import appears when the collection is expanded. Pending activity stays inline in the collection heading. The larger cards, exact-ID Saved badge, persistent successful-save message, and validation/retry semantics remain intact.
- No persistence, account, API, schema, or compatibility behavior changed. Full regression suite remains 41 passing tests; build/lint passed. Fresh Chromium at 1440px and 390px confirmed the inline destination label, zero idle feedback rows, one visible Sign in CTA, and no horizontal page overflow.

## Next Up and Acceptance Checks

1. Save/sign-in UI commit `fdf42e9` is published and preview-deployed. Keep using the stable auth-testing alias; the deployed API startup/protection check passed with anonymous HTTP 401.
2. Complete a real hosted signed-in email/Google save/refresh/load roundtrip and account-switch/cross-device checks. Anonymous 401, local JWT tests, and guest browser checks do not prove that full hosted flow.
3. Preserve existing baseline inspector advisories as separate scope; reconcile the broader future-stack context before undertaking those unrelated architecture/design changes.

## Open Questions and Existing Limits

- Hosted email/Google login, account-switch UI, cross-device persistence, and signed-in preview save/load/refresh still need direct evidence.
- Confirm whether password authentication should remain required or move to the originally selected email-code-only-plus-Google flow. Dashboard settings were not changed during code/UI verification.
- No account-deletion database cascade, sharing, organizations, snapshot update/rename, autosave, application quota/rate limit, or pagination has been implemented. Those require separate scope decisions.
- Existing compatibility blind spots, fixed illustrative 3D models, and the large builder bundle remain documented limits; this polish is not a claim to resolve them.
- The broader context scaffold needs an explicit product/architecture reconciliation before implementing its future collaboration/AI/storage features. Do not treat unimplemented scaffold text as delivered capability.

## Session / Maintenance Rules

- Root `AGENTS.md` now makes full context reading and same-change progress/architecture updates discoverable to future project sessions.
- Confirm the branch and reread the complete supplied context before future meaningful changes or after losing conversation context; inspect affected current source as well.
- Update this tracker after each meaningful implementation change: what changed, why, state/contracts affected, checks actually run, and what remains unverified. Update the corresponding architectural descriptions/indexes in the same change when their responsibilities or contracts change.
- Preserve `main` and `og-code`; use `auth-testing` for the currently authorized work. Do not restore unrelated stashes or include `.local-db`, `.clerk`, `.taste-skill`, `.impeccable`, `test-results`, or private environment files in app commits.
- The implementation log and OG reference retain useful historical observations. Distinguish original audit results, later repairs, current deployed evidence, and current in-progress work when reading them.
