## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps
## Read the project context before meaningful changes

Before planning or making any meaningful change to this project, read
[`context/OG_CODE_ARCHITECTURE.md`](context/OG_CODE_ARCHITECTURE.md) in full.
This requirement applies to new tasks and when resuming work after losing
conversation context.

The reference explains file and function responsibilities, imports, state
ownership, callback flows, compatibility behavior, persistence, 3D rendering,
dormant code, and existing limitations. Do not rely on filenames or comments
alone when deciding how a feature works.

Confirm the current branch and inspect the affected implementation before
editing. The reference was initially audited against `og-code` at `deaace8`;
do not assume another branch has the same architecture. Current source wins
when it conflicts with documentation.

When a meaningful change alters function purposes, data contracts, dependencies,
state ownership, routes, persistence, validation, rendering, or tooling, update
the relevant context sections and indexes in the same change.

Update `context/progress-tracker.md` after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.