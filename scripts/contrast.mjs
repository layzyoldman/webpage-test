#!/usr/bin/env node
/**
 * scripts/contrast.mjs — WCAG contrast checker for the design tokens.
 *
 * Reads the colour values from src/styles/tokens.css (light and dark blocks)
 * and verifies every foreground/background pair used by the site.
 *
 *   npm run contrast
 *
 * Exit code 1 if any pair fails AA (4.5:1 for text, 3:1 for UI/focus).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');

/* ------------------------------------------------------------ colour math */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ------------------------------------------- parse tokens.css (hex only) */

function parseBlock(startMarker) {
  const start = css.indexOf(startMarker);
  const end = css.indexOf('}', start);
  const block = css.slice(start, end);
  const tokens = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** Follow var() aliases down to a hex literal. */
function resolve(tokens, name, seen = new Set()) {
  if (seen.has(name)) return undefined;
  seen.add(name);
  const value = tokens[name];
  if (!value) return undefined;
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  return alias ? resolve(tokens, alias[1], seen) : value.match(/^#[0-9a-fA-F]{3,8}$/) ? value : undefined;
}

const lightTokens = parseBlock(':root {');
const darkBlockStart = css.indexOf('@media (prefers-color-scheme: dark)');
const darkOverrides = (() => {
  const block = css.slice(darkBlockStart);
  const tokens = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
})();
const schemes = [
  { label: 'light', tokens: lightTokens },
  { label: 'dark', tokens: { ...lightTokens, ...darkOverrides } },
];

/* --------------------------------------------------------------- checking */

/** [foreground, background, minimum ratio, description] */
const PAIRS = [
  ['--color-text', '--color-bg', 4.5, 'body text on page background'],
  ['--color-text', '--color-surface', 4.5, 'body text on surface'],
  ['--color-text-muted', '--color-bg', 4.5, 'muted text on page background'],
  ['--color-text-muted', '--color-surface', 4.5, 'muted text on surface'],
  ['--color-primary', '--color-bg', 4.5, 'links on page background'],
  ['--color-primary', '--color-surface', 4.5, 'links on surface'],
  ['--color-primary-contrast', '--color-primary', 4.5, 'button label on button'],
  ['--color-accent', '--color-bg', 4.5, 'accent text on page background'],
  ['--color-accent', '--color-surface', 4.5, 'accent text on surface'],
  ['--color-focus', '--color-bg', 3, 'focus ring on page background (UI)'],
  ['--color-border', '--color-bg', 1.2, 'hairline borders visible (advisory)'],
  /* the washes (tokens.css block 1b) carry body and muted text on every
     piece/panel — checked per hue in both schemes */
  ...['--tint-blue', '--tint-pink', '--tint-yellow', '--tint-green', '--tint-orange'].flatMap(
    (tint) => [
      ['--color-text', tint, 4.5, `body text on ${tint.slice(7)} wash`],
      ['--color-text-muted', tint, 4.5, `muted text on ${tint.slice(7)} wash`],
    ],
  ),
];

let failed = 0;
for (const scheme of schemes) {
  console.log(`\n== ${scheme.label} scheme ==`);
  for (const [fgToken, bgToken, min, description] of PAIRS) {
    const fg = resolve(scheme.tokens, fgToken);
    const bg = resolve(scheme.tokens, bgToken);
    if (!fg || !bg) {
      console.log(`  ?? ${fgToken} on ${bgToken}: missing token`);
      failed++;
      continue;
    }
    const ratio = contrast(hexToRgb(fg), hexToRgb(bg));
    const ok = ratio >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${ratio.toFixed(2)}:1 (min ${min}) ${fgToken} ${fg} on ${bgToken} ${bg} — ${description}`,
    );
  }
}

console.log(failed ? `\n${failed} pair(s) below threshold.` : '\nAll pairs meet their thresholds.');
process.exit(failed ? 1 : 0);
