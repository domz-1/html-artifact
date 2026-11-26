#!/usr/bin/env node
/**
 * Scans <projectDir>/pages/*.html and generates:
 *  1. pages-manifest.js — ordered screens, dimensions, coords, and auto-extracted data-goto links
 *  2. pages-inline.js   — scoped Light-DOM snapshots (ZERO <iframe>) so canvas.html pastes cleanly into Figma
 *  3. figma-board.html  — pure 1:1 capture-ready Figma board (no toolbar, no scale distortion, name-only frames)
 *
 * Usage: node sync-manifest.mjs [project-dir] [--device=mobile|desktop]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const deviceFlag = args.find((a) => a.startsWith('--device='))?.split('=')[1] || 'mobile';
const pagesDir = path.join(dir, 'pages');
const manifestPath = path.join(dir, 'pages-manifest.js');
const inlinePath = path.join(dir, 'pages-inline.js');
const figmaBoardPath = path.join(dir, 'figma-board.html');
const tokensPath = path.join(dir, 'tokens.css');

if (!fs.existsSync(pagesDir)) {
  console.error(`No pages/ directory found in ${dir}`);
  process.exit(1);
}

let existingConfig = { title: path.basename(dir), snap: 20 };
let existingPages = [];

if (fs.existsSync(manifestPath)) {
  const src = fs.readFileSync(manifestPath, 'utf8');
  const cfgMatch = src.match(/window\.CANVAS_CONFIG\s*=\s*(\{[\s\S]*?\});/);
  const listMatch = src.match(/window\.CANVAS_MANIFEST\s*=\s*(\[[\s\S]*?\]);/);
  try { if (cfgMatch) existingConfig = JSON.parse(cfgMatch[1]); } catch {}
  try { if (listMatch) existingPages = JSON.parse(listMatch[1]); } catch {}
}

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html')).sort();
const byFile = new Map(existingPages.map((p) => [p.file, p]));
const existingFileSet = new Set(files.map((f) => `./pages/${f}`));

function extractLinks(html) {
  const found = [];
  const seen = new Set();
  const re = /data-goto=["']([^"']+)["'](?:[^>]*data-flow-label=["']([^"']+)["'])?/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const to = m[1].trim();
    const label = (m[2] || '').trim();
    if (!seen.has(to)) {
      seen.add(to);
      found.push(label ? { to, label } : { to });
    }
  }
  return found;
}

const ordered = existingPages
  .filter((p) => existingFileSet.has(p.file))
  .map((p) => {
    const html = fs.readFileSync(path.join(dir, p.file.replace(/^\.\//, '')), 'utf8');
    const detected = extractLinks(html);
    return {
      ...p,
      links: p.links && p.links.length ? p.links : detected,
    };
  });

const defaultW = deviceFlag === 'desktop' ? 1280 : 390;
const defaultH = deviceFlag === 'desktop' ? 800 : 844;
let maxX = ordered.reduce((m, p) => Math.max(m, (p.x || 0) + (p.width || defaultW) + 96), 0);

for (const file of files) {
  const rel = `./pages/${file}`;
  if (byFile.has(rel)) continue;
  const html = fs.readFileSync(path.join(dir, 'pages', file), 'utf8');
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const slug = file.replace(/\.html$/, '').replace(/^\d+-/, '');
  const title =
    (titleMatch && titleMatch[1].trim()) ||
    slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  ordered.push({
    id: slug,
    title,
    file: rel,
    width: defaultW,
    height: defaultH,
    device: deviceFlag,
    links: extractLinks(html),
    x: maxX,
    y: 0,
  });
  maxX += defaultW + 96;
}

/* ---------------------------------------------------------------------------
   CSS Scoper — isolates each page's tokens + rules under #<scopeId>
   so multiple pages coexist in real Light DOM (zero <iframe>, Figma-ready!)
   --------------------------------------------------------------------------- */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function normalizeDeclarations(body) {
  return body
    .replace(/position\s*:\s*fixed\b/gi, 'position: absolute')
    .replace(/\b100d?vh\b/gi, '100%')
    .replace(/font-weight\s*:\s*450\b/gi, 'font-weight: 500')
    .replace(/font-weight\s*:\s*550\b/gi, 'font-weight: 600')
    .replace(/font-weight\s*:\s*650\b/gi, 'font-weight: 600');
}

