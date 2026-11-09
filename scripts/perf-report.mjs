#!/usr/bin/env node
/**
 * scripts/perf-report.mjs — human-readable summary of the last `npm run perf`.
 *
 *   npm run perf            # collect (Lighthouse against dist/) + assert
 *   npm run perf:report     # print what the numbers say needs work
 *
 * Reads .lighthouseci/lhr-*.json (zero dependencies, like verify.mjs), groups
 * the runs by page, and reports the MEDIAN of each metric — the same run the
 * assertions use. Always exits 0: this is a profiler, not a gate.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = '.lighthouseci';
const METRICS = [
  ['FCP', 'first-contentful-paint'],
  ['LCP', 'largest-contentful-paint'],
  ['TBT', 'total-blocking-time'],
  ['CLS', 'cumulative-layout-shift'],
  ['SI', 'speed-index'],
];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ms = (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`);
const kb = (v) => `${Math.round(v / 1024)} KB`;
const path2 = (url) => {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
};

let files;
try {
  files = readdirSync(DIR).filter((f) => /^lhr-.*\.json$/.test(f)).sort();
} catch {
  console.error(`No ${DIR}/ — run \`npm run perf\` first.`);
  process.exit(1);
}
if (!files.length) {
  console.error(`No LHR files in ${DIR}/ — run \`npm run perf\` first.`);
  process.exit(1);
}

const pages = new Map();
for (const f of files) {
  const lhr = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  const key = path2(lhr.finalUrl);
  if (!pages.has(key)) pages.set(key, []);
  pages.get(key).push(lhr);
}

const version = JSON.parse(readFileSync(join(DIR, files[0]), 'utf8')).lighthouseVersion;
console.log(
  `perf report — ${files.length} runs across ${pages.size} page(s), Lighthouse ${version}` +
    ' (mobile, simulated throttling), median per page\n'
);

const header = ['page', 'perf', 'a11y', 'bp', 'seo', ...METRICS.map(([l]) => l), 'transfer'];
const rows = [];
for (const [page, lhrs] of pages) {
  const med = (fn) => median(lhrs.map(fn));
  rows.push([
    page,
    ...['performance', 'accessibility', 'best-practices', 'seo'].map((c) =>
      med((l) => l.categories[c].score).toFixed(2)
    ),
    ...METRICS.map(([, id]) => ms(med((l) => l.audits[id]?.numericValue ?? 0))),
    kb(med((l) => l.audits['total-byte-weight']?.numericValue ?? 0)),
  ]);
}
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
console.log(line(header));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const r of rows) console.log(line(r));

console.log('\nwhat needs work (median run per page, worst first)');
for (const [page, lhrs] of pages) {
  const sorted = [...lhrs].sort(
    (a, b) => a.categories.performance.score - b.categories.performance.score
  );
  const mid = sorted[Math.floor(sorted.length / 2)];
  const refs = mid.categories.performance.auditRefs
    .filter((r) => r.weight > 0 && mid.audits[r.id]?.score !== null && mid.audits[r.id].score < 1)
    .map((r) => ({
      id: r.id,
      title: mid.audits[r.id].title,
      weight: r.weight,
      score: mid.audits[r.id].score,
      value: mid.audits[r.id].displayValue || `${Math.round(mid.audits[r.id].numericValue ?? 0)}`,
      cost: r.weight * (1 - mid.audits[r.id].score),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3);

  const main = mid.audits['mainthread-work-breakdown']?.numericValue ?? 0;
  const tasks = mid.audits['long-tasks']?.details?.items ?? [];
  const worst = tasks.reduce((m, t) => Math.max(m, t.duration), 0);
  console.log(`\n  ${page}`);
  if (!refs.length) console.log('    no failing weighted audit — score is at the ceiling');
  for (const r of refs)
    console.log(`    ${r.title}  ${r.value}  (score ${r.score.toFixed(2)}, weight ${r.weight})`);
  console.log(
    `    main thread ${ms(main)} total · ${tasks.length} long task(s) · worst ${Math.round(worst)} ms`
  );

  const mix = {};
  for (const i of mid.audits['network-requests']?.details?.items ?? [])
    mix[i.resourceType || 'other'] = (mix[i.resourceType || 'other'] || 0) + (i.transferSize || 0);
  console.log(
    `    bytes: ${Object.entries(mix)
      .sort((a, b) => b[1] - a[1])
      .map(([t, v]) => `${t.toLowerCase()} ${kb(v)}`)
      .join(' · ')}`
  );
}
console.log('\nLinks to full HTML reports: `npm run perf` prints them on upload.');
