// Site-wide SEO checks (shop/docs/research/seo.md, section 16; BUILD-SPEC
// sections 2 and 6). The route list comes from the catalogue, so new
// products and categories are covered automatically.
//   SHOP_TEST_PORT=4306 npx playwright test --config playwright.shop.config.mjs shop/tests/seo.spec.mjs

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SITE_URL, SEO_MODE } from '../src/config.mjs';

const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));

const INDEXABLE = [
  { path: '/', kind: 'home' },
  { path: '/collections/', kind: 'shop' },
  ...catalog.categories.map((c) => ({ path: `/collections/${c.slug}/`, kind: 'category' })),
  ...catalog.products.map((p) => ({ path: `/products/${p.slug}/`, kind: 'product' })),
  ...['about', 'contact', 'size-guide', 'privacy', 'shipping-returns'].map((s) => ({ path: `/${s}/`, kind: 'content' })),
];
const NOINDEX = [
  ...['search', 'cart', 'checkout', 'order-confirmation', 'product'].map((s) => ({ path: `/${s}/`, robots: 'noindex' })),
  ...['/admin/', '/admin/products/', '/admin/orders/'].map((path) => ({ path, robots: 'noindex, nofollow' })),
  { path: '/404.html', robots: 'noindex' },
];

const DEMO_TYPES = ['WebSite', 'Organization', 'BreadcrumbList'];
const LIVE_TYPES = [...DEMO_TYPES, 'OnlineStore', 'Product', 'ProductGroup'];
const ALLOWED_TYPES = SEO_MODE === 'live' ? LIVE_TYPES : DEMO_TYPES;
const LONG_DASH = /[\u2013\u2014]|&(?:mdash|ndash);|&#(?:8211|8212|x201[34]);/i;
// BUILD-SPEC section 2. "luxury" and "premium quality" are only banned as
// claims, but the copy has no reason to use them at all.
const BANNED = /\b(leverag\w*|seamless\w*|empower\w*|unlock\w*|robust\w*|actionable|data-driven|solutions|elevat\w*|curated|game-changer\w*|world-class|luxury|premium quality)\b/i;

const expectedUrl = (path) => (SITE_URL ? SITE_URL + path : path);

/** Everything a page check needs, read in one pass. */
async function readPage(page) {
  return page.evaluate(() => {
    const meta = (sel) => [...document.querySelectorAll(sel)].map((m) => m.getAttribute('content') ?? '');
    return {
      titles: [...document.head.querySelectorAll('title')].map((t) => t.textContent),
      descriptions: meta('meta[name="description"]'),
      robots: meta('meta[name="robots"]'),
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute('href')),
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      ogImage: meta('meta[property="og:image"]'),
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogImageAlt: meta('meta[property="og:image:alt"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
      crumbs: [...document.querySelectorAll('main .crumbs li')].map((li) => li.textContent.trim()),
      images: [...document.images].map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        width: img.getAttribute('width'),
        height: img.getAttribute('height'),
        priority: img.getAttribute('fetchpriority'),
      })),
      text: document.body.innerText,
    };
  });
}

/** Flattens JSON-LD blocks (including @graph) into a list of typed nodes. */
function nodesOf(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => nodesOf(v, out));
  else if (value && typeof value === 'object') {
    if (value['@type']) out.push(value);
    Object.values(value).forEach((v) => nodesOf(v, out));
  }
  return out;
}
const hasKey = (value, key) => JSON.stringify(value).includes(`"${key}"`);

