# Motion — cute animations that stay light

How Plink can have *lots* of animated, playful moments without paying the
wordmark's price again. Written after reading `Logo.astro`/`robot.js` and a
survey of how the effect is done elsewhere; the wordmark's measured cost is
in [performance.md](performance.md).

## TL;DR — the house rules

1. **Animate `transform` and `opacity`.** They are the only properties every
   browser interpolates on the compositor (off the main thread). Everything
   else repaints — and repaint is what TBT is made of.
2. **Cost = property × animated nodes × painted area × (masks/filters).**
   A dash animation on one small path is fine; 20 of them inside nested SVG
   masks is the wordmark's 1.7–1.9 s.
3. **One Tier-3 moment per page** (see the tiers below), everything else is
   transform/opacity. Measured with `npm run perf` + `npm run perf:report`
   before it ships; the gate is ≥ 95, and TBT is the number to watch.
4. **CSS-first** (the `AGENTS.md` invariant): a reveal is a transition, a
   scroll effect is `animation-timeline: view()` with the existing
   `robot.js`/IntersectionObserver fallback, a toy is a small dependency-free
   file like `about-play.js`.

## 1. What we have today (the write, read closely)

`Hero.astro` renders `<Logo animate width={400} />`; header/footer use the
static variant. The animated variant builds, per load:

- **17 strand groups**, each `<g mask="band-i"><g mask="claim-i"><use ink>` —
  two nested SVG masks per strand (a stroked window that animates its
  `stroke-dashoffset`, plus a 900×439 "who owns these pixels" PNG mask);
- plus the **marker tip** (another `stroke-dashoffset` along `pen-route`),
- plus the **settle** mask rect (opacity), plus the **sparks** (opacity/scale).

So ~20 simultaneous animations, all of them *paint-class* properties, and 17
of them each forcing the browser to re-rasterise masked content over the whole
wordmark box every frame, ~20× for the full 1.6 s. Measured: main thread
8.2–8.6 s total (~7.3 s "other" = raster), 20 long tasks, worst 367–488 ms →
TBT 1.7–1.9 s → score 0.72–0.73.

What is already right, and should survive any rewrite:

- **CSS only** for the animation itself — `robot.js` merely flips
  `animation-play-state` after `load` + idle, so the page paints first.
- **`prefers-reduced-motion`** shows the finished word instantly.
- **Zero dependencies**, decorative SVG is `aria-hidden`, the real heading is
  HTML text.
- Static pages pay nothing: header/footer logos are single static paths.

Two secondary observations:

