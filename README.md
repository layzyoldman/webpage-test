# Associação Plink — website

Static website for **Associação Plink**, a Portuguese national youth association
that runs pedagogical STEM projects for young people and supports educators.
Built with **Astro** (static output), **TypeScript strict**, content collections,
and plain CSS. **Zero client-side JavaScript.**

- Languages: **pt-PT** (default) · **en-GB** — `/pt/`, `/en-gb/` (en-US was
  retired in Oct 2026; its content lives under `archive/`)
  (the Portuguese home is additionally served at `/`).
- Content is Markdown/MDX files: adding content never requires touching code
  (see [CONTRIBUTING.md](CONTRIBUTING.md), in Portuguese).
- No cookies, no analytics, no third-party requests at runtime.

## Quick start

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # astro check && astro build → dist/
npm run preview    # serve dist/ locally
npm run contrast   # WCAG contrast check of the design tokens
npm run profile    # build timings: where `astro build` spent its time
npm run perf       # optional test: Lighthouse against the built dist/
npm run perf:report  # the last perf run as a table + what needs work
```

## Stack and why each dependency is here

| Package | Why |
| --- | --- |
| `astro` | Static site framework (fixed by the brief). Static output, no server. |
| `@astrojs/sitemap` | `sitemap-index.xml` with hreflang alternates per locale. |
| `@astrojs/rss` | Per-locale news feed at `/<locale>/rss.xml`. |
| `@fontsource-variable/fraunces` | Self-hosted display serif (Latin subsets fetched at runtime via `unicode-range`), OFL-licensed, no CDN. "Standard" file keeps Fraunces' character axes (wonk/soft/opsz). |
| `@fontsource-variable/space-grotesk` | Self-hosted body/UI sans (Latin subsets via `unicode-range`), OFL-licensed, no CDN. Weight-only variable file. |
| `@astrojs/check`, `typescript` (dev) | `astro check` in `npm run build` (zero warnings enforced). |
| `@lhci/cli` (dev) | `npm run perf` — Lighthouse against the deployed site, with score/byte-weight assertions. Dev-only: never reaches `dist/`, never runs in `npm run build`. |

Nothing else. No UI framework, no CSS framework, no client JS. (Svelte will be
added later **only** for the interactive simulations.)

## Project layout

```
astro.config.ts         static output, i18n routing, sitemap
lighthouserc*.json     Lighthouse gates: dist/ (perf) · plink.pt (perf:site)
src/config/site.ts      NON-VISUAL parameters: identity, locales, nav, flags
src/styles/tokens.css   VISUAL parameters: all colours/type/space/motion tokens
src/styles/global.css   reset, typography, prose, shared primitives
src/content.config.ts   Zod schemas for the 5 collections
src/content/<collection>/<locale>/<slug>.md   one file per item per locale
src/i18n/               UI strings, localized route table, t()/href() helpers
src/lib/content.ts      localized queries, fallback chain, event status
src/layouts/Base.astro  document skeleton (head, skip link, header, main, footer)
src/components/         Header, Footer, SEO, Hero, Section, Card, TeamCard,
                        EventItem, NewsItem, ProjectCard, Tag, Prose,
                        Logo (wordmark), Bulb (mark), Icon (SVG icon set),
                        Squiggle, Flag, LanguageSwitch, ThemeToggle,
                        Playground, Values, MemberForm, PlaceholderLink,
                        SimulationSlot
src/views/              one file per page type (routes stay thin)
src/pages/              routes: [locale]/…, RSS, robots.txt, 404, root mirror
public/                 _headers, favicon.svg, lampada.svg, og-placeholder.png,
                        theme.js, about-play.js, robot.js (the three documented
                        client scripts — see AGENTS.md; zero JS beyond them)
