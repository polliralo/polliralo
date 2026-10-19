// /collections/<category>/ : one of the six category pages.
// A compact head (breadcrumbs, title, one-line description, count), then the
// filter bar and grid shared with the shop-all page (lib/catalog-view.js).
// The category's photography lives in the editorial tile that closes an
// incomplete last row, never in the head as well, so no photo shows twice.

import { breadcrumbList } from '../partials/seo.mjs';
import * as cv from '../../../site/assets/js/lib/catalog-view.js';

// The Shop the Look section on the home page.
const LOOK_HREF = '/#home-look-title';

/**
 * One editorial tile per category: a real photo of that category that no
 * card shows (not a card's first image, not its hover image), one short line
 * built from the catalogue's own words, and a link to a real page.
 */
function tileFor(category, ctx) {
  const look = (id) => ctx.looks.find((l) => l.id === id);
  const altOf = (key) => (key === category.image.key ? category.image.alt
    : ctx.products.flatMap((p) => p.images ?? []).find((i) => i.key === key)?.alt ?? '');
  const tiles = {
    shirts: {
      image: 'ivory-oxford-shirt-closeup', kicker: 'Size guide',
      line: 'Chest and neck measurements for S to XXL, and how to measure.',
      href: '/size-guide/', cta: 'Find your size',
    },
    't-shirts': {
      image: category.image.key, kicker: 'Wear it with',
      line: 'A crew neck under an open Oxford shirt.',
      href: '/collections/shirts/', cta: 'Shop shirts',
    },
    polos: {
      image: category.image.key, kicker: 'Shop the look',
      line: look('look-01')?.line, href: LOOK_HREF, cta: 'See Look 01',
    },
    watches: {
      image: 'wide-watch-desk', wide: true, x: '72%', kicker: 'Finish the outfit',
      line: 'A brown bifold wallet and a black dress belt.',
      href: '/collections/accessories/', cta: 'Shop accessories',
    },
    sunglasses: {
      image: category.image.key, kicker: 'Pair them with',
      line: 'A piqué polo in olive or navy.',
      href: '/collections/polos/', cta: 'Shop polos',
    },
    accessories: {
      image: 'wide-accessories-table', wide: true, x: '52%', kicker: 'Shop the look',
      line: look('look-02')?.line, href: LOOK_HREF, cta: 'See Look 02',
    },
  };
  const tile = tiles[category.slug];
  if (!tile || !tile.line || !ctx.media[tile.image]) return null;
  return { ...tile, alt: altOf(tile.image) };
}

export default function render(ctx, route) {
  const { r, categories } = ctx;
  const category = ctx.getCategory(route.params.category);
  if (!category) throw new Error(`Unknown category: ${route.params.category}`);
  const all = ctx.products.filter((p) => !p.hidden);
  const products = all.filter((p) => p.category === category.slug);
  const total = products.length;

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections/' },
    { name: category.name, url: `/collections/${category.slug}/` },
  ];

  const facets = cv.buildFacets(products, { categories, withCategory: false });
  const state = cv.emptyState();
  const counts = cv.facetCounts(products, state, facets);
  const others = categories.filter((c) => c.slug !== category.slug);

  const cutNames = products.filter((p) => p.images?.[0]?.kind === 'cutout').map((p) => p.name);
  const ogImageAlt = cutNames.length >= 2
    ? `MONO ${category.name}: ${cutNames[0]} and ${cutNames[1]} on a plain canvas`
    : `MONO ${category.name}: ${category.image.alt.charAt(0).toLowerCase()}${category.image.alt.slice(1)}`;

  const content = `
<div class="coll" data-coll data-category="${r.esc(category.slug)}">
  <div class="wrap page-head coll-head">
    ${r.breadcrumbs(crumbs)}
    <div class="coll-head-grid">
      <h1 class="coll-title">${r.esc(category.title)}</h1>
      <p class="lede coll-lede">${r.esc(category.description)}</p>
      <p class="coll-total label tabular" data-total>${cv.stylesLabel(total)}</p>
    </div>
  </div>
  <div class="wrap coll-cats-wrap">
    ${cv.categoryNavHTML(categories, all, { current: category.slug, includeAll: true })}
  </div>
  ${cv.listingHTML({ products, facets, state, counts, total, withCategory: false, title: `${category.name}: all styles`, tile: tileFor(category, ctx) })}
  <section class="section-tight coll-more" aria-labelledby="coll-more-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="coll-more-title">Keep <em>browsing</em></h2>
        <a class="link" href="/collections/">Shop all${r.icon('arrow', { size: 16 })}</a>
      </div>
      <ul class="coll-more-list" role="list">
        ${others.map((c) => `<li><a class="coll-more-card" href="/collections/${c.slug}/">`
          + `<span class="coll-more-frame">${r.picture(c.image.key, { alt: '', sizes: '(min-width: 1040px) 18vw, (min-width: 760px) 30vw, 44vw', className: 'coll-more-pic' })}</span>`
          + `<span class="coll-more-name"><span>${r.esc(c.name)}</span>${r.icon('arrow', { size: 16 })}</span></a></li>`).join('\n        ')}
      </ul>
    </div>
  </section>
  ${cv.drawerHTML({ facets, state, counts, shown: total, withCategory: false })}
</div>`;

  return {
    title: category.title,
    description: `${category.description} ${cv.stylesLabel(total).replace(/^./, (c) => c.toUpperCase())}.`,
    content,
    css: ['collection'],
    js: ['collection'],
    jsonld: [breadcrumbList(crumbs)],
    ogImage: `/assets/img/og/collection-${category.slug}.jpg`,
    ogImageAlt,
    activeCategory: category.slug,
    bodyClass: 'page-collection',
  };
}
