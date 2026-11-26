---
name: html-artifact
description: >-
  Generate modern Claude-style pure HTML5/CSS/JS artifacts with zero React/npm/build steps.
  Supports Multi-Page Interactive Canvas & Figma-style Prototypes (separate editable
  pages/*.html loaded live into one clean sidebar-free canvas.html with flow arrows,
  clickable screen navigation, back history, and hotspot hints) plus Single-File HTML
  artifacts (doc.html, dashboards, decks). Use whenever the user asks for an app design,
  multi-screen prototype, Figma-like flow, website, interactive doc, report, or dashboard.
---

# HTML Artifact & Multi-Page Prototype Canvas (`html-artifact`)

Pure **HTML5 + CSS + vanilla ES6 JS + inline SVG** — zero React, zero Vite, zero npm, zero external CDN dependencies. Works 100% offline on `file://` or `http://`.

---

## Mode Selection

### Mode A — Multi-Page Canvas & Interactive Prototype *(Default for apps, multi-screen UIs, websites, flows)*
Split screens into standalone editable HTML files and connect them in one clean, sidebar-free **Figma-style prototype canvas** (`canvas.html`):

```text
<project-dir>/
├── canvas.html          # Copy from ./templates/canvas.html (name-only artboards, flow arrows, prototype player)
├── pages-manifest.js    # Ordered screens, links, coords (works on file://, zero CORS)
├── tokens.css           # Copy & adapt ./design-tokens.css (edit once → updates all screens)
└── pages/
    ├── 01-home.html     # Standalone editable page (links ../tokens.css + Prototype Bridge)
    ├── 02-detail.html   # Standalone editable page
    └── 03-settings.html
```

**Steps for Mode A:**
1. Copy `./templates/canvas.html` → `<project-dir>/canvas.html`.
2. Copy & adapt `./design-tokens.css` → `<project-dir>/tokens.css` for the brief's palette.
3. Create each screen in `<project-dir>/pages/01-<slug>.html`, `02-<slug>.html`, etc., using `./templates/page-base.html` (keeping the Prototype Bridge `<script>` and `../tokens.css`).
4. Wire **Figma-style prototype links** inside pages:
   - Any clickable element that jumps to another screen: `data-goto="screen-id"` (optionally `data-flow-label="Tap card"`).
   - Any back button: `data-back`.
5. Generate `<project-dir>/pages-manifest.js` (or run `node <skill-dir>/scripts/sync-manifest.mjs <project-dir> --device=mobile|desktop` — auto-detects `data-goto` links into `links: [...]`).
6. **Built-in Canvas & Prototype capabilities (`canvas.html`)**:
   - Clean **no-sidebar** infinite canvas with **name-only** artboard headers (hover reveals reorder `←/→`, reload `↻`, open standalone `↗`, play from screen `▶`).
   - **Arrange vs. Interact** toggle + **Flows (`L`)** toggle for live curved SVG prototype arrows that update as you drag screens.
   - **▶ Prototype (`P`)**: Figma-style interactive player — click `data-goto` hotspots to navigate across screens with `← Back` history stack (`Backspace`), `Restart`, and click-outside **Hotspot Flash (`H`)**.
   - **Row / Grid / Fit (`F`)** layout + Zoom/Pan + **Reload (`R`)** + **Save** (`pages-manifest.js` export) + `localStorage` persistence.

### Mode B — Single-File HTML Artifact *(For 1-page docs, reports, specs, single dashboards, decks)*
Pick matching template in `./templates/`:
- Editorial doc / spec / explainer / report → `./templates/doc.html`
- Single-view dashboard / tool → `./templates/dashboard.html`
- Single-screen mobile showcase → `./templates/mobile-ui.html`
- Slide deck → `./templates/deck.html`

Inline all CSS (`<style>`) and JS (`<script>`) into one self-contained `.html` file.

---

## Design & Craft Rules (Both Modes)
1. Read `./design-tokens.css` and `./rules/design-rules.md` before writing UI code.
2. Ground palette, typography, and layout in the subject matter — never generic AI slop.
3. Zero placeholders (`// ... rest of code` forbidden). Every control, link, tab, and state must work.
4. Respect RTL (`dir="rtl"`) automatically when the user prompt is in Arabic.
5. **Delivery**:
   - File-based agents (Antigravity / Claude Code / Codex / OpenCode): write files directly (`UserFacing: true` for single-file artifacts, or link `canvas.html` + `pages/` for canvas projects). Keep chat reply ≤2 lines.
   - Stream-based UIs (Claude / LibreChat / Open WebUI): wrap single-file output in `<antArtifact identifier="kebab-id" type="text/html" title="Readable Title">...</antArtifact>`.

---

## Easy Customization Map

| Want to change… | Edit this file |
| :--- | :--- |
| Default colors, fonts, spacing, dark/light tokens | `./design-tokens.css` |
| Visual taste rules, banned styles, personal prefs | `./rules/design-rules.md` |
| Prototype Canvas UI, flow arrows, shortcuts | `./templates/canvas.html` |
| Starter templates for screens/docs/dashboards/decks | `./templates/*.html` |
| Auto-sync `pages/*.html` & `data-goto` links | `./scripts/sync-manifest.mjs` |
| Trigger & workflow rules | `./SKILL.md` |
