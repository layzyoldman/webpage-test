# Performance

How the site is measured, what the current baseline is, and the ranked list of
things worth doing. Measurement is **local** for now — `plink.pt` does not
exist yet, so there is no deployed page and no field data.

## What you can run (and what each one tells you)

```bash
npm run build        # required first: perf measures dist/
npm run perf         # 5 pages × 3 runs of Lighthouse against dist/ (own static server)
npm run perf:report  # the numbers as a table + "what needs work" per page
npm run profile      # where the BUILD spent its time (astro build --timings)
```

- **`npm run perf` is the real-world estimate.** Lighthouse runs emulated
  mobile with *simulated* network + CPU throttling — that is the standard lab
  proxy for a slow 4G phone, and it is what the ≥ 95 targets in `AGENTS.md`
  refer to. It asserts the **median** of 3 runs and uploads a shareable HTML
  report; `perf:report` summarises the same runs in the terminal.
- **`npm run profile`** profiles the build (phases, plugins, slowest pages),
  not the page. Irrelevant to visitors; useful when `npm run build` gets slow.
- **Not possible yet:** traffic simulation. Load tools (`autocannon`, `k6`,
  `artillery`) measure the *server*, and there is no server to characterise —
  on a static host the platform (CDN, compression, cache) is the answer, not
  your code. True field data (Core Web Vitals from real visitors) arrives with
  the domain and traffic: see "Once it is deployed" below.
- `perf:site` (`lighthouserc.site.json`) already points at
  `https://plink.pt/…` for when the origin exists — untested until then.

## Baseline — 8 Nov 2026, Lighthouse 13.6, mobile, median of 3

Two sessions × 15 runs, same picture both times (home varies slightly between
sessions — the range is in brackets):

