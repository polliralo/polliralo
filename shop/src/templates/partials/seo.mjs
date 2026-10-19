// Shared structured data (JSON-LD) builders. Rules: shop/docs/research/seo.md.
// Markup must match what the page shows. No reviews, ratings, addresses or
// phone numbers: MONO has none.

import { SITE_URL, SITE_NAME, SEO_MODE, DEFAULT_DESCRIPTION } from '../../config.mjs';

/** Absolute URL when SITE_URL is set, otherwise the path (JSON-LD tolerates it). */
export const url = (path) => (SITE_URL ? SITE_URL + path : path);

/** BreadcrumbList from the same items the visible trail uses: [{ name, url }]. */
export function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(i < items.length - 1 || it.url ? { item: url(it.url) } : {}),
    })),
  };
}

/** WebSite (home page only). No SearchAction: Google retired the sitelinks search box. */
export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'MONO menswear',
    url: url('/'),
  };
}

/** Organization (home page). OnlineStore only in live mode. */
export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': SEO_MODE === 'live' ? 'OnlineStore' : 'Organization',
    name: SITE_NAME,
    url: url('/'),
    logo: url('/assets/img/logo-512.png'),
    description: DEFAULT_DESCRIPTION,
  };
}

export const isLive = () => SEO_MODE === 'live';
