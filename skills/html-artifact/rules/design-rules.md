# Design Taste Rules (Editable)

Edit, add, or delete rules below to tune the visual personality of every artifact.

## 1. Ground Design in Subject Matter
- Derive palette, density, and typography from the actual domain (finance ≠ travel ≠ developer tool ≠ health app).
- Use real, domain-specific copy and data — never Lorem Ipsum or generic "Feature 1 / Feature 2".

## 2. Anti-Slop Ban List (Avoid Unless User Explicitly Asks)
- No cliché purple/violet neon gradients on dark backgrounds.
- No cookie-cutter uniform card grids with identical shadows and border-radius everywhere.
- No tracked-out ALL-CAPS eyebrow label stacked above every heading.
- No single-word colored/italicized highlight inside every hero headline.
- No decorative `01 / 02 / 03` numbering unless content is truly sequential.
- No scattered fade-up scroll animations on every block; reserve motion for user-triggered state changes or 1 focal moment.

## 3. Typography & Hierarchy
- Max 1–2 font families. Lead font stacks with **Figma-native Google Fonts** (`"Plus Jakarta Sans"`, `"DM Sans"`, `"Newsreader"`, `"JetBrains Mono"`, `"IBM Plex Sans Arabic"`) and standard weights (`400`, `500`, `600`, `700`) — never put OS-only fonts (`-apple-system`, `SF Pro Text`, `Iowan Old Style`) first, as they paste invisible in Figma on Linux/Web.
- Set deliberate scale, tight display tracking (`-0.025em`), comfortable body measure (`< 75ch`), and `font-variant-numeric: tabular-nums` on numbers.
- High contrast between primary text and surfaces in both light and dark modes.

## 4. Interactivity & Craft
- Include a working theme toggle (`data-theme="dark"`) when appropriate.
- Every visible control (tabs, search, filters, copy buttons, drawers, modals) must work with clean vanilla JS.
- Responsive from mobile (`375px`) to desktop (`1440px`), keyboard-focusable, respects `prefers-reduced-motion`.
- Inline SVGs for crisp icons & custom diagrams — zero broken external links.

## 5. Personal Preferences (Add Yours Here)
<!-- Add your own permanent preferences below, e.g.:
- Prefer Arabic RTL (`dir="rtl"`) when prompt is in Arabic.
- Default to dark obsidian theme for developer tools.
-->