| Page | Perf | A11y/BP/SEO | FCP | LCP | TBT | CLS | Transfer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/pt/` (home) | **0.72–0.73** | 100/100/100 | 1.0 s | 1.0–2.0 s | **1.7–1.9 s** | 0 | 133 KB |
| `/pt/projetos/` | 1.00 | 100/100/100 | ~0.99 s | ~0.99 s | 0 ms | 0 | 109 KB |
| `/pt/noticias/` | 1.00 | 100/100/100 | ~0.98 s | ~0.98 s | 0 ms | 0 | 109 KB |
| `/pt/noticias/apresentacao-plink/` | 1.00 | 100/100/100 | ~0.98 s | ~0.98 s | 0 ms | 0 | 105 KB |
| `/pt/doacoes/` | 1.00 | 100/100/100 | ~0.98 s | ~0.98 s | 0–1 ms | 0 | 109 KB |

Facts behind the table:

- **Zero third-party requests** (one inline `data:` SVG), **CLS 0** everywhere,
  every weighted audit on the content pages is at its ceiling.
- LCP ≈ FCP on the content pages: the LCP element is the hero text, painted
  with first paint — nothing waits on images. The home page's LCP wanders
  (1.0–2.0 s) because the write keeps repainting the hero while it draws.
- Byte mix (home): **fonts 88 KB**, images 22 KB, HTML 13 KB, CSS 6 KB, JS
  3 KB. Content pages are the same minus images. Fonts are 66–84 % of every
  page load; `/_astro/*` is immutable, so a visitor pays them **once**.
- The only sub-95 score anywhere is the home page, and it is one audit:
  `total-blocking-time` 1.7–1.9 s (20 long tasks, worst 367–488 ms, 8.2–8.6 s
  of main thread — ~7.3 s of it paint/raster "other"). That is the wordmark
  write: 18 of the 20 long tasks are attributed to the document itself.
- Build: **4.54 s for 57 pages** — not a bottleneck, nothing to do.

## What to address (ranked)

### 1. Home wordmark write — 1.7–1.9 s of blocking, the site's only sub-95 score

Everything else scores 100; this one audit drags `/pt/` to 0.72–0.73
(documented band 71–79 in [wordmark.md](wordmark.md): the ~3000-unit ink path
is re-rasterised every frame through nested image + dash masks, once per
strand).

| Option | What it is | Pros | Cons |
| --- | --- | --- | --- |
| **A. Pre-sliced static reveals** (the option already recorded in wordmark.md) | ~48 pre-sliced copies per strand, each `stroke-dasharray` window shows one slice; slices cross-fade with `opacity` (compositor-only) | Same look and story; rasterised once → TBT ≈ 0 → home ≥ 95; CSS-first, degrades as today | Reworks `Logo.astro` internals — needs Ricardo's nod; ~48 elements/strand grows HTML/CSS (small gzipped); seam/quality risk at slice edges; the day's work |
| **B. Shorten `--draw-duration` 1.6 → 1.2 s** | One token in `tokens.css` | One line, ~25 % less blocking, zero risk to the artwork | Mitigation only: score lands ≈ 0.78, still the worst page; changes the animation's feel (Ricardo) |
| **C. Cheaper raster per frame** | Reveal with flat fill during the animation, add blur/texture at the end; or draw fewer strands at once | Keeps the write and the path exactly; likely cuts the per-frame cost several-fold | Quality dip *during* the write; may not clear 95 on its own — measure before/after |
| **D. Pre-rendered playback** (frame sequence or short video, `poster` + reduced-motion still) | Playback is compositor work | Zero main-thread regardless of device; pixel-identical everywhere | Raster: loses vector crispness (against the vector decision made for the puzzle); +100–300 KB or a frame pipeline; DPR/accessibility/reduced-motion handling; more tooling |
| **E. Drop the write** (finished word, or gate it behind reduced-motion / second visit) | Delete the animation | Score 95+ immediately; simplest and most robust | Loses the brand's signature moment (Ricardo decides); gating by visit still fails first visits — which is every Lighthouse run |

**Recommendation:** B is the only thing worth doing *before* a decision — it
is one line and shrinks the damage. Then take A (or C+A together) to Ricardo:
A is the design-preserving fix and is already written up as the intended path.
E only if the animation is not worth ~1.7 s of blocking on a slow phone.

### 2. Fonts — 88 KB on every cold load, and the reason the home page sits 17 KB from the 150 KB budget

`fraunces-latin` 68 KB + `space-grotesk-latin` 24 KB (the latin-ext/vietnamese
subsets ship but are never fetched — `unicode-range` works as intended).

| Option | What it is | Pros | Cons |
| --- | --- | --- | --- |
| **A. Subset to the glyphs the site uses** (`fonttools`/`pyftsubset` over `src/content` + UI strings) | Cuts character coverage to what is actually printed | Likely the largest win (rough guess 88 → 50–60 KB) with no visual change; `uv` already used by `penpath.py`, so the toolchain exists | New build step + a guard for future content (a missing glyph is invisible until it ships); variable axes keep it from being tiny |
| **B. Instance the variable fonts to the weights/optical range in use** | `varLib.instancer` pins axes | Smaller files, identical rendering if the pinned range covers the design | Pinning `opsz`/`wonk` gives up the axes that were the reason for choosing these files |
| **C. One family only** (system stack for UI/meta text) | −24 KB straight away | Immediate, fewer requests, system text paints with no swap | Breaks the stated "one serif, one sans" identity; inconsistent across OS |
| **D. Do nothing** | Status quo | Zero work; within budget; fonts are immutable-cached after view 1; FCP already ≈ 1.0 s | Budget headroom stays thin (17 KB on home) — any growth lands on images or new fonts |

**Recommendation:** **D now, A when there is a reason.** 88 KB is the price of
the identity, it is paid once per visitor, and the pages are at 100. Revisit A
if the budget tightens or PSI field data (once live) shows slow FCP/LCP on
real connections. B only with a design check on Fraunces' axes.

### 3. Interaction and scroll cost — measured for load, not for use

Lighthouse covers page load. It does not tell you what `robot.js`'s `--scroll`
invalidation or the puzzle cards' hover zoom cost *while the user scrolls or
hovers* on a low-end phone. Today there is no evidence of a problem (content
pages: TBT 0, main-thread ≈ 0.8–1.0 s during load only).

| Option | Pros | Cons |
| --- | --- | --- |
| **A. Small CDP interaction profiler** (same zero-dependency pattern as `scripts/verify.mjs`: scripted scroll + hover, counts long tasks/frames) | Targeted, local, no new deps, runs alongside `perf` | Maintenance; only worth it once a jank report or a heavy interactive page exists |
| **B. Wait for field INP** (CrUX once the site is live) | Real users, no code | Needs the domain *and* enough traffic; weeks of delay |
| **C. Do nothing, re-check with `perf:report` after each visual change** | Free | Finds regressions only in load metrics |

**Recommendation:** C now; A when an interactive page (simulations, filters on
low-end devices) is actually built — the reserved `SimulationSlot` is the
likely trigger. B automatically once live.

### 4. Once it is deployed — real numbers, and what not to bother with

- **`npm run perf:site`** — same gates against `https://plink.pt/…`
  (config ready; first run is the test of the origin).
- **PageSpeed Insights / CrUX** — the only *real-world* signal: Google's field
  data for actual visitors. Also reachable without Chrome via
  `lhci --method psi` (Google runs Lighthouse) — needs a public URL, an API
  key for useful volume.
- **Load tools (`autocannon`, `k6`)** — measure requests/second against a
  server. *Not* user-perceived performance, and on GitHub Pages/CDN-like
  hosting there is no server of yours to tune. Pros: cheap to run, good for
  capacity planning. Cons: numbers move to the host, not the site; a false
  sense of progress. **Skip until you control the host.**

## Deliberately not on the list

Build time (4.5 s), CLS (0), third-party requests (0), HTML/CSS weight
(gzip 16.5 KB / 5.5 KB), image handling (AVIF/WebP with explicit dimensions),
accessibility/BP/SEO (100 across the board) — all already at the target.
`og-placeholder.png` is 80 KB but only ever referenced by `og:image` (crawlers,
not visitors); revisit for social-preview quality, not for speed.