/* Map OS-only fonts (missing in Figma on Linux/Web) -> Figma built-in Google Fonts */
function mapToFigmaFonts(css) {
  return css
    .replace(
      /(--font-sans\s*:|font-family\s*:)([^;{}]*(?:-apple-system|BlinkMacSystemFont|SF Pro Text|SF Pro Display|Segoe UI|system-ui)[^;{}]*)/gi,
      '$1 "Plus Jakarta Sans", "IBM Plex Sans Arabic", sans-serif'
    )
    .replace(
      /(--font-ui-display\s*:)([^;{}]*(?:-apple-system|BlinkMacSystemFont|SF Pro|Segoe UI|system-ui)[^;{}]*)/gi,
      '$1 "Plus Jakarta Sans", "IBM Plex Sans Arabic", sans-serif'
    )
    .replace(
      /(--font-(?:display|serif)\s*:)([^;{}]*(?:Iowan Old Style|New York|Georgia|Times New Roman)[^;{}]*)/gi,
      '$1 "Newsreader", serif'
    )
    .replace(
      /(--font-mono\s*:|font-family\s*:)([^;{}]*(?:ui-monospace|SF Mono|Menlo|Consolas)[^;{}]*)/gi,
      '$1 "JetBrains Mono", monospace'
    );
}

function scopeSingleSelector(sel, scope) {
  const s = sel.trim();
  if (!s) return '';
  if (s === '*' || s === '*::before' || s === '*::after') {
    const pseudo = s.slice(1);
    return `${scope}${pseudo}, ${scope} ${s}`;
  }
  if (/^:root\b/.test(s)) {
    return s.replace(/^:root\b/, scope);
  }
  if (/^\[data-theme/.test(s)) {
    return `${scope}${s}`;
  }
  if (/^(html|body)\b/.test(s)) {
    const rest = s.replace(/^(html|body)\b/, '').trim();
    if (!rest) return scope;
    if (/^[.#:\[]/.test(rest)) return `${scope}${rest}`;
    return `${scope} ${rest}`;
  }
  return `${scope} ${s}`;
}

function scopeCss(rawCss, scopeId) {
  const css = stripComments(rawCss);
  const scope = `#${scopeId}`;
  let out = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    while (i < len && /\s/.test(css[i])) i++;
    if (i >= len) break;

    // At-rules (@media, @supports, @keyframes, @font-face, @import)
    if (css[i] === '@') {
      const start = i;
      while (i < len && css[i] !== '{' && css[i] !== ';') i++;
      if (i < len && css[i] === ';') {
        out += css.slice(start, i + 1) + '\n';
        i++;
        continue;
      }
      const header = css.slice(start, i).trim();
      let depth = 0;
      const blockStart = i;
      while (i < len) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') {
          depth--;
          if (depth === 0) { i++; break; }
        }
        i++;
      }
      const inner = css.slice(blockStart + 1, i - 1);
      if (/^@(media|supports|container|layer)\b/i.test(header)) {
        out += `${header} {\n${scopeCss(inner, scopeId)}\n}\n`;
      } else {
        // @keyframes, @font-face, @property: keep verbatim
        out += `${header} {${inner}}\n`;
      }
      continue;
    }

    // Standard rule: selector { declarations }
    const selStart = i;
    while (i < len && css[i] !== '{') i++;
    if (i >= len) break;
    const selectorText = css.slice(selStart, i).trim();
    let depth = 0;
    const bodyStart = i;
    while (i < len) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
      i++;
    }
    const bodyText = normalizeDeclarations(css.slice(bodyStart + 1, i - 1));
    const scopedSelectors = selectorText
      .split(',')
      .map((s) => scopeSingleSelector(s, scope))
      .filter(Boolean)
      .join(', ');
    if (scopedSelectors) {
      out += `${scopedSelectors} {${bodyText}}\n`;
    }
  }
  return out;
}

function namespaceSvgIds(html, prefix) {
  const ids = new Set();
  const defRe = /<(?:linearGradient|radialGradient|clipPath|mask|filter|pattern|marker)\b[^>]*\bid=["']([^"']+)["']/gi;
  let m;
  while ((m = defRe.exec(html)) !== null) ids.add(m[1]);
  let result = html;
  for (const id of ids) {
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result
      .replace(new RegExp(`\\bid=(["'])${safe}\\1`, 'g'), `id="${prefix}_${id}"`)
      .replace(new RegExp(`url\\(#${safe}\\)`, 'g'), `url(#${prefix}_${id})`);
  }
  return result;
}

