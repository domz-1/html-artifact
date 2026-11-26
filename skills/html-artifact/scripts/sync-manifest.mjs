#!/usr/bin/env node
/**
 * Scans <projectDir>/pages/*.html and updates <projectDir>/pages-manifest.js
 * - Preserves existing page order, titles, dimensions, and canvas x/y positions.
 * - Auto-extracts Figma-style prototype links from data-goto="..." attributes in each page!
 * Usage: node sync-manifest.mjs [project-dir] [--device=mobile|desktop]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const deviceFlag = args.find((a) => a.startsWith('--device='))?.split('=')[1] || 'mobile';
const pagesDir = path.join(dir, 'pages');
const manifestPath = path.join(dir, 'pages-manifest.js');

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
  const html = fs.readFileSync(path.join(pagesDir, file), 'utf8');
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

const out = `// Auto-synced by sync-manifest.mjs — edit order/links/coords here or drag in canvas.html\nwindow.CANVAS_CONFIG = ${JSON.stringify(
  existingConfig,
  null,
  2
)};\nwindow.CANVAS_MANIFEST = ${JSON.stringify(ordered, null, 2)};\n`;

fs.writeFileSync(manifestPath, out, 'utf8');
console.log(`Synced ${ordered.length} page(s) -> ${manifestPath}`);
