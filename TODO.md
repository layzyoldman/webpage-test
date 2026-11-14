# TODO — Plink site rework

## Puzzle pieces → the drawn shape, flat 2D (13 Nov 2026)

Ricardo's follow-up: "make the cards 2d puzzle pieces. not the team ones
though. basically the 3d pieces plan, but with 2d pieces. should be
easier" — the plain-square experiment below is superseded by this.

- [x] **Cards are 2D jigsaw pieces again** — the drawn shape (big ball at
      edge midpoints, short concave scallops, narrow opening: the exact
      `--joint-lr`/`--joint-tb` tiles from the 3D plan), one face layer,
      no tilt, no extrusion, no shadow. Fit-by-construction restored: one
      joint tile fills the knob AND cuts the socket (mask-composite), one
      placement rule. Padding = `--joint-depth` (the plan's "half the
      tile") so bites can never reach text; joint scale lives in
      `--joint-span/--joint-depth` (Sponsors shrinks both for small tiles).
- [x] **Team cards excluded** — they were never in puzzle grids (the team
      page uses the carousels), so there was nothing to undo; verified.
- [x] **Plan proportions back** — 2-up rows (home and listings), empty
      `.grid-gap` slots (knobs poke into them — mid-assembly), seam 14 px;
      the squares' ghost slots and 3-up rows are gone.
- **Kept from the squares batch:** the balanced type rhythm (title
  `--step-1`, body `--step-0`, meta `--step--1`) — it reads well on the
  big pieces too.

Verified: build 0/0, contrast green, `scripts/verify.mjs` all green,
`npm run perf` (content pages 1.00, `/pt/` 0.72 — wordmark write, gate
≥ 65), screenshots critiqued light/dark/mobile. Two bugs caught in review
before shipping: the joint data-URIs had not been copied into the new
`.piece` rule (masks resolved to nothing — joints rendered as raw
rectangles) and the art needed `z-index: -2` to sit behind the text.

## Puzzle pieces → 2D squares (13 Nov 2026) — SUPERSEDED by the batch above

Ricardo's batch: "we still need to fix the puzzle pieces. do not delete the
3d ones, but let's try 2d. might be simpler. and lets try making them
squares. also try to balance the font sizes."

- [x] **2D square tiles replace the 3D die-cut slabs** — every piece is a
      flat square (equal sides, house radii), the seam (`--puzzle-seam`,
      retuned 14→10 px) is the joint line, and a piece not placed yet is a
      ghost slot (`.grid-gap`: faint tint + hairline). The old look's
      problems are gone: sockets were cut on EVERY edge (moth-eaten borders,
      holes wherever no mate existed) and the knobs floated as detached
      discs in the wide seams under the 3D tilt.
- [x] **The 3D ones are parked, not deleted** — `archive/piece-art-3d.astro`
      + `archive/puzzle-3d.css` (component, CSS and its tokens, restore
      recipe in the file header).
- [x] **Font sizes balanced** — one rhythm across all card kinds: title
      `--step-1` (was `--step-2`), summary `--step-0`, meta/leads `--step--1`
      (meta was `--step-0`, as loud as the body). Stacks top-aligned too —
      the `margin-top: auto` bottom-anchoring made rows ragged.
- [x] **Rows hold three tiles** — `.grid--chain`/`.grid--puzzle` share one
      column rule (auto-fill, min 22rem); home shows 3 items per row (was
      2) and short rows complete with ghost slots (news/projects: 2 + 1
      ghost until real content arrives).
- [x] **Sponsor tiles take their mark's hue** (`--card-accent` per sponsor,
      the "use the palette" rule) — and `align-content: start` so the logo
      card contents stop stretching apart inside the square.

Verified: build 0 errors/0 warnings, `npm run contrast` green,
`scripts/verify.mjs` all green against a plain static server over dist/
(incl. the form + no-JS checks), `npm run perf`: content pages 1.00,
`/pt/` 0.70 (the known wordmark write — same 20 long tasks as the 0.73
baseline run; gate ≥ 65), home page weight 114 KB (CSS 8→7 KB with the 3D
block archived). Screenshots critiqued over three passes (light, dark,
mobile 400 px).

**Notes for future UI passes:** judge and measure from a plain static
server (`python3 -m http.server --directory dist`) — a stray `astro dev`
on the port injects the toolbar pill into screenshots. Home rows now show
3 items: if Ricardo prefers 2 big tiles again, that is two lines in
`Home.astro` plus the column rule.

## Broken & open — 12 Nov 2026 (site scan)

