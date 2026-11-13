/**
 * News RSS feed per locale: /pt/rss.xml · /en-us/rss.xml · /en-gb/rss.xml
 */
import rss from '@astrojs/rss';
import { HTML_LANG, LOCALES, SITE, type Locale } from '../../config/site';
import { t } from '../../i18n';
import { href, BASE } from '../../i18n/routes';
import { publishedNews } from '../../lib/content';

export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export async function GET({ params }: { params: Record<string, string>; site?: URL }) {
  const locale = params.locale as Locale;
  const items = await publishedNews(locale);
  return rss({
    title: `${SITE.name} — ${t(locale, 'nav.news')}`,
    description: SITE.description[locale],
    site: `${SITE.url}${BASE}/`,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.date,
      link: href(locale, 'news', item.slug),
      categories: item.data.tags,
    })),
    customData: `<language>${HTML_LANG[locale]}</language>`,
  });
}
