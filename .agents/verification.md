# Verification

Evidence before claims. Run these before saying anything is done.

## Always

```bash
npm run build        # astro check && astro build — must be 0 errors, 0 warnings
npm run contrast     # WCAG AA for all token pairs, light + dark
```

## Content changes

- New/edited files must pass schema validation (the build fails otherwise).
- Check both locales of a page: `/pt/…` and `/en-gb/…` (fallback is expected
  where no translation exists — that is not a bug).
- Drafts must NOT appear anywhere (list pages, RSS `/<locale>/rss.xml`, sitemap).

## Visual / behavioural changes

```bash
# the deployed site — optional test, not part of `npm run build`:
npm run perf                          # pages/thresholds in lighthouserc.json
npm run perf -- --collect.url=http://localhost:4321/pt/   # the local build
```

`npm run perf` (Lighthouse via `@lhci/cli`) collects 3 runs per page, asserts
the **median**, and prints a shareable report link (temporary public storage,
7 days). Thresholds: performance/a11y/best-practices/SEO ≥ 95, transfer
≤ 150 KB — except `/pt/`, which asserts ≥ 65 because the wordmark write costs
it 0.6–1 s of main-thread blocking (the 71–79 band in [wordmark.md](wordmark.md)).
Exit code 1 = a threshold broke.

⚠️ Measure the **built** output, never `npm run dev`: the dev server injects
the Vite client + dev toolbar (~1 MB of JS) and halves the performance score.
If the dev server holds the port, use whatever port `astro preview` prints.

Targets: **≥ 95** in performance / accessibility / best practices / SEO
(currently 97–100 on the deployed pages excluding the home's write) and
≤ 150 KB page weight excluding images (measure: gzip(HTML) + gzip(CSS) +
fetched woff2).

When the build itself gets slow, `npm run profile` (`astro build --timings`)
prints where the time went — phases, plugins, slowest pages and images.

Structural sanity — `node scripts/verify.mjs http://localhost:4321` runs most
of the checks below against a running site (system Chromium via CDP, no
dependencies); keyboard reachability needs a manual pass:

- 320 px viewport: no horizontal overflow (`documentElement.scrollWidth`).
- One `h1` per page; no heading-level jumps.
- First `Tab` focuses the skip link and it becomes visible.
- Keyboard reachability of the mobile `<details>` menu and the project filters.
- No console errors.

## Regression traps to re-check after touching…

- `src/i18n/routes.ts` → canonical + hreflang URLs in page `<head>`,
  LanguageSwitch links, sitemap alternates.
- `src/lib/content.ts` fallback/merge → en-gb page mixing translated and
  fallback text correctly (translated fields come from the translated file).
- `public/_headers` → CSP must not allow third-party origins; COOP/COEP must
  stay commented out except for future `/simulacoes/*`.
- Fonts in `Base.astro` → only Latin subsets fetched (browser network tab),
  `font-display: swap` present.