### Done (12 Nov 2026)

- [x] **`scripts/pages.sh on` cannot deploy** — fixed: it now publishes the
      mainline (`PAGES_SOURCE`, default `dev`) to the mirror's `master` ref,
      which is what `deploy.yml` listens for. Commit `b0c00eb`.
- [x] **Public mirror shipped the broken puzzle** — deployed: mirror moved
      `88dc58b..b0c00eb`, Pages run `43235419112` = success, verified live
      (`joint-r` markup + `--joint-lr` CSS on the deployed home, deployed 404
      has one h1).
- [x] **`origin/live` behind `dev`** — merged (`Merge branch 'dev' into
      live`, `c155664`) and pushed; `live` now carries everything on `dev`.

### Done (13 Nov 2026)

- [x] **`plink.pt` is NXDOMAIN** while `SITE.url = 'https://plink.pt'` —
      canonicals, `og:url`, sitemap and JSON-LD on every page point at a dead
      domain (set in `f4fa90e`).
      **Decision:** revert `SITE.url` to the GitHub Pages origin
      (`https://layzyoldman.github.io` — `BASE_PATH` already supplies
      `/webpage-test`, see `absoluteUrl()`), and keep the switch to the final
      domain trivial: one constant in `src/config/site.ts`, overridable via a
      `SITE_URL` build env var. A static host builds the site directly from
      the repo until the domain is set up, so both `SITE_URL` and
      `BASE_PATH` are deploy-time inputs there. Also update the
      `astro.config.ts` comment that still says "plink.pt, served by
      statichost".
      **Shipped + verified (13 Nov):** `SITE.url` now defaults to the Pages
      origin with the `SITE_URL` override; the stale comments are gone.
      Also made the URL consumers BASE-aware (they silently assumed `/`):
      JSON-LD `url`, robots.txt sitemap URL and the RSS channel link. Built
      with `BASE_PATH=/webpage-test`: canonicals, hreflang, og:url, JSON-LD,
      sitemap, robots.txt and RSS all resolve under
      `layzyoldman.github.io/webpage-test/`, and `SITE_URL=https://plink.pt
      npm run build` flips every one of them to the final domain.

- [x] **Forms post into the void** — `SITE.formUrl` is
      `https://example.org/formulario` (PLACEHOLDER): newsletter subscribe
      (news + events) and the membership form lose every submission on
      6 pages × 2 locales.
      **Decision:** there will never be a form backend for now — the site
      stays static. v1 = a small client-side PDF module:
      - `public/pdf-form.js` (dependency-free, self-hosted): intercepts
        `submit` on `form[data-pdf]`, collects filled fields (labels via
        `label[for]`/`closest('label')`; checkbox/radio groups collapsed by
        their `<fieldset><legend>`; empty fields skipped), renders a simple
        A4 PDF (Helvetica + WinAnsiEncoding — Portuguese fits latin1), and
        downloads it. Visitor then emails it to `SITE.contactEmail`.
      - Wire it on `MemberForm` + `SubscribeForm` via
        `data-pdf-title`/`data-pdf-file` (localized in `ui.ts`, keys to add:
        `form.pdfTitle`, `form.pdfSent`, `form.noJs`,
        `subscribe.pdfTitle`); show a "done — send it to …" note with a
        mailto link; without JS hide the form and show the mailto fallback
        (reuse the `html.js` gate that `theme.js` already sets).
      - **PDF gotchas:** JS string → bytes must be latin1 (`Uint8Array` from
        `charCodeAt`, NOT `new Blob([string])` which UTF-8-encodes and breaks
        every xref offset); all strings must stay ≤ charCode 255 (map
        typographic dashes/quotes, WinAnsi ≡ latin1 for Portuguese); xref
        offsets = cumulative string lengths (byte-exact because of latin1).
      - Housekeeping: add `/pdf-form.js` to the AGENTS.md script exceptions
        (list currently says "two" but has three — fix the count), cache
        header next to `/theme.js` in `public/_headers`, and narrow
        `form-action 'self'` (drop `https://example.org`).
      - Verify: `pdftotext`/`pdfinfo`/`mutool` are installed — generate a
        test PDF in Node (the builder is pure string code) and round-trip it
        through `pdftotext`; then CDP-fill the real form on the preview
        server and assert the note appears + the download lands.
      **Shipped + verified (13 Nov):** built exactly as decided.
      `npm run test:pdf-form` (15 checks: byte-exact xref + `/Length`,
      WinAnsi round-trip through pdfinfo/pdftotext/mutool,2 pages), the
      form checks now in `scripts/verify.mjs` (fill → submit → the PDF
      lands with the right labels → the note appears; plus the no-JS
      fallback) and `npm run perf` (all pages 1.00 except the known /pt/
      wordmark cost at 0.73, gate ≥ 65; transfer ≤ 133 KB).
      **Follow-ups decided while building** (reasonable calls — redo them
      if you disagree): `SITE.formUrl` is gone (nothing posts anywhere);
      the Sponsors card's "Preencher o formulário" points at the join form
      (`#join-form-title`) instead of the dead external URL; `form.note`
      copy now describes the download-then-email flow; SubscribeForm's
      hidden `tipo` field is gone (the list kind travels in the PDF
      title/filename).
      **Two bugs caught during verification, both fixed with guards:**
      `labelText` looked labels up with `getElementById(el.id)` — which
      returns the *input*, not the `label[for]` — so text fields fell back
      to raw names ("nome", "email") in the PDF; now matched via
      `label.htmlFor`. And a `\n` escape-layer bug in the verify fill
      expression made it a SyntaxError (three silent FAILs); the form
      checks now also assert the downloaded PDF's text via pdftotext.

