# Design tokens

`src/styles/tokens.css` is the **only** place where visual values are defined.
Components consume custom properties; nothing visual is hard-coded elsewhere
(synced exceptions: `<meta name="theme-color">` in `Base.astro`, and
`public/favicon.svg` / placeholder images which mirror the palette).

## Blocks in tokens.css

1. **Brand palette** — the seven swappable colours (`--palette-*`): blue, pink,
   yellow, green, orange, black, white. Rebranding = editing these.
2. **Semantic colours** — `--color-*` (bg, surface, text, text-muted, primary,
   primary-contrast, accent, border, focus, tint). Map them to the palette
   without touching components.
3. **Typography** — `--font-sans` / `--font-display` / `--font-mono` (mono is a
   system stack: zero bytes), fluid `--step--1 … --step-5` scale (`clamp()`),
   `--leading-*`, `--tracking-*`.
4. **Space & layout** — fluid `--space-3xs … --space-3xl`, `--measure` (65ch),
   `--container` (72rem), `--radius`, `--shadow`, `--border-width`.
5. **Motion** — `--duration`, `--ease`; all transitions are disabled under
   `prefers-reduced-motion` (in `global.css`).

Dark scheme: the same semantic tokens are redefined in two places —
`@media (prefers-color-scheme: dark) :root:not([data-theme='light'])` (OS
preference) and `:root[data-theme='dark']` (manual pin). The header toggle
sets `data-theme` via `/theme.js` — one of the four documented client
scripts (`/theme.js`, `/about-play.js`, `/robot.js`, `/pdf-form.js`, see
AGENTS.md); keep
both dark blocks in sync.

Brand artwork: `--logo-ink` / `--logo-spark` colour the wordmark (nome.svg)
so it flips to paper-white in the dark scheme. Shape language lives in
`--radius-s/…/pill`; each department owns a palette hue via `DEPT_ACCENT`
(src/lib/content.ts).

## Rules

- Contrast: every foreground/background pair must stay WCAG AA (4.5:1 text,
  3:1 UI). Run `npm run contrast` after any colour change — it reads
  tokens.css, resolves `var()` aliases and checks both schemes.
- Yellow is decorative-only (1.85:1 on the light background) — never use it for
  small text.
- Cards use **borders, not shadows** (`--shadow` exists for rare, tiny lift).
- Two type families and only two: **Fraunces Variable** (OFL) for display,
  **Space Grotesk Variable** (OFL) for body/UI — self-hosted Latin subsets via
  `@fontsource-variable`, `font-display: swap`. Space Grotesk: import the
  **`wght.css`** variant (styles use `font-weight` only). Fraunces: the
  **`standard.css`** file keeps its character axes (wonk/soft/opsz) — that
  character is the point of the serif. The system monospace stack is for
  semantic code in prose only (`.prose code`), never for design labels.
- Shared primitives live in `global.css` (`.container`, `.prose`, `.badge`,
  `.grid`, `.grid--chain` / `.grid--puzzle` (die-cut jigsaw pieces +
  `.grid-gap` empty slots — geometry from `--puzzle-knob`), `.button`,
  `.panel`, `.band`, `.eyebrow`, `.lead`, `.skip-link`);
  component-specific rules stay scoped inside their `.astro` file.
- Exception to "no hard-coded colours": flag SVGs (`Flag.astro`) and the
  favicon/brand artwork mirror real-world or brand colours.
