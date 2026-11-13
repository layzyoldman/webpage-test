// Astro configuration for Associação Plink.
// Non-visual site parameters live in src/config/site.ts (single source of truth);
// visual parameters live in src/styles/tokens.css.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, LOCALES, DEFAULT_LOCALE, HTML_LANG } from './src/config/site';

export default defineConfig({
  // Public origin of the deployed site (GitHub Pages mirror by default,
  // overridable via SITE_URL — see src/config/site.ts).
  site: SITE.url,
  // Deploy base path: '/' at a domain root, '/<repo>/' on GitHub Pages project
  // sites (the deploy workflow sets BASE_PATH from the repository name).
  base: process.env.BASE_PATH || '/',
  output: 'static',
  // Directory-style output: every URL ends with "/" (canonical URLs follow the same rule).
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: {
      // The default locale lives under /pt/ ... (and is mirrored at / by src/pages/index.astro).
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // hreflang alternates for the three locales, keyed by URL path prefix.
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(LOCALES.map((l) => [l, HTML_LANG[l]])),
      },
    }),
  ],
});
