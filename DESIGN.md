---
name: RetroForge — Redline catalogue
description: Spacious hardware browsing and a focused charcoal PC workbench.
colors:
  accent: "#c82f1b"
  accent-hover: "#ac2414"
  accent-soft: "#f9e8e3"
  accent-dark: "#b52b19"
  selection-blue: "#2452ce"
  background: "#f4f4f0"
  surface: "#ffffff"
  sidebar: "#eaeae6"
  text: "#1b1c20"
  muted: "#575960"
  border: "#d5d5d1"
  dark-background: "#15171b"
  dark-surface: "#202329"
  dark-sidebar: "#191c21"
  dark-text: "#f3f3ee"
  dark-muted: "#b1b4bd"
  dark-border: "#3f434c"
  dark-accent: "#ff6d53"
  dark-accent-soft: "#392923"
  dark-accent-dark: "#ff8c74"
  success: "#247347"
  warning: "#8b5c14"
  danger: "#ba3228"
  dark-success: "#83d5a5"
  dark-warning: "#e8b966"
  dark-danger: "#ff837b"
typography:
  display:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(64px, 7.2vw, 104px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(40px, 4.1vw, 60px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Figtree Variable, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Figtree Variable, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Figtree Variable, sans-serif"
    fontSize: "13px"
    fontWeight: 550
rounded:
  control: "3px"
spacing:
  workspace: "12px"
  control: "16px"
  content: "24px"
  group: "32px"
  separation: "40px"
  section-mobile: "88px"
  section-desktop: "140px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  selected-tab:
    backgroundColor: "{colors.selection-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    width: "300px"
---

# Design System: RetroForge

## Overview

**Creative North Star: "Redline catalogue"**

A poppy hardware magazine with the character of retro console menus and racing graphics: condensed headlines, signal-red actions, electric-blue selections and real hardware photography. Broad neutral fields and generous gaps give each object and idea room.

Browsing starts on paper white; the builder starts on charcoal. An explicit saved or session theme choice takes precedence over these route defaults. Reading and operating surfaces share type and control geometry while keeping their own useful density.

**Key Characteristics:**
- Heavy condensed display type with clear, relaxed reading text.
- Spacious, flat composition and one clear primary action per decision group.
- Authentic hardware imagery with accessible provenance and honest example labels.
- Blue selected controls with a single clipped corner.

## Colors

Signal red supplies action, electric blue marks selection, and warm neutral surfaces carry the content. Frontmatter records the light and dark semantic values; implementation lives in `src/index.css` and `src/exhibition.css`.

### Primary
- **Signal Red** (`accent`): primary browsing and builder actions. Their solid red fill remains consistent across themes; hover uses `accent-hover`.
- **Theme Accent** (`accent`, `dark-accent`): focus, emphasis and theme-aware details; soft and dark companions support subdued fills and readable accent text.

### Secondary
- **Electric Blue** (`selection-blue`): selected learning choices, guide filters and builder categories. Also used for text selection.

### Neutral
- **Paper / White / Pale Grey** (`background`, `surface`, `sidebar`): page, photographic field and grouped secondary surfaces.
- **Charcoal / Panel / Rail** (`dark-background`, `dark-surface`, `dark-sidebar`): corresponding dark workspace layers.
- **Ink / Muted / Border** and their dark counterparts: reading hierarchy, supporting information and quiet separation.
- **Success / Warning / Danger** and their dark counterparts: semantic compatibility feedback. Preserve these meanings independently of decorative accent.

**The Action and Selection Rule.** Red initiates an action; blue identifies an active choice. Keep selected state available through native or ARIA state as well as color.

## Typography

**Display Font:** self-hosted Anton, sans-serif fallback. Use its real regular face for the condensed masthead and major headings.

**Body Font:** self-hosted Figtree Variable, sans-serif fallback. Use it for prose, controls, metadata, specifications and guide-card titles; the current mono utility also resolves to Figtree.

### Hierarchy
- **Display:** the frontmatter display role describes the desktop home masthead. Uppercase and balanced, with short lines. At phone widths it becomes `clamp(48px, 12vw, 76px)` with relaxed leading (1.14).
- **Headline:** condensed section headings; browsing-page titles and article titles use their own observed responsive clamps. Avoid repeating the masthead scale inside panels.
- **Title:** Figtree guide-card titles. Reading-section headings use Figtree bold (30px desktop, 27px phone).
- **Body:** articles use relaxed leading; explanatory copy is typically 16–19px with 1.6–1.8 leading. Keep explanations around 48–52 characters wide and article content within its 700px column.
- **Label:** 13–15px Figtree for controls and supporting information. Keep normal case and tracking for operational content. Prices use tabular figures.

**The Reading Voice Rule.** Use Anton for orientation and Figtree for explanations and decisions. Do not turn specification text into condensed display lettering.

## Layout

Use a shared fluid page inset (`clamp(22px, 5.5vw, 96px)`). Generous section separation is structural: major home sections use the recorded desktop/mobile section spacing, while content groups use the smaller spacing steps. Give headings, images and controls separate breathing room; avoid overlays that repeat nearby content.

Desktop browsing combines open image/text pairs with restrained galleries: three guide columns and two prebuilt columns. Guide galleries become two columns below 900px and one below 700px; prebuilts become one column below 700px. Hero text stacks below 900px, and part image/story pairs stack below 700px. Navigation switches to a disclosure below 900px. Choices wrap with visible gaps rather than shrinking labels.

Articles use a table-of-contents rail (250px) and reading column (up to 700px); the rail becomes an inline block below 800px. At desktop widths (1024px and above), the builder has a 320px catalogue, flexible stage and 300px summary, separated by the workspace spacing. Smaller builders use a dock and drawers with scrollable content and safe-area allowance.

**The Breathing Room Rule.** Resolve crowding by removing repetition and separating groups before reducing type or control sizes. Reveal secondary fit advice through an explicit disclosure.

## Elevation & Depth

Browsing cards and workspace panels are flat. Surface contrast, whitespace and occasional thin borders establish grouping. Preserve the white photographic stage even in dark browsing mode. Shadows belong to transient overlays: the mobile menu uses a soft shadow (`0 12px 35px #0003`), dialogs a deeper one (`0 24px 80px #0005`), and the bottom drawer an upward shadow (`0 -12px 40px #0003`).

Primary links move up slightly on hover; hardware receives one short arrival. Guide photography scales gently on hover. Feedback is brief, never continuous decoration. Respect the implemented reduced-motion override.

## Shapes

Controls, reading callouts and workspace panels share a restrained small radius (`rounded.control`). Selected learning and guide tabs have one clipped top-right corner (8px); clip their pseudo-background, leaving the interactive element and focus outline whole. Desktop builder category selection repeats that silhouette on its background layer. Preserve this detail for selection rather than applying angular cuts to every container.

Photos have clean rectangular fields. Mobile drawers and help dialogs retain their functional rounded silhouettes; they are exceptions to the small control radius.

## Components

### Buttons

Confident, readable and compact. Primary browsing buttons use the frontmatter fill, white text, small radius and generous horizontal separation from their arrow. Minimum height is 54px. Secondary actions use a neutral fill or a text link. Builder controls are smaller in type but retain 44px minimum height. Hover darkens primary red; keyboard focus uses a visible accent outline (3px) with space around it (5px).

### Choices and Filters

Neutral tabs have a small radius and clear gaps; selected tabs use blue, white text and the clipped background. Learning buttons are at least 48px high on desktop and 46px on phone. Keep all seven part choices accessible; show one educational part at a time. Guide filters follow the same selected-state grammar.

### Cards and Photography

Guide and prebuilt cards sit openly on the page, with generous image-to-text and card-to-card spacing. Use contained hardware imagery on white when showing individual parts; prebuilt scene images may fill their stage. Retain real titles, concise metadata and useful specification spacing. Hardware captions identify the example and offer an inspect action; the inspect dialog and footer expose author, source, licence and modifications. Source records live in `src/data/hardwarePhotos.json` and `docs/hardware-photography.md`.

### Inputs and Disclosures

Fields use a theme surface, quiet border, small radius and readable input type (16px). Search is fixed-width on desktop and fills available width on phone. Give every field a visible label. Native disclosures contain secondary fit checks, attribution and optional help, with a clear summary and comfortable hit area.

### Navigation

Use the condensed uppercase wordmark with its red period, Figtree navigation and a red underline for hover/current page. Keep utilities visually quieter than content actions. The phone menu uses native disclosure semantics; the builder uses a shorter header. Preserve keyboard focus and explicit current-page/pressed state.

## Do's and Don'ts

### Do:
- **Do** use the actual semantic theme variables and preserve explicit theme preferences.
- **Do** keep generous whitespace between content groups and maintain readable control sizes.
- **Do** pair real hardware images with accessible attribution and honest identity labels.
- **Do** keep keyboard focus whole when clipping a selected background.
- **Do** keep article content present without requiring scroll-triggered animation.

### Don't:
- **Don't** restore the superseded pistachio/forest palette or the crowded collage composition.
- **Don't** add repeated entry actions, image callouts or decorative labels that compete with the main decision.
- **Don't** imply example photography or illustrative 3D assets certify exact catalogue identity or physical fit.
- **Don't** add decorative grids, hard offset shadows or continuous background motion to the flat browsing surfaces.