### Open — need Ricardo's data

- [ ] **279 placeholder markers in the built output** — NIPC, registered
      address, IBAN/MB WAY, ~26/40 generated team portraits, guessed DL/DCI
      headcounts. The exact questions are under "Questions for Ricardo"
      below; they ship to visitors until answered.

**Note for future verify runs:** `scripts/verify.mjs` can FAIL "first Tab
focuses skip link" on the first pages when Chromium is cold (the fixed 700 ms
load wait is too short then) — re-run before believing it; two consecutive
clean runs on 12 Nov 2026 confirmed the site passes.

**Status 25 Oct 2026 (Ricardo's pass):** everything actionable is done and
verified (see "Verification pass" below). What remains is real-world data
("Still open — need Ricardo") and one housekeeping question (the orphan cover
PNGs). Several items below had already been shipped by earlier commits without
being ticked — they are now verified and ticked.

## Ricardo's batches (23 Oct) — status

- [x] **Wordmark writes properly** — root cause of the cut view: `<mask>`
      default region clips the artwork in Chrome AND Firefox; explicit region
      fixed it. Verified: writes 0→100% by 1.1 s, ticks blink in at 1.4 s.
- [x] **Lights on faster, tighter writing** (final tune: pen stroke 700,
      sparks at 0.88× of the write).
- [x] **Favicon = the three yellow ticks** of the wordmark.
- [x] **Revolver idea — removed** (misunderstood; the component is parked in
      `archive/revolver-component.astro`, nothing deleted).
- [x] **Team = Órgãos Sociais** (Direção, Conselho Fiscal, Mesa da Assembleia)
      + departments with the real names (DREE = Relações Educativas e
      Empresariais, DCI = Comunicação e Imagem, DL/DP confirmed).
- [x] **Carousels auto-scroll** (CSS marquee, pauses on hover/focus, manual
      scroll under reduced motion).
- [x] **Team page stripped** to names and people.
- [x] **Footer**: small, horizontal, icon socials (no YouTube), no tagline.
- [x] **Font**: Bricolage Grotesque Variable (OFL, single family).
- [x] **Wider page** (container 84rem).
- [x] **404 in both languages**.
- [x] **Two locales only** — en-US retired, content archived under `archive/`.
- [x] **Repo organised** — `src/assets/logo/source/` (Ricardo's SVGs),
      `src/assets/team-photos/` (portraits + future real photos).
- [x] **HTML blobs** — generated output, left alone as instructed.
- [x] **Docs synced** (README, CONTRIBUTING, .agents/*).

### Decisions taken while Ricardo was away

- Conselho Fiscal = 3 people, Mesa da Assembleia = 3 (counts not given;
  change in `src/content/team/pt/`).
- Department name expansions as stated by Ricardo; descriptions updated to
  match (DREE now talks about schools + business relations).
- Sparks "blink in" = quick three-step blink, once, at the end of the write.

### Still open (need Ricardo)

- DL (6) and DCI (5) headcounts — my guesses.
- Área de Sócio data source in v1 (mock + email path today).
- Real IBAN / MB WAY (placeholders today).
- Real team photos → drop into `src/assets/team-photos/` and set `photo:`
  (8 real photos in place today; the rest of the roster still shows generated
  portraits).

---

## Ricardo's batch (24 Oct)

- [x] **Wordmark writes as ONE single stroke** — the multi-stroke model is
      gone; the k follows Ricardo's reference trace verbatim
      (`src/assets/logo/source/k-route.txt`), the l draws the right loop
      first, the pencil is the real brush width (62) with a soft edge, and
      a yellow marker dot rides the leading edge. `.agents/wordmark.md`
      records the model, the knobs and the verification numbers.
- [x] **Favicon = the three strokes** — `public/favicon.svg` is the wordmark's
      three yellow strokes again (as in commit `8670031`); the lightbulb
      favicon is gone.
- [x] **Newton's cradle: icons inside the balls** — each value's icon is
      stamped on its own ball (path data sourced from `src/lib/icons.ts`,
      drawn through `Path2D`); the caption legend is gone (labels live in the
      canvas `aria-label`). Bigger: the cradle takes the width left beside
      the prose (`grid-template-columns: 38rem 1fr` on `.about-flow`).
      Seamless: no card chrome, the canvas sits straight on the page.
- [x] **Light/dark switch** — proposal 1, **a lâmpada**, is built
      (`ThemeToggle.astro` + `Icon name="bulb"`): the mascot bulb is lit
      yellow with a soft glow in light mode, off in dark ("acender/apagar").
- [x] **Language selector** — proposal 1, **Segmented PT | EN**, is built
      (`LanguageSwitch.astro`): both languages visible, active segment
      filled, one click, no menu, same control in the mobile nav.
- [x] **One consistent icon system** — the whole set is redrawn on one grid
      (24×24, 2px stroke, round caps/joins) and owned by `src/lib/icons.ts`
      (single source of truth for `Icon.astro` and the cradle's in-ball
      glyphs). Home cards get a mark chip per kind of content (events =
      ticket, news = newspaper, projects = flask), section heads carry the
      same chip, and the header menu, chevron and footer socials are drawn
      from the same set — no one-off inline SVGs left.

---

## Original dump + first follow-ups

## Brand & identity

- [x] **Lightbulb logo + favicon** — `lampada.svg` (Ricardo's SVG) is the mark,
      svgo-optimised (29 KB), served from `/lampada.svg`; originals kept
      untouched at the repo root. (Favicon later became the three strokes —
      see the 24 Oct batch.)
- [x] **One-stroke handwritten "plink" wordmark** — `nome.svg` (Ricardo's SVG),
      ink + sparks recoloured through tokens (dark mode flips the ink).
- [x] **The wordmark writes itself in front of the user** — pen-route mask reveal
      on the home hero, `prefers-reduced-motion` shows the end state.
- [x] **All graphics are icons/SVG** — theme icons, flags, dummy portraits and
      brand marks are all local SVG.

## Theme & language

- [x] **Light + dark mode with a manual toggle** — the bulb switch in the header
      (see above), persists across pages, OS preference fallback without JS
      (`/theme.js`, documented in AGENTS.md along with `/about-play.js` and
      `/robot.js`).
- [x] **Dark scheme parity** — palette lifts in dark; `npm run contrast` green.
- [x] **Language switcher** — the segmented PT | EN control (see above); the
      flag dropdown of the first iteration is retired.

## Navbar / interaction bugs (explicit asks)

- [x] **Remove the "downglow" on navbar buttons** — the accent bar under the
      active nav item is gone (weight + colour carry the state now); the
      language dropdown had a soft shadow, also removed.
- [x] **Fix the page stutter when clicking navbar buttons** — cause found: the
      theme toggle popped into the navbar at DOMContentLoaded on every page
      load (layout jump). It now reveals via `html.js` set before first paint.
      Dev-server latency measured: 15–20 ms, not the cause.
- [x] **Remove the after-click effects on buttons** — hover lift + sticker
      shadow gone.

## Sócios (membership)

- [x] **Split "Sócios" into two pages**:
  - [x] **Tornar-me Sócio** (`/pt/tornar-me-socio/`, `Join.astro` + `join.md`) —
        sign-up form + the benefits of being an associate + the 1 € fee.
  - [x] **Área de Sócio** (`/pt/area-de-socio/`, `Members.astro` +
        `members.md`) — members check their personal info, status, fees;
        static placeholder with a clear path to real access (mock + email
        route; no backend in v1 — data source still open above).
- [x] **No membership spam on the front page** — one quiet link at the bottom
      of the home (`home.joinQuiet`), never a pitch.

## New pages

- [x] **Donations page** (Doações, `/pt/doacoes/`) — what money buys
      (5/25/100 € tiers), IBAN / MB WAY placeholders, transparency note.
- [x] **Sponsors page** (Apoios, `/pt/apoios/`) — three tiers, "os níveis são
      conversas, não catálogos", become-a-sponsor CTA.

## Content

- [x] **Team page rework**:
  - [x] **Full department names** spelled out (expansions PLACEHOLDER until
        Ricardo confirms): Direção, DREE, DP, DL, DCI.
  - [x] **Headcounts**: Direção 4, DREE 5, DP 7, DL 6, DCI 5 (27 total;
        DL/DCI are guesses — see questions).
  - [x] **Big dummy profile pictures** — `scripts/avatars.mjs` generates a
        distinct SVG portrait per member (seeded by name).
  - [x] **Carousel per department** — CSS scroll-snap, focusable region,
        arrow keys scroll, zero JS.
- [x] **More events** — 10 placeholder events, split 4 past / 6 upcoming as
      of today (status is derived from dates, so the split happens on its own).
- [x] **About page redesign** — mission statement first, prose beside the
      cradle, values as colour panels, department map with accents; no longer
      reads like a wiki entry.

## Design & tone

- [x] **Design overhaul — stop being square and bland** — soft radii
      (`--radius-s/…/pill`), palette-identity panels and cards, the mark chips,
      the line-follower robot down the page, the playable cradle.
- [x] **Use the palette** — blue, pink, yellow, green, orange all carry real
      screen time (departments, value panels, listing cards, accents).
- [x] **Voice** — funny and easygoing, serious when it matters (mission,
      money): copy pass done across pages (e.g. "o café é levado muito a
      sério", "os níveis são conversas, não catálogos"). Real content should
      keep this register.
- [x] **The three cover PNGs** — resolved as "drop": no content entry sets
      `cover:` any more and detail pages only render a cover when present, so
      the near-identical art is never shown. The files remain in
      `src/assets/covers/` (nothing gets deleted without Ricardo's OK — see
      question below).

## Plumbing & housekeeping

- [x] **Routes + nav + UI strings for the new pages** — `members`, `donations`
      in `routes.ts`/`PAGE_KEYS`, strings in `ui.ts`, footer links + cross-links
      from Join. (The "three locales" of the old list is stale: there are two,
      `pt` + `en-gb`, and both build.)
- [x] **README/AGENTS/.agents sync** — repo map complete (Logo, Bulb, Flag,
      ThemeToggle, Playground, Values, MemberForm, PlaceholderLink;
      penpath.py, verify.mjs; the three client scripts), font row fixed
      (Bricolage, wght-only variant), page keys in CONTRIBUTING and
      content-model, theme.js decision recorded.
- [x] **Verification** — full pass below.

## Verification pass (25 Oct 2026)

All measured against the **built** output (a worktree at HEAD, served
statically — the dev server injects ~1 MB of Vite/toolbar JS and must never be
measured):

- `npm run build` → `astro check`: 0 errors, 0 warnings.
- `npm run contrast`: all pairs pass, light + dark.
- `node scripts/verify.mjs` (now including the keyboard items): 320 px
  overflow, one `h1`, no heading jumps, skip link first, no console errors,
  reduced-motion end state, mobile `<details>` menu operable, project filters
  operable — all pass on the 8 pt pages.
- Lighthouse 13.5.0 (mobile emulation): performance **98–100**, accessibility
  / best practices / SEO **100** on /pt/, /pt/projetos/, /pt/noticias/,
  /pt/noticias/apresentacao-plink/, /pt/doacoes/.
- Page weight (home, excl. images): **65 KB** (HTML 16 + CSS 7 + JS 2 gz,
  font 40 KB woff2) — the ≤ 150 KB budget holds after switching the font to
  the weight-only variable file (−91 KB).
- Known noise in the working tree at the time of writing: the in-flight
  `Logo.astro` work-in-progress renders `<image href="[object Object]">` in
  the hero masks (404s in the console) and carries a ts(6133) hint. That is
  uncommitted WIP by the logo pass, not a shipped regression — HEAD is clean.

## Questions for Ricardo

1. Department full names: real expansions for DREE / DP / DL / DCI?
2. DL and DCI headcounts ("etc.")?
3. Área de Sócio "check their info": where does the data come from in v1 —
   external form link, email, or a placeholder mock-up?
4. Donation details: real IBAN / MB WAY now or keep placeholders?
5. **New:** the three cover PNGs in `src/assets/covers/` are now unreferenced
   — OK to delete them, or keep for future content?