async function commonChecks(page, request, route) {
  const res = await page.goto(route.path);
  expect(res.status(), 'status').toBe(200);
  const raw = await res.text();
  await page.waitForLoadState('networkidle');
  const info = await readPage(page);

  // One title, one description, one h1.
  expect(info.titles, 'exactly one <title>').toHaveLength(1);
  expect(info.titles[0].trim().length, 'title is not empty').toBeGreaterThan(0);
  expect(info.descriptions, 'exactly one meta description').toHaveLength(1);
  expect(info.descriptions[0].trim().length, 'description is not empty').toBeGreaterThan(0);
  expect(info.h1, 'exactly one h1').toHaveLength(1);
  expect(info.h1[0].length, 'h1 is not empty').toBeGreaterThan(0);

  // JSON-LD parses; only the allowed types; no reviews or ratings ever.
  const blocks = info.jsonld.map((text, i) => {
    try { return JSON.parse(text); } catch (err) { throw new Error(`JSON-LD block ${i + 1} does not parse: ${err.message}`); }
  });
  const nodes = nodesOf(blocks);
  for (const node of nodes) {
    const types = [].concat(node['@type']);
    const nested = ['ListItem', 'Brand', 'PeopleAudience', 'Offer', 'QuantitativeValue', 'MonetaryAmount', 'DefinedRegion'];
    for (const type of types) {
      if (nested.includes(type) && SEO_MODE === 'live') continue;
      if (type === 'ListItem') continue;
      expect(ALLOWED_TYPES, `JSON-LD @type "${type}"`).toContain(type);
    }
  }
  for (const key of ['review', 'aggregateRating']) expect(hasKey(blocks, key), `no "${key}" in JSON-LD`).toBe(false);
  if (SEO_MODE !== 'live') {
    for (const type of ['Product', 'ProductGroup', 'Offer', 'MerchantReturnPolicy', 'ShippingService', 'OnlineStore']) {
      expect(nodes.some((n) => [].concat(n['@type']).includes(type)), `no ${type} markup in demo mode`).toBe(false);
    }
  }

  // Breadcrumb JSON-LD names equal the visible trail.
  const trails = nodes.filter((n) => n['@type'] === 'BreadcrumbList');
  for (const t of trails) {
    const names = t.itemListElement.map((it) => it.name);
    expect(info.crumbs, 'visible breadcrumb matches BreadcrumbList').toEqual(names);
    t.itemListElement.forEach((it, i) => {
      if (i < t.itemListElement.length - 1) expect(it.item, `breadcrumb ${it.name} has a URL`).toBeTruthy();
    });
  }

  // Images: alt, width and height on every <img>; one LCP image at most.
  for (const img of info.images) {
    expect(img.alt, `alt on ${img.src}`).not.toBeNull();
    expect(Number(img.width), `width on ${img.src}`).toBeGreaterThan(0);
    expect(Number(img.height), `height on ${img.src}`).toBeGreaterThan(0);
  }
  expect(info.images.filter((i) => i.priority === 'high').length, 'at most one fetchpriority="high" image').toBeLessThanOrEqual(1);

  // Open Graph and X card.
  expect(info.ogTitle[0]?.trim(), 'og:title').toBeTruthy();
  expect(info.ogDescription[0]?.trim(), 'og:description').toBeTruthy();
  expect(info.twitterCard, 'twitter:card').toEqual(['summary_large_image']);
  expect(info.ogImage, 'one og:image').toHaveLength(1);
  const og = info.ogImage[0];
  if (SITE_URL) expect(og.startsWith('https://'), 'og:image is absolute https').toBe(true);
  const ogPath = og.startsWith('http') ? new URL(og).pathname : og;
  const ogRes = await request.get(ogPath);
  expect(ogRes.status(), `og:image ${ogPath} exists`).toBe(200);
  expect(ogRes.headers()['content-type'], `og:image ${ogPath} is an image`).toMatch(/^image\//);

  // Copy rules: no long dashes anywhere in the page, no banned words in what
  // people read (visible text, titles, descriptions, alt text).
  expect(LONG_DASH.test(raw), 'no long dash characters in the HTML').toBe(false);
  const readable = [
    info.text, info.titles.join(' '), info.descriptions.join(' '), info.ogTitle.join(' '),
    info.ogDescription.join(' '), info.ogImageAlt.join(' '), info.images.map((i) => i.alt ?? '').join(' '),
  ].join('\n');
  expect(LONG_DASH.test(readable), 'no long dash characters in the rendered text').toBe(false);
  const banned = readable.match(BANNED);
  expect(banned?.[0] ?? null, 'no banned words').toBeNull();

  return info;
}

test.describe('indexable pages', () => {
  for (const route of INDEXABLE) {
    test(`${route.path}`, async ({ page, request }) => {
      const info = await commonChecks(page, request, route);
      expect(info.robots.filter((r) => /noindex/i.test(r)), 'no noindex').toHaveLength(0);
      expect(info.canonicals, 'exactly one canonical').toHaveLength(1);
      expect(info.canonicals[0], 'canonical is the clean path with a trailing slash').toBe(expectedUrl(route.path));
      expect(info.descriptions[0].length, 'description is 155 characters or fewer').toBeLessThanOrEqual(155);
      if (route.kind === 'category' || route.kind === 'product') {
        expect(info.jsonld.some((j) => j.includes('"BreadcrumbList"')), 'BreadcrumbList on category and product pages').toBe(true);
      }
      if (route.kind === 'home') {
        const types = nodesOf(info.jsonld.map((j) => JSON.parse(j))).map((n) => n['@type']);
        expect(types, 'home has WebSite').toContain('WebSite');
        expect(types.some((t) => t === 'Organization' || t === 'OnlineStore'), 'home has Organization').toBe(true);
      }
    });
  }
});

test.describe('noindex pages', () => {
  for (const route of NOINDEX) {
    test(`${route.path}`, async ({ page, request }) => {
      const info = await commonChecks(page, request, route);
      expect(info.robots, 'one robots meta').toHaveLength(1);
      expect(info.robots[0].replace(/\s+/g, ' ').trim(), 'robots value').toBe(route.robots);
      expect(info.canonicals, 'no canonical on noindex pages').toHaveLength(0);
    });
  }
});

test.describe('site-wide', () => {
  test('titles and descriptions are unique across indexable pages', async ({ request }) => {
    const seen = { title: new Map(), description: new Map() };
    for (const { path } of INDEXABLE) {
      const html = await (await request.get(path)).text();
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
      seen.title.set(title, [...(seen.title.get(title) ?? []), path]);
      seen.description.set(description, [...(seen.description.get(description) ?? []), path]);
    }
    const dupes = Object.entries(seen).flatMap(([kind, map]) => [...map].filter(([, paths]) => paths.length > 1).map(([value, paths]) => `${kind} "${value}" on ${paths.join(', ')}`));
    expect(dupes).toEqual([]);
  });

  test('robots.txt allows everything and blocks none of the noindex pages', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/^User-agent: \*$/m);
    expect(text).toMatch(/^Allow: \/$/m);
    expect(text.split('\n').filter((l) => /^Disallow:\s*\S/i.test(l.trim()))).toEqual([]);
    if (SITE_URL) expect(text).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  test('sitemap lists only indexable pages (only when SITE_URL is set)', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    if (!SITE_URL) {
      expect(res.status(), 'no sitemap without SITE_URL').toBe(404);
      return;
    }
    expect(res.status()).toBe(200);
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs)).toEqual(new Set(INDEXABLE.map((r) => SITE_URL + r.path)));
  });

  test('an unknown address returns HTTP 404 with the not-found page', async ({ request }) => {
    for (const path of ['/this-page-does-not-exist/', '/products/not-a-product/', '/collections/nothing/here']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      expect(await res.text(), path).toContain('Page not found');
    }
  });
});
