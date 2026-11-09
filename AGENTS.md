# AGENTS.md — working on the Associação Plink website

Guidance for developers (human or AI) changing this repository.
Detailed guides live in [`.agents/`](.agents/): [content model](.agents/content-model.md),
[i18n](.agents/i18n.md), [design tokens](.agents/design-tokens.md),
[performance](.agents/performance.md), [motion](.agents/motion.md), [verification](.agents/verification.md).

## Priorities (in order)

1. **Simplicity** — few concepts, few dependencies, small readable files.
2. **Elegance** — calm editorial design: large type, whitespace, one accent,
   hairline borders, no decoration for its own sake.
3. **Performance** — static HTML first, zero client JS, ≤ 150 KB/page
   (excluding images), Lighthouse ≥ 95 in all four categories.
4. **Maintainability** — routine content changes never touch code.

## Hard invariants (do not break without an explicit decision)

- **Zero client-side JavaScript — two documented exceptions.** The only
  `<script>` in the output is JSON-LD, plus two dependency-free files,
  accepted in writing here:
  - `/theme.js` (~1 KB): pins light/dark (the theme toggle's enhancement);
  - `/about-play.js`: the About page's Newton's cradle (vanilla canvas —
    chosen over p5.js for size and speed);
  - `/robot.js` (~15 lines): publishes `--scroll` so the line-follower robot
    accompanies the scroll in browsers without CSS scroll timelines.
  All three degrade to a complete page without JS, and all are self-hosted
  (`script-src 'self'` holds).
  CSS-only solutions (`:has()` filters, `<details>` menus) cover the rest.
  Anything new must be CSS-first.
- **No third-party requests at runtime** — no CDN fonts, no analytics, no
  embeds, no cookies.
- **All visual values come from `src/styles/tokens.css`.** No hard-coded colours,
  sizes or fonts in components (exception: `<meta name="theme-color">` mirrors
  `--color-bg`, and the favicon mirrors the wordmark's `--logo-spark` yellow —
  keep them in sync).
- **All non-visual parameters come from `src/config/site.ts`** (identity,
  locales, nav, contact, feature flags).
- **Content is data**: one file per item per locale folder; schema-validated by
  `src/content.config.ts`. Adding content must never require editing `.astro`.
- **Event status is derived from dates**, never stored (only `cancelled: true`
  is hand-set).
- **TypeScript strict**; `npm run build` runs `astro check` and must stay at
  0 errors / 0 warnings.
- **Colour pairs must pass WCAG AA** — `npm run contrast` after any colour edit.

## Where things live

| Concern | Location |
| --- | --- |
| Colours, type scale, spacing, motion | `src/styles/tokens.css` |
| Site identity, locales, nav, flags | `src/config/site.ts` |
| UI strings per locale | `src/i18n/ui.ts` |
| URL slugs per locale | `src/i18n/routes.ts` |
| Content schemas | `src/content.config.ts` |
| Localized queries / fallback logic | `src/lib/content.ts` |
| Page bodies | `src/views/*.astro` (routes in `src/pages/` stay thin) |
| Security/cache headers | `public/_headers` |
| Deployed perf gates (`npm run perf`) | `lighthouserc.json` |

## Conventions

- Components: small, semantic, scoped styles; shared primitives
  (`.container`, `.prose`, `.badge`, `.grid`, `.button`) in `global.css`.
- Accessibility is not optional: landmarks, one `h1` per page, no heading-level
  jumps, skip link, visible focus, `lang` per locale, keyboard-navigable menus.
- Links use the `href()`/`alternates()` helpers — never hand-written locale paths.
- Dates via `formatDate()`/`formatDateRange()` (Intl per locale).
- Comments explain *why* and mark placeholders (`PLACEHOLDER`, "conteúdo de
  exemplo") — the site ships with placeholder content that must be replaced.

## Workflow

1. Read the relevant `.agents/` guide before structural changes.
2. Match existing patterns before introducing new ones.
3. Small commits, imperative messages.
4. Verify before claiming done (`.agents/verification.md`):
   `npm run build` (0 errors/warnings), `npm run contrast`, and for
   visual/behavioural changes `npm run perf` (the deployed Lighthouse gate) +
   the 320 px / keyboard checks described there. `npm run profile` when the
   build itself gets slow.

## Extension points (already reserved)

- **Simulations**: mount in `<SimulationSlot />` on project detail pages, gate
  behind `SITE.features.simulations`, serve under `/simulacoes/*`, and enable
  COOP/COEP **only** for those routes (commented rules in `public/_headers`).
  Svelte may be added for this and only this.
- **Search**: `SITE.features.search` (Pagefind) — keep it lightweight if enabled.
- **Analytics**: `SITE.features.analytics`, permanently off unless explicitly
  accepted in writing (privacy page states no tracking).
