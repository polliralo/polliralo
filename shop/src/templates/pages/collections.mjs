// /collections/ : shop all. A compact head and a row of category links, then
// the same filter bar and grid as the category pages (lib/catalog-view.js),
// plus a Category filter. An editorial tile closes the last row when it has
// empty slots.

import { breadcrumbList } from '../partials/seo.mjs';
import * as cv from '../../../site/assets/js/lib/catalog-view.js';

export default function render(ctx) {
  const { r, categories } = ctx;
  const products = ctx.products.filter((p) => !p.hidden);
  const total = products.length;
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections/' },
  ];

  const facets = cv.buildFacets(products, { categories, withCategory: true });
  const state = cv.emptyState();
  const counts = cv.facetCounts(products, state, facets);
  const names = categories.map((c) => c.name.toLowerCase().replace('t-shirts', 'T-shirts'));
  const list = `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

  // The olive polo on the terrace: no card on this page shows it (cards show
  // the cut-outs and still lifes), and it leads to the look it belongs to.
  const look = ctx.looks.find((l) => l.id === 'look-01');
  const polos = ctx.getCategory('polos');
  const tile = look && polos && ctx.media[polos.image.key] ? {
    image: polos.image.key, alt: polos.image.alt, kicker: 'Shop the look',
    line: look.line, href: '/#home-look-title', cta: 'See Look 01',
  } : null;

  const content = `
<div class="coll coll-all" data-coll data-category="">
  <div class="wrap page-head coll-head">
    ${r.breadcrumbs(crumbs)}
    <div class="coll-head-grid">
      <h1 class="coll-title">Shop all <em>menswear</em></h1>
      <p class="lede coll-lede">Every piece in the MONO line: shirts, T-shirts and polos, and the watches, sunglasses and accessories that finish them.</p>
      <p class="coll-total label tabular" data-total>${cv.stylesLabel(total)}</p>
    </div>
  </div>
  <div class="wrap coll-cats-wrap">
    ${cv.categoryNavHTML(categories, products, { current: '', includeAll: true })}
  </div>
  ${cv.listingHTML({ products, facets, state, counts, total, withCategory: true, title: 'All styles', tile })}
  ${cv.drawerHTML({ facets, state, counts, shown: total, withCategory: true })}
</div>`;

  return {
    title: 'Shop All Menswear',
    description: `All ${total} MONO essentials across ${list}.`,
    content,
    css: ['collection'],
    js: ['collection'],
    jsonld: [breadcrumbList(crumbs)],
    bodyClass: 'page-collection',
  };
}