scripts/contrast.mjs    token contrast checker (npm run contrast)
scripts/avatars.mjs     regenerates the placeholder SVG team portraits
scripts/verify.mjs      structural checks vs a running site (CDP, no deps)
scripts/penpath.py      wordmark pen-route geometry (see .agents/wordmark.md)
CONTRIBUTING.md         how to add content (pt)
AGENTS.md, .agents/     invariants and guides for future development
```

## Rebranding in 5 minutes

1. **Colours** — `src/styles/tokens.css`, block 1 (*brand palette*): `--palette-blue`,
   `--palette-pink`, `--palette-yellow`, `--palette-green`, `--palette-orange`,
   `--palette-black`, `--palette-white`. Everything semantic derives from them.
   Then run `npm run contrast` — all pairs must stay ≥ 4.5:1 (AA).
   Dark mode overrides are in the same file, at the bottom.
2. **Fonts** — `src/styles/tokens.css`, `--font-sans` / `--font-display`, plus the
   `@fontsource-variable/…` import in `src/layouts/Base.astro` (one family today).
3. **Identity** — `src/config/site.ts`: name, legal name, NIPC, address, e-mail,
   social links, tagline, description, footer text.
4. **URLs** — localized slugs live in `src/i18n/routes.ts` (one line per locale).
5. **Favicon / OG image** — `public/favicon.svg` and `public/og-placeholder.png`
   mirror the palette by hand (SVG favicons can't read CSS variables). The
   placeholder covers in `src/assets/covers/` are currently unreferenced (no
   content entry sets `cover:`) — bring them back on brand if content starts
   using covers again.

## Adding content

One file per item, one folder per locale — see [CONTRIBUTING.md](CONTRIBUTING.md)
for copy-paste templates (team member, event, news post, project, page).
Rules in short: the `pt` file is the source of truth for dates/tags/status;
translated files carry the text fields; a missing translation falls back to
Portuguese and the page still exists at its locale URL.

## Performance and verification

Measured on the static build (`npm run build`, then `npm run preview` or any
static server) with Lighthouse 13.5.0 (mobile emulation, simulated throttling)
on 25 Oct 2026:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/pt/` (home) | 98 | 100 | 100 | 100 |
| `/pt/projetos/` | 99 | 100 | 100 | 100 |
| `/pt/noticias/` | 99 | 100 | 100 | 100 |
| `/pt/noticias/apresentacao-plink/` | 100 | 100 | 100 | 100 |
| `/pt/doacoes/` | 99 | 100 | 100 | 100 |

⚠️ **Never measure `npm run dev`** — the dev server injects the Vite client and
the Astro dev toolbar (~1 MB of JS) and halves the performance score. Always
measure the built output (or the deployed site).

⚠️ **The home page's wordmark write costs its score.** The write rasterises a
~3000-unit path per frame: 0.6–1 s of main-thread blocking, documented as the
**71–79** band in [.agents/wordmark.md](.agents/wordmark.md) — and that is
what both the mirror and the local build measure (72 below). The 98 in the
table above is a single local run on 25 Oct that did not reproduce it; the
write is the only thing on the page that expensive, so `npm run perf` asserts
≥ 65 for `/pt/` and ≥ 95 everywhere else.

Deployed measurement (GitHub Pages mirror, Lighthouse 13.6 mobile, median of
3 runs, 8 Nov 2026):

| Page | Performance | Accessibility | Best practices | SEO | Transfer |
| --- | --- | --- | --- | --- | --- |
| `/pt/` (home, write included) | 72 | 100 | 100 | 100 | 134 KB |
| `/pt/projetos/` | 97 | 100 | 100 | 100 | 108 KB |
| `/pt/noticias/apresentacao-plink/` | 98 | 100 | 100 | 100 | 104 KB |

Transfer = Lighthouse `total-byte-weight` (every request, images included —
21 KB of that on the home page, which is how it squares with the 115 KB
excl.-images budget below).

### `npm run perf` — the local lab test (optional)

Not part of `npm run build`; run it when you want it (it measures `dist/`, so
build first):

```bash
npm run build && npm run perf   # collect → assert → upload (report link)
npm run perf:report             # the same runs as a table + what needs work
```

- Serves `dist/` on its own throwaway static server and runs Lighthouse 3× on
  each of the 5 pages in `lighthouserc.json` — mobile emulation with simulated
  network + CPU throttling, the standard lab proxy for a slow phone.
