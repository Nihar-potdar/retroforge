# RetroForge

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People planning a custom PC before buying parts. Beginners need to understand components and their relationships; experienced builders need access to technical detail.

## Product Purpose

Help users choose components, check compatibility, inspect the assembled system in 3D, and save configurations before purchasing hardware. Success means a user can understand and review a proposed build and its compatibility issues before spending money.

## Positioning

Combine compatibility-aware component selection, an interactive 3D assembly preview, and educational guidance in one planning workflow. Do not claim market uniqueness or verified physical fit beyond the checks actually implemented.

## Operating Context

Users can start a fresh build, customize a preconfigured system, or resume a named build saved in the same browser. The builder covers CPU, GPU, motherboard, RAM, storage, PSU, and case. Linked guides explain components and building concepts. Desktop and mobile are supported, with light and dark themes.

## Capabilities and Constraints

- Preserve compatibility guidance and improve its accuracy, coverage, and clarity as appropriate. Keep actionable warnings and disclose the limits of supported checks. Users can deliberately override compatibility errors after acknowledgement.
- Preserve local saved builds, preconfigured starting points, guides, onboarding/help, desktop/mobile support, theme choice, keyboard controls, and reduced-motion support.
- Load 3D models as fast as possible. Optimize transfer, decoding, and rendering while preserving useful model fidelity and keeping component selection usable during loading or asset failure.
- Use real models of hardware rather than hand-built Three.js lookalikes. This is a product requirement for future asset work, not a claim that the current catalogue meets it. Real assets must have appropriate redistribution rights and honest product identity/fidelity disclosures.
- Current assets are mostly illustrative fallbacks; storage currently uses schematic geometry. Do not present these as exact product models or verified mounting/clearance simulations. See `docs/model-assets.md` and `docs/model-coverage.json`.
- Static sample pricing is not a commitment to preserve. A future pricing source, update cadence, and market coverage remain undecided; never imply current prices are live.
- Saved builds currently use browser localStorage without cross-device sync. Accounts, cloud saves, and sharing are roadmap ideas, not shipped capabilities.
- Compatibility results are guidance, with manufacturer specifications remaining necessary before purchase. Power sizing uses documented assumptions; physical clearance and shared-slot coverage are incomplete. See `docs/power-policy.md`.

## Brand Commitments

Preserve the RetroForge name. No additional voice or visual direction was established during init.

## Evidence on Hand

- `README.md`: product workflows, current limitations, development commands, and roadmap.
- `src/Logic/Compatibility/`: implemented assessment rules and regression tests.
- `src/data/`: sample catalogue, preconfigured builds, and guide content.
- `docs/power-policy.md`: sizing assumptions, sources, and compatibility limitations.
- `docs/model-assets.md`, `docs/model-coverage.json`, and `src/models/assets.json`: asset provenance, coverage, and fidelity.
- `docs/performance.md` and associated benchmark JSON files: recorded performance work and measurement limitations; do not generalize these into unsupported performance claims.
- `docs/media/`: existing product screenshots and tour recordings.

No customer testimonials, independent fit certification, or live-market pricing evidence was established during init.

## Product Principles

1. Help users make informed component decisions before purchase.
2. Make compatibility issues understandable and actionable without hiding technical detail.
3. Use real hardware models with fast loading and honest fidelity disclosures.
4. Keep planning usable across desktop and mobile, including while 3D assets load or fail.
5. Preserve users' ability to save, resume, learn, and control the experience accessibly.

## Accessibility & Inclusion

Preserve keyboard operation, camera-control alternatives to dragging and pinching, reduced-motion behavior, and responsive desktop/mobile access. No formal conformance target beyond these existing commitments was established.
