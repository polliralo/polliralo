// Site-wide settings for the MONO build.
//
// SITE_URL: the live address, with no trailing slash, for example
// "https://mono.example.com". Leave it empty until the site has its own
// address. While it is empty, canonical links are written as paths and no
// sitemap.xml is written (a sitemap needs full addresses). After setting it,
// run `npm run shop:build` again and upload the site.
export const SITE_URL = '';

// SEO_MODE: 'demo' (default) keeps commerce markup out of the pages, because the
// products and prices are fictional. 'live' adds Product/ProductGroup/Offer
// JSON-LD; switch to it only with real prices, stock, checkout and policies.
export const SEO_MODE = 'demo';

export const SITE_NAME = 'MONO';
export const TAGLINE = 'Less noise. Better essentials.';
export const DEFAULT_DESCRIPTION = 'MONO is a demo menswear store: shirts, T-shirts, polos, watches, sunglasses and accessories with quiet, considered design.';
export const DEFAULT_OG_IMAGE = '/assets/img/og-default.jpg';
export const THEME_COLOR = '#F5F2EC';