- Asserts the **median**: performance ≥ 95, a11y/best-practices/SEO ≥ 95,
  page transfer ≤ 150 KB (`total-byte-weight`, images included); exits 1 on a
  regression. Exception: the home page asserts ≥ 65 — the write's documented
  band above; read the uploaded report for the real number.
- Uploads each median report to Lighthouse's temporary public storage (7 days).
- Baseline, measurement menu and the ranked list of what to address:
  [.agents/performance.md](.agents/performance.md).

`plink.pt` does not exist yet, so there is no field data and nothing to
load-test (load tools measure the *server*, not the page — see the guide).
When the origin is live, the same gates run against it:

```bash
npm run perf:site    # lighthouserc.site.json → https://plink.pt/pt/…
```

### `npm run profile` — build timings

```bash
npm run profile     # astro build --timings: phases, plugins, slowest pages
```

Prints where the build spent its time (Astro's own profiler — pages, images,
Vite plugins, integrations). Use it when `npm run build` gets slow; it does
not run `astro check`.

Page weight (home, excluding images): **115 KB** — HTML 16 KB + CSS 8 KB + JS
2 KB (all gzip) + Fraunces 67 KB and Space Grotesk 22 KB (woff2, Latin subsets
only; latin-ext/vietnamese stay unfetched thanks to `unicode-range`). Inside
the 150 KB budget. (The CSS grew with the die-cut puzzle slabs — the
extrusion filter chain — and is still well inside budget.) Images are excluded from the
budget and are emitted by Astro as AVIF/WebP with explicit dimensions.

Accessibility verified beyond Lighthouse: keyboard-only navigation (skip link
focuses first), one `h1` per page, no heading-level jumps, landmarks, `lang`
attributes per locale, visible focus rings, 320 px without horizontal overflow,
`prefers-reduced-motion` respected.

## Hosting

Output is hosting-agnostic: `dist/` after `npm run build`.

**Public test page (GitHub Pages, free):** a public mirror deploys from
`layzyoldman/webpage-test` at `https://layzyoldman.github.io/webpage-test/`.
Its existence is one command: `scripts/pages.sh on` (sync + deploy) /
`scripts/pages.sh off` (site 404s, repo and history stay) /
`scripts/pages.sh status`. The deploy workflow computes the base path from
the repo name, so the same build works at a domain root or under `/<repo>/`
(`BASE_PATH` env). Pages ignores `public/_headers`, so security headers do
not apply on the test page — fine for testing, not for production.
`public/_headers` ships security headers (CSP without third-party origins,
HSTS, frame denial) and cache policy (`/_astro/*` immutable, HTML revalidated
by the host's ETag). COOP/COEP for future `/simulacoes/*` routes is prepared
there as commented-out rules — **never enable it site-wide**.

Canonical URLs use a trailing slash (`/pt/sobre/`), matching the directory
output. `/` mirrors the Portuguese home with a canonical pointing at `/pt/`.
`SITE.url` in `src/config/site.ts` is the canonical origin (`https://plink.pt`).

## Decisions worth reviewing

1. **Two locales: `pt` + `en-gb`** (`en-gb → pt` fallback). en-US was retired
   at Ricardo's request — the content was archived, not deleted. Adding a
   locale later is one line in `LOCALES` + one folder per collection.
2. **Event status is derived from dates** (`upcoming`/`past`), never typed;
   `cancelled` is the only hand-set status (frontmatter `cancelled: true`).
3. **`/pt/…` is canonical; `/` mirrors the home only** (other pt pages are not
   duplicated at the root).
4. **Project filters are pure CSS** (`:has()` + radio inputs). Browsers without
   `:has()` simply show all projects. No JS, no announcements to screen readers
   when filtering — revisit if that matters to users.
5. **Drafts are schema-validated** (a broken draft fails the build on purpose)
   but never listed, generated or fed to RSS.
6. **Layout choice**: `text-wrap: balance` on headings, hanging punctuation —
   small editorial touches that can be removed in `global.css`.
