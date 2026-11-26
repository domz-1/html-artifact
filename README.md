# html-artifact

Agent skill for generating modern Claude-style pure HTML5/CSS/JS artifacts — **zero React, zero Vite, zero npm, zero build steps**.

Supports two modes:
1. **Multi-Page Interactive Canvas & Figma-Style Prototypes** — separate editable `pages/*.html` files rendered as **Figma-capturable Light DOM (zero `<iframe>` blank boxes!)** in one clean, sidebar-free `canvas.html` + dedicated 1:1 `figma-board.html`, with name-only artboards, live curved prototype flow arrows, clickable `data-goto` navigation, `← Back` history, and click-outside hotspot flashes. Works 100% offline on `file://` and `http://`.
2. **Single-File HTML Artifacts** — self-contained editorial docs (`doc.html`), interactive dashboards, mobile prototypes, and keyboard-navigable slide decks.

## Install

```bash
bunx skills add domz-1/html-artifact --skill html-artifact -y
# or
npx -y skills add domz-1/html-artifact --skill html-artifact -y
```

## Figma Capture (Zero Blank Frames)

Because browser capture extensions (`html.to.design`, Figma Capture) skip cross-origin `<iframe>` internals on `file://`, `sync-manifest.mjs` automatically compiles each `pages/*.html` + `tokens.css` into scoped Light DOM:
- **`canvas.html` (Arrange mode)**: renders real Light DOM directly (no `<iframe>`), while **Interact** & **▶ Prototype** switch cleanly to live interactive `<iframe>`s.
- **`figma-board.html` (`Figma 1:1` button)**: clean 1:1 pixel-exact frames side-by-side with name-only labels and zero toolbar chrome — click **Copy all** to paste every screen into Figma as real editable layers.

## Structure

```text
skills/html-artifact/
├── SKILL.md                    # Core rules & workflow
├── design-tokens.css           # Editable global CSS variables (light/dark)
├── rules/
│   └── design-rules.md         # Anti-slop visual craft & personal prefs
├── scripts/
│   └── sync-manifest.mjs       # Generates pages-manifest.js + pages-inline.js + figma-board.html
└── templates/
    ├── canvas.html             # Sidebar-free infinite canvas + Figma-style prototype player
    ├── pages-manifest.js       # Ordered screens, dimensions, coords & flow links
    ├── page-base.html          # Starter screen with Prototype Bridge (data-goto / data-back)
    ├── doc.html                # Single-file editorial doc template
    ├── dashboard.html          # Single-file interactive dashboard template
    ├── mobile-ui.html          # Single-file mobile UI template
    └── deck.html               # Single-file slide deck template
```

## Shortcuts in `canvas.html`

- `F` — Fit all screens in view
- `L` — Toggle prototype flow arrows
- `P` — Launch interactive prototype player
- `R` — Reload all page files from disk
- `H` (in Prototype) — Flash clickable hotspots
- `Backspace` / `←` / `→` / `Esc` (in Prototype) — Back / navigate / exit