function extractPageSnapshot(html, tokensCss, scopeId) {
  const htmlTagMatch = html.match(/<html\b[^>]*>/i);
  const themeMatch = htmlTagMatch?.[0].match(/data-theme=["']([^"']+)["']/i);
  const dirMatch = htmlTagMatch?.[0].match(/dir=["']([^"']+)["']/i);
  const theme = themeMatch ? themeMatch[1] : 'light';
  const dirAttr = dirMatch ? dirMatch[1] : '';

  // Collect inline <style> blocks
  const styleBlocks = [];
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html)) !== null) styleBlocks.push(m[1]);

  // Extract <body> inner HTML and strip <script> tags so multiple screens don't collide
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : html;
  bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim();
  bodyHtml = namespaceSvgIds(bodyHtml, scopeId);

  const combinedCss = [tokensCss, ...styleBlocks].join('\n');
  const scopedCss = scopeCss(mapToFigmaFonts(combinedCss), scopeId);

  return { scopeId, theme, dir: dirAttr, css: scopedCss, html: bodyHtml };
}

const tokensCss = fs.existsSync(tokensPath) ? fs.readFileSync(tokensPath, 'utf8') : '';
const inlineMap = {};

for (let idx = 0; idx < ordered.length; idx++) {
  const p = ordered[idx];
  const filePath = path.join(dir, p.file.replace(/^\.\//, ''));
  if (!fs.existsSync(filePath)) continue;
  const html = fs.readFileSync(filePath, 'utf8');
  const scopeId = `scr_${idx}_${p.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  inlineMap[p.id] = extractPageSnapshot(html, tokensCss, scopeId);
}

// 1. Write pages-manifest.js
const manifestOut = `// Auto-synced by sync-manifest.mjs — edit order/links/coords here or drag in canvas.html\nwindow.CANVAS_CONFIG = ${JSON.stringify(
  existingConfig,
  null,
  2
)};\nwindow.CANVAS_MANIFEST = ${JSON.stringify(ordered, null, 2)};\n`;
fs.writeFileSync(manifestPath, manifestOut, 'utf8');

// 2. Write pages-inline.js (used by canvas.html for zero-iframe Light DOM rendering!)
const inlineOut = `// Auto-generated scoped Light-DOM snapshots (zero <iframe>, 100% Figma-capture compatible)\nwindow.CANVAS_INLINE = ${JSON.stringify(
  inlineMap
)};\n`;
fs.writeFileSync(inlinePath, inlineOut, 'utf8');

// 3. Write figma-board.html (clean 1:1 flat board — zero toolbar, zero scale, zero <iframe>)
const allScopedCss = ordered
  .map((p) => inlineMap[p.id]?.css || '')
  .join('\n');

const boardFrames = ordered
  .map((p) => {
    const snap = inlineMap[p.id];
    if (!snap) return '';
    const isMobile = p.device === 'mobile' || p.width <= 460;
    const radius = isMobile ? '36px' : '16px';
    return `
      <section class="fb-item">
        <div class="fb-name">${p.title}</div>
        <div
          class="fb-frame"
          id="${snap.scopeId}"
          data-theme="${snap.theme}"
          ${snap.dir ? `dir="${snap.dir}"` : ''}
          style="width:${p.width}px;height:${p.height}px;border-radius:${radius};"
        >${snap.html}</div>
      </section>`;
  })
  .join('\n');

const figmaBoardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${existingConfig.title || 'Figma Board'} — 1:1 Capture</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #11141a;
      font-family: "Plus Jakarta Sans", "IBM Plex Sans Arabic", sans-serif;
    }
    .fb-board {
      display: inline-flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 64px;
      padding: 64px;
      min-width: 100%;
    }
    .fb-item {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex-shrink: 0;
    }
    .fb-name {
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
      letter-spacing: -0.01em;
      padding-left: 4px;
    }
    .fb-frame {
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 24px 60px -16px rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }
  </style>
  <style id="scoped-screen-styles">
${allScopedCss}
  </style>
</head>
<body>
  <main class="fb-board">
${boardFrames}
  </main>
</body>
</html>
`;
fs.writeFileSync(figmaBoardPath, figmaBoardHtml, 'utf8');

console.log(`Synced ${ordered.length} page(s) -> pages-manifest.js, pages-inline.js, figma-board.html`);
