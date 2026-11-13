/**
 * src/config/site.ts — NON-VISUAL site parameters.
 *
 * Single source of truth for: identity, locales, contact, navigation, legal
 * information and feature flags. Nothing visual lives here (see
 * src/styles/tokens.css for the visual source of truth).
 *
 * Everything marked `// PLACEHOLDER` must be replaced before going live.
 */

/* ------------------------------------------------------------------ locales */

/** All locales served by the site. Order = order shown in the language switcher. */
export const LOCALES = ['pt', 'en-gb'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locale used at the root mirror and as the content fallback for every other locale. */
export const DEFAULT_LOCALE: Locale = 'pt';

/** Short labels for the language switcher (not translated; they are language names). */
export const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'PT',
  'en-gb': 'EN',
};

/** BCP-47 values for <html lang> and Intl formatters. */
export const HTML_LANG: Record<Locale, string> = {
  pt: 'pt-PT',
  'en-gb': 'en-GB',
};

/**
 * Content fallback chain: when a piece of content has no translation for the
 * requested locale, the first locale in its chain that HAS the content is used.
 * (Documented in CONTRIBUTING.md and .agents/i18n.md.)
 */
export const FALLBACKS: Record<Locale, Locale[]> = {
  pt: [],
  'en-gb': ['pt'],
};

/* -------------------------------------------------------------------- types */

/** A string that exists in every locale. */
export type Localized = Record<Locale, string>;

/* --------------------------------------------------------------- identity */

export const SITE = {
  /**
   * Public origin, no trailing slash. Default = the GitHub Pages mirror;
   * BASE_PATH supplies the project suffix (see `absoluteUrl()` in
   * src/i18n/routes.ts). Overridable at build time via the SITE_URL env var,
   * so switching to the final domain (plink.pt) is a deploy-time input:
   * `SITE_URL=https://plink.pt BASE_PATH=/ npm run build`.
   */
  url: process.env.SITE_URL || 'https://layzyoldman.github.io',
  /** Site name used in titles, headers and JSON-LD. */
  name: 'Associação Plink',
  /** Full legal designation. PLACEHOLDER. */
  legalName: 'Associação Plink', // PLACEHOLDER
  /** Portuguese legal/fiscal number (NIPC). PLACEHOLDER. */
  legalId: 'NIPC 000 000 000', // PLACEHOLDER
  /** Registered address, shown on the privacy/legal page. PLACEHOLDER. */
  address: 'Aveiro, Portugal', // PLACEHOLDER

  tagline: {
    pt: 'Projetos STEM pedagógicos, feitos por e para jovens.',
    'en-gb': 'Hands-on STEM learning projects, by and for young people.',
  } satisfies Localized,

  description: {
    pt: 'Associação Plink é uma associação de juventude portuguesa que facilita projetos pedagógicos de ciência, tecnologia, engenharia e matemática para jovens e apoia educadores com eventos, workshops e competições.',
    'en-gb': 'Associação Plink is a Portuguese youth association that facilitates hands-on STEM projects for young people and supports educators with events, workshops and competitions.',
  } satisfies Localized,

  /* ------------------------------------------------------------- contact */

  /** Primary contact address. PLACEHOLDER. */
  contactEmail: 'geral@associacaoplink.pt', // PLACEHOLDER
  /** External form for membership/project submissions (no backend in v1). PLACEHOLDER. */
  formUrl: 'https://example.org/formulario', // PLACEHOLDER

  /** Social profiles (JSON-LD `sameAs`). PLACEHOLDER URLs. */
  social: [
    { label: 'Instagram', url: 'https://www.instagram.com/associacao.plink/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/associa%C3%A7%C3%A3o-plink-b56260433/' },
  ],

  /* --------------------------------------------------------- navigation */

  /**
   * Main navigation, in order. Values are route keys defined in src/i18n/routes.ts;
   * labels are translated in src/i18n/ui.ts (`nav.<key>`).
   */
  nav: ['about', 'team', 'events', 'news', 'projects', 'sponsors', 'join'] as const,

  /* ------------------------------------------------------ feature flags */

  features: {
    /** Per-locale RSS feed of news at /<locale>/rss.xml/. */
    rss: true,
    /** Dark colour scheme: OS preference by default, optionally pinned by the
        header toggle via /theme.js (documented progressive enhancement). */
    darkMode: true,
    /** Interactive simulations on project pages (/simulacoes/ routes). Off in v1. */
    simulations: false,
    /** Full-text search (Pagefind). Off in v1. */
    search: false,
    /** Analytics of any kind. Permanently off unless explicitly accepted in writing. */
    analytics: false,
  },
};
