#!/usr/bin/env node
/**
 * scripts/perf-log.mjs — page-weight log, run by every build.
 *
 *   npm run build          # appends (astro check && astro build && this)
 *   node scripts/perf-log.mjs
 *
 * Measures the BUILT output in dist/ per page (gzip HTML/CSS/JS, fetched
 * woff2 as linked by the preload hints) and appends one JSON line per page
 * to perf-log.jsonl — the site's page-weight history, tracked over time
 * instead of hand-edited numbers in docs. Unchanged pages are not re-logged.
 *
 * Never fails: a missing dist/ or an unreadable page logs a warning and
 * exits 0 — measurements must not break builds. The 150 KB budget (page
 * weight excluding images, see .agents/verification.md) is only reported.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const DIST = join(ROOT, 'dist');
const LOG = join(ROOT, 'perf-log.jsonl');
const BUDGET_KB = 150; // excluding images

/** Pages that carry the site's weight (the perf gate's set + the forms page). */
const PAGES = [
  '/pt/',
  '/pt/projetos/',
  '/pt/noticias/',
  '/pt/noticias/apresentacao-plink/',
  '/pt/doacoes/',
  '/pt/tornar-me-socio/',
];

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const gzip = (buf) => gzipSync(buf, { level: 9 }).length;

/** dist/ path for an href in the built HTML (BASE_PATH-prefixed URLs). */
function distFile(href) {
  let path = href.split('?')[0].split('#')[0];
  const tries = [path, `/${path.split('/').slice(2).join('/')}`];
  for (const t of tries) {
    const f = join(DIST, t.replace(/^\//, ''));
    if (existsSync(f)) return f;
  }
  return null;
}

function measure(page) {
  const file = join(DIST, page.replace(/^\//, ''), 'index.html');
  if (!existsSync(file)) return null;
  const html = readFileSync(file);
  const text = html.toString('utf8');

  const tags = [...text.matchAll(/<(?:link|script)\b[^>]*>/g)].map((m) => m[0]);
  const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]+)"`)) || [])[1];
  const css = tags
    .filter((t) => t.startsWith('<link') && attr(t, 'rel') === 'stylesheet')
    .map((t) => distFile(attr(t, 'href'))).filter(Boolean);
  const js = tags
    .filter((t) => t.startsWith('<script') && attr(t, 'src'))
    .map((t) => distFile(attr(t, 'src'))).filter(Boolean);
  const fonts = tags
    .filter((t) => t.startsWith('<link') && attr(t, 'rel') === 'preload' && attr(t, 'as') === 'font')
    .map((t) => distFile(attr(t, 'href'))).filter(Boolean);

  const sum = (files, gz) => files.reduce((n, f) => n + (gz ? gzip(readFileSync(f)) : readFileSync(f).length), 0);
  const row = {
    html: kb(gzip(html)),
    css: kb(sum(css, true)),
    js: kb(sum(js, true)),
    fonts: kb(sum(fonts, false)),
  };
  row.total = kb((row.html + row.css + row.js + row.fonts) * 1024);
  return row;
}

function lastLogged() {
  const seen = new Map();
  if (!existsSync(LOG)) return seen;
  for (const line of readFileSync(LOG, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      seen.set(row.page, row);
    } catch {
      /* a torn line must not poison the log */
    }
  }
  return seen;
}

if (!existsSync(join(DIST, 'index.html')) && !existsSync(join(DIST, 'pt', 'index.html'))) {
  console.log('perf-log: no build in dist/ — skipping (nothing measured).');
  process.exit(0);
}

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout — the log still records the numbers */
}

const ts = new Date().toISOString();
const previous = lastLogged();
const rows = [];
for (const page of PAGES) {
  const row = measure(page);
  if (!row) {
    console.log(`perf-log: ${page} not in dist/ — skipping.`);
    continue;
  }
  const last = previous.get(page);
  const same =
    last &&
    ['html', 'css', 'js', 'fonts', 'total'].every((k) => last[k] === row[k]) &&
    last.commit === commit;
  if (!same) rows.push({ ts, commit, page, ...row });
}

if (rows.length === 0) {
  console.log('perf-log: unchanged since the last logged build — nothing appended.');
} else {
  const lines = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  appendFileSync(LOG, lines);
  const w = Math.max(...rows.map((r) => r.page.length));
  console.log('perf-log: page weight (KB, gzip where applicable) → perf-log.jsonl');
  console.log(`${'page'.padEnd(w)}  html   css    js   fonts  total`);
  for (const r of rows) {
    const over = r.total > BUDGET_KB ? '  ← over budget' : '';
    console.log(
      `${r.page.padEnd(w)}  ${String(r.html).padStart(4)}  ${String(r.css).padStart(4)}` +
      `  ${String(r.js).padStart(4)}  ${String(r.fonts).padStart(5)}  ${String(r.total).padStart(5)}${over}`,
    );
  }
  const over = rows.filter((r) => r.total > BUDGET_KB);
  if (over.length) console.log(`perf-log: ${over.length} page(s) over the ${BUDGET_KB} KB budget (images excluded).`);
}

process.exit(0);
