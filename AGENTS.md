# Project context and change records

Before planning or making a meaningful project change, read every Markdown file in `context/` in full, beginning with `context/AGENTS.md` and including `context/OG_CODE_ARCHITECTURE.md` and `context/progress-tracker.md`. Repeat this when resuming after losing conversation context.

Confirm the current branch and inspect the affected implementation. Current source and the current integration sections of the architecture reference establish delivered behavior; the other context files contain scaffold/planned-stack text whose status is documented in the tracker. Record discrepancies rather than silently migrating the app to match an unimplemented scaffold.

Update `context/progress-tracker.md` in the same change with meaningful decisions, architectural or data-contract changes, validation actually performed, and remaining limitations. Update affected architecture sections and file/function indexes when responsibilities, dependencies, state, persistence, routes, validation, rendering, or tooling change.

Respect the user's branch scope. Keep credentials, private environment files, local databases, Clerk claim files, and local review/test artifacts out of commits.
