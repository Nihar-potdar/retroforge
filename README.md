# RetroForge

**Plan, check, and visualize a custom PC before buying the parts.**

RetroForge is an interactive 3D PC builder. Choose components from the catalogue,
check whether they work together, preview the assembled system, and save builds in
your browser.

[Open the live app](https://retroforge-iota.vercel.app/) · [Run locally](#run-locally) · [View the roadmap](#roadmap)

![RetroForge home screen](./docs/media/home.png)

## What you can do

- Build a PC with a CPU, GPU, motherboard, RAM, storage, PSU, and case.
- Explore the build in an interactive 3D viewport with orbit and zoom controls.
- Filter parts by compatibility and review warnings before installing a conflict.
- Start from a preconfigured gaming or workstation build.
- Save named builds to the browser and load them later.
- Use the builder on desktop or mobile in light or dark mode.

## Product preview

### 3D builder

![RetroForge compatibility-aware 3D builder](./docs/media/builder.png)

### Preconfigured systems

![RetroForge preconfigured systems](./docs/media/prebuilts.png)

## Compatibility coverage

RetroForge evaluates a candidate part before installation and rechecks the build
after each change.

| Check                                                                      | Current status                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| CPU socket ↔ motherboard                                                   | Working with a detailed warning                                                   |
| RAM generation ↔ motherboard                                               | Working with a detailed warning                                                   |
| GPU length ↔ case clearance                                                | Working with a detailed warning                                                   |
| Storage connector, protocol, and aggregate M.2/SATA capacity ↔ motherboard | Working with detailed warnings and installed-drive counts                         |
| PSU wattage ↔ estimated system load                                        | CPU power budget, GPU board power, per-drive allowances, and recommended headroom |
| Case ↔ motherboard form factor                                             | Working with a detailed warning                                                   |

Errors exclude candidates from the compatible filter and require an installation
override. Sizing and data warnings remain selectable and visible. Users may
deliberately continue past supported errors. Compatibility results
are guidance only and should be verified against the manufacturers' specifications
before purchasing hardware. See [power policy and catalogue sources](./docs/power-policy.md)
for the estimate, assumptions, and limits.

## Run locally

### Requirements

- Node.js 22.12 or newer
- npm (the repository uses `package-lock.json`)

```bash
git clone https://github.com/Nihar-potdar/retroforge.git
cd retroforge
npm ci
npm run dev
```

Vite will print the local address. Open it and select **Start Build**.

Vercel uses the same `npm ci` install command as CI, configured in
`vercel.json`. Keep `package-lock.json` updated whenever dependencies change;
do not add a second package manager's lockfile.

### Commands

```bash
npm run dev       # start the development server
npm run build     # type-check and create a production build
npm run lint      # run ESLint
npm run test:run  # run the Vitest suite once
npm run test:coverage # check coverage thresholds
npm test         # watch tests while developing
npm run preview   # preview the production build
```

## Current limitations

RetroForge is under active development. The main builder works, but these areas
are not finished yet:

- The catalogue and prices are static, limited sample data—not live market data.
- Power sizing uses stock CPU/GPU budgets and documented allowances for other
  parts. It does not check connectors, PSU fit, rail limits, transient compliance,
  or overclocking. Incomplete builds show partial estimates.
- Storage checks use aggregate port counts; shared lanes and exact slot layouts
  are not modelled.
- Not every catalogue part has a unique 3D model or exact physical placement.
- Saved builds live in `localStorage`, so they do not sync across browsers or
  devices and may be lost when browser data is cleared.
- The production build succeeds, but the 3D builder chunk is still large and
  triggers Vite's chunk-size warning.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **3D:** Three.js, React Three Fiber, Drei
- **State and validation:** Zustand, Zod
- **Routing and motion:** React Router, Motion, GSAP
- **Testing and deployment:** Vitest, Vercel

The main code lives in:

```text
src/
├── Logic/Compatibility/  # compatibility engine and rules
├── Pages/                # home, builder, prebuilts, and guides
├── components/           # 3D viewport and shared UI
├── data/                 # component catalogue and prebuilts
├── models/               # 3D model components
├── stores/               # Zustand state
└── zod/                  # saved-build validation
```

## Roadmap

- [x] Give every currently supported compatibility rule a detailed, actionable issue.
- [ ] Add cooler, fan, radiator, RAM-slot, M.2, SATA, and PCIe clearance checks.
- [x] Estimate selected-system power and recommend PSU headroom.
- [ ] Expand the catalogue, 3D model coverage, and regularly updated pricing.
- [ ] Add budget, performance, brand, and use-case filters.
- [ ] Add accounts, cloud saves, shareable links, and build comparisons.
- [x] Test compatibility, candidate selection, power sizing, and saved-build schemas in CI.
- [ ] Reduce the builder bundle size and improve accessibility.

The long-term goal is a builder that helps beginners understand each component
without hiding the technical detail experienced users need.

---

Built by [Nihar Potdar](https://github.com/Nihar-potdar).

### Builder experience and model pipeline

The phone builder uses an expanding Parts/Build dock around a persistent 3D
stage. Desktop panels remain available in Zen mode on hover, keyboard focus, or
edge-button activation. Help replays the first-visit welcome and optional tour.
The welcome is dismissed per browser under `retroforge.onboarding.v1`; saved
builds and quality preferences also remain local to the browser.

The field manual has 14 linked beginner/advanced guides. Camera buttons and
focused arrow/+/-/Home controls provide alternatives to dragging and pinching.
Use Tab/Shift+Tab, Enter/Space, and Escape for the rest of the site.

- `npm run models:optimize`: regenerate optimized model assets.
- `npm run models:measure`: inspect model bytes/geometry.
- `node tools/model-inventory.mjs`: refresh product-specific model coverage.
- `npx playwright install chromium firefox` then `npm run test:browser`: desktop,
  phone-sized, and Firefox interaction tests against a fresh production build.
- `npm run perf:browser`: compare production servers on ports 4174/4175 (or
  `BASELINE_URL`/`OPTIMIZED_URL`). See `docs/performance.md` for limitations.

See [model assets](docs/model-assets.md) for licences, fidelity, and placement.

Fresh builds and Reset select a Corsair 4000D Airflow and show a dismissible
starting-case message. Saved/prebuilt loads preserve their own case selection.
Case changes and all removals are immediate. Other parts use the original
exponential slide-in (speed 8), without fading or scaling; replacements remove
the old model immediately. Reduced motion skips entrances. Placement retains the
earlier calibrated source coordinates, including separate CPU and RAM models.

Desktop shows catalogue specifications, a saved-build bar, the selected-part
readout, and the installed-build panel by default. The 3D canvas is transparent
over the site theme, with the original grid and shadow-only floor.

OrbitControls receives a scoped DOM adapter that releases pointer capture only
when the canvas owns it. This prevents Firefox's invalid-pointer exception on
cancelled or stale pointer events without modifying the canvas's native methods.
Firefox DevTools may still report a missing source-map URL for Meshopt's embedded
WebAssembly; that diagnostic concerns debugger mapping, not model decoding.