- **Masks kill compositor fallback.** Firefox literally tracks this
  (bug 1923933: animations inside a masked element don't run off-thread), so
  no browser optimises this animation away for us.
- **LCP may be collateral.** Most runs read LCP = FCP (1.0 s), but one read
  2.0 s — check whether the writing element can become the LCP candidate and
  hold the metric hostage until the write finishes (an element hidden by
  animation is not an LCP candidate; a slowly-revealed one can fire late).

## 2. The cost model (applies to every future animation)

| You animate… | Pipeline stage | Class | Notes |
| --- | --- | --- | --- |
| `transform` (translate/scale/rotate), `opacity` | composite | **Tier 1 — free** | Off main thread, survives busy JS. Promote with `will-change` *only while* animating (each layer ≈ W×H×4 bytes of GPU memory). |
| `filter` (e.g. `drop-shadow`), `background-color`, `border-radius` via `clip-path: inset()`, SVG `transform`/`opacity` on simple groups | mostly composite in modern Chrome/Firefox, paint elsewhere | **Tier 2 — bounded paint** | Treat as paint unless you have traced it. Keep the element small and `contain: paint`. |
| `stroke-dashoffset` / `stroke-dasharray`, `clip-path` on shapes, `mask-*`, SVG masks/filters, `box-shadow`, text/fill colour | paint (+ re-raster) | **Tier 2–3** | "Cheap" only when the area is small and there are few of them. Mask/`url()` masks are consistently main-thread. |
| `width/height/top/left/margin`, SVG `d`, `viewBox`, layout-affecting anything | layout → paint | **Tier 3 — banned** | Forces reflow for the subtree every frame. |

Multipliers that turn a Tier 2 into the wordmark:

- **nodes** — the same dash animation on one path is invisible in a trace; on
  17 paths it is the whole budget. Community guidance caps "independently
  animated elements" around ~15 per SVG.
- **area** — repaint cost scales with the painted box × devicePixelRatio.
  A 12×12 spinner animation still cost one project ~1 CPU core at 144 Hz.
- **masks/filters in the path** — a mask forces re-raster per keyframe and
  *disables* compositor animation for everything inside it (Firefox bug
  above). Never animate a masked subtree.

## 3. How other people do "fancy text" (survey)

| Technique | Effect | Cost class | Deps | Notes |
| --- | --- | --- | --- | --- |
| `stroke-dashoffset` on an outline path | pen draws a monoline word/icon | paint, small | 0 | The classic (`pathLength="1"` so no JS measuring). Fine for *one simple* path: "one or two is fine, repeating on many paths forces repaints". |
| Stroked path as an SVG **mask** over filled artwork | write-on for irregular/calligraphic shapes | paint × masked subtree | 0 | What we use (CSS-Tricks' "handwriting with irregular strokes" recipe). The pattern's own docs warn: mask animations "require a re-rasterization per keyframe step" — cap complexity. |
| `clip-path: inset()` wipe | text/graphic slides into view | paint, area-bound | 0 | Great on small elements (`contain: paint`); for large areas use `overflow: clip` window + counter-`transform` (both sides transform → compositor). |
| Split letters/words, stagger `opacity`/`transform` | per-letter entrances, bouncy reveals | **composite** | 0 | The most common hero treatment on modern sites; works on plain HTML text, keeps text selectable, never blocks LCP if the base state is visible. |
| Filmstrip / sprite `steps()` | frame-by-frame animation (handwriting, mascots) | **composite** when done as `overflow:hidden` + `translateX` with `steps(n)`; `background-position` variant repaints | 0 (1 image) | Classic sprite technique (Josh Comeau et al.). Pre-rendered frames = zero per-frame drawing. |
| Pre-sliced images, cross-fade `opacity` | reveal that *is* the artwork | **composite** | 0 (N images) | Each slice is a static bitmap; only opacity animates. No masks anywhere in the animated path. |
| Canvas erase/blit reveal | draw-on with texture | paint, cheap blits | ~30 lines JS | Draw the finished art once, reveal with `drawImage` + clip each frame (~1–3 ms). Needs the documented-exception route. |
| Video/WebM of the animation | anything | **composite** playback | 0–1 | Heavy bytes, DPR/quality trade-offs, needs a reduced-motion poster. Good for loops, overkill for one moment. |
| SMIL `<animate>` | SVG-only animation | main thread | 0 | **Avoid**: no `prefers-reduced-motion`, no timing functions, main-thread, "no ongoing investment" (Motion). |
| Libraries — GSAP + DrawSVG, Motion, anime.js, Vivus, Lottie | timelines/choreography | still paint for dashoffset | tens of KB | Libraries change *authoring*, not the render class: DrawSVG animates `stroke-dashoffset` like we already do. Only worth it if outgrowing CSS sequencing (check current bundle sizes before adopting). |
| **Scroll-driven animations** (`animation-timeline: view()/scroll()`) | reveal/parallax tied to scroll, no JS | **composite**, off main thread | 0 | Replaces most IntersectionObserver reveals *and* scroll listeners. Chromium 115+, Safari 26+, Firefox behind — keep the `robot.js` fallback under `@supports`. |

## 4. The wordmark: options with costs

| # | Option | Keeps the exact look? | Per-frame work | Extra bytes | JS | Effort |
| --- | --- | --- | --- | --- | --- |---|
| **0** | **Contain the current approach**: investigate collapsing 17 masked groups → 1 (the strand windows tile `pen-route` contiguously, so a single window sweeping the route may already give "first pen wins" order; claims may collapse to one first-touch map); tighten mask/claim work; keep the 1.6 s | Yes, if crossing correctness holds | 17 masked composites → ~1 (paint, but ×1 fewer) | 0 | 0 | hours — **measure before assuming it's enough** |
| **1** | **Pre-raster slices + `opacity` cross-fade**: at build time emit each reveal band as a tight-cropped RGBA slice (the ownership data already exists — `penpath.py` + `claims/`); HTML stack of `<img>`s, each fading in when its band starts; tip = one small dash animation or a `transform`-animated dot | Pixel-identical at 2× DPR (it *is* the artwork) | opacity only ⇒ compositor; no mask anywhere | est. 30–70 KB one-time, immutable-cached | 0 | a day + a build step |
| **2** | **Filmstrip**: render N≈40 frames of the write at build time into one horizontal strip, reveal with `overflow:hidden` + `steps(40)` `translateX` | Identical if frames ≥ 30 fps; visible stepping below that | compositor (strip translate) | largest (40 frames ≈ 150–400 KB — measure; can render at 1× and use `image-rendering`) | 0 | a day + a build step |
| **3** | **Canvas blit**: finished ink drawn once to a canvas, reveal via accumulated clip + `drawImage` along the route; tip is a dot position | Identical (drawn at device DPR) | ~1–3 ms/frame main thread ⇒ TBT ≈ 0.1–0.2 s | 0 (ink path already in page) | ~40 lines (documented exception, like `about-play.js`) | half a day |
| **4** | **Simplify the live SVG**: flat fill during the draw (no per-frame blur/texture/mask-image sampling), texture/settle at the end; or fewer concurrent strands | Close, slight quality dip mid-write | still paint × 17 — may stay above 0.95 | 0 | 0 | hours |
| **5** | **Shorten `--draw-duration` 1.6 → 1.2 s** | Same look, faster pen | −25 % of the same cost | 0 | 0 | one line (Ricardo) |
| **6** | **Drop/gate the write** | Loses the moment | 0 | 0 | 0 | trivial (Ricardo) |

**Recommended sequence** (each step measured with `npm run perf`):

1. **Do 5** now — one line, shrinks the damage while we decide.
2. **Spike 0** (half a day): if a single route-ordered mask reproduces the
   crossing behaviour, per-frame work drops ~17× and the crisp SVG survives;
   if TBT lands ≤ ~300 ms, home clears 0.95 and we stop here.
3. If not, **choose 1 or 3 with Ricardo**: 1 is pure CSS and cache-friendly,
   3 keeps the vector crispness and zero bytes but is the first documented JS
   exception in the hero. 2 only if frame-stepping is acceptable.
4. Whatever is chosen, verify: `perf:report` on `/pt/` → TBT ≈ 0, score ≥ 95,
   transfer still ≤ 150 KB, reduced-motion unchanged.

## 5. House style for everything else (the "lots of cute" part)

**Recipe catalog — do it in this order of preference:**

| Wanted effect | Cheap way | Tier |
| --- | --- | --- |
| Entrances, fades, bounces, hovers, card zoom, icon pops | `transition`/`animation` on `transform` + `opacity` (what `global.css` already does for `data-reveal` and buttons) | 1 |
| Scroll reveals | `animation-timeline: view()` under `@supports`, `robot.js` IO fallback | 1 |
| Parallax / scroll-linked art | CSS `animation-timeline: scroll()` driving `transform`; `--scroll` var (robot) only as fallback | 1 |
| Staggered lists/headings | `nth-child` delays on a single transform/opacity transition | 1 |
| Marquee/ticker | translate loop (one animated node) | 1 |
| Sparkles, blinks, wiggles | short `opacity`/`scale` bursts, finite (`… 0.4s 2`), not infinite | 1 |
| Line/squiggle draw-on | one `stroke-dashoffset` on a simple path, finite, small area (`Squiggle.astro` already) | 2 |
| Wipe reveals | `overflow: clip` window + counter-translate (big) or `clip-path: inset()` + `contain: paint` (small) | 2 |
| State morphs, colour changes | short transitions on isolated elements | 2 |
| Anything masked, filtered, blurred, backdrop-blurred, or > ~15 animated SVG nodes | **not allowed alongside a Tier-3 moment**; needs its own measurement | 3 |
| Frame-by-frame art (writing, mascots, toys) | pre-rendered filmstrip/slices (see §4) | 1 |
| Physics toys, draggable things | `about-play.js` pattern: one canvas, DPR capped at 2, single rAF, sleeps when at rest/offscreen, `prefers-reduced-motion` respected | 3 (budgeted) |

**Hard rules (each one is a rule because something measured broke it):**

- **≤ 1 Tier-3 animation/toy visible at a time**; pause it when offscreen
  (`about-play.js` parks off-screen; do the same via IntersectionObserver).
- **Finite beats infinite.** Decorative loops must be tiny (a dot, a 1 px
  line); the wordmark's 1.6 s is the only long animation on the site and it
  is the one that costs.
- **Never animate through `opacity: 0` / `visibility` for LCP elements** —
  the hero heading must be paintable immediately; motion decorates around it.
- **No `box-shadow`/`width`/`layout` animation** — ever; use `filter:
  drop-shadow` (bounded) or a transform.
- **Don't stack expensive things**: no `backdrop-filter` in the same view as
  a Tier-3 moment (a 12×12 dash animation near backdrop blurs cost a project
  ~1 core/frame).
- **Promote narrowly**: `will-change: transform` only on the element about to
  animate, removed after; never 200 of them.
- **Reduced motion**: every effect has a finished-state fallback (as
  `Logo.astro`, `global.css` and `robot.js` already do).
- **JS stays an exception** (AGENTS.md): new motion must be CSS-first; a toy
  that needs JS gets its own tiny self-contained file, documented in
  `AGENTS.md`, degrading to a complete page.

**Libraries:** not needed for anything in this catalogue. If a future
simulation (the reserved `SimulationSlot`) needs choreography, evaluate
Motion/anime at that point on (a) bytes, (b) whether they help at all — they
do not change the render class of what you animate. Lottie only if a designer
hands over After Effects JSON, and only with a size check.

## 6. How to keep it honest (verification loop)

```bash
npm run build && npm run perf     # gate: ≥95 pages, exit 1 on regression
npm run perf:report               # TBT, long tasks, main thread per page
npm run profile                   # only when the BUILD feels slow
```

For a new animation, in DevTools (Chromium):

1. **Performance panel**, record while it plays → frames should show
   *"Composite Layers"* only; green (paint) or purple (layout) bars = wrong tier.
2. **Rendering → Paint flashing** → the animated box must not flash green
   every frame (it will, for anything Tier 2+).
3. `document.getAnimations().length` while it runs — know your node count.

Acceptance for anything added to the home page: TBT ≤ ~200 ms, perf ≥ 95,
transfer ≤ 150 KB, and `prefers-reduced-motion` shows the final state.

## Sources

- Motion (motion.dev): SVG animation classes — transform/opacity off-thread,
  path drawing is paint; `pathLength` trick; `will-change` layer costs.
- CSSVG / SVG Weave: property→stage tables, "≤ ~15 animated SVG elements",
  mask re-raster per keyframe, SVG compositor caveats.
- Firefox bug 1923933 — animations inside masked elements don't run OMTA.
- css-animation.com: clip-path/mask decision matrix, transform-window wipe,
  `contain: paint` bounding.
- mostlynerdless.de (Jul 2026): CSS hand-drawn text reveal via clip-path/path.
- CSS-Tricks: handwriting with irregular SVG strokes (the mask recipe we use);
  2015 technique benchmarks (GSAP/CSS/SMIL).
- Josh Comeau / leanrada / Enyo: sprite `steps()` + `transform` filmstrip.
- semicolonweb (Sep 2026): scroll-driven animations off main thread, LCP
  caveat for `opacity: 0` heroes, `will-change` discipline.
- deepseek harness discussion (Nov 2026): a 12×12 `stroke-dashoffset` loop
  costing ~1 CPU core beside backdrop filters.
