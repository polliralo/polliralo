// /collections/ : shop all. Same filter bar and grid as the category pages
// (lib/catalog-view.js), plus a Category filter and an index of the six
// categories beside the heading.

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

  const content = `
<div class="coll coll-all" data-coll data-category="">
  <div class="wrap page-head coll-head">
    ${r.breadcrumbs(crumbs)}
    <div class="coll-head-grid">
      <p class="eyebrow coll-eyebrow">All categories</p>
      <h1 class="coll-title">Shop all <em>menswear</em></h1>
      <p class="lede coll-lede">Every piece in the MONO line: shirts, T-shirts and polos, and the watches, sunglasses and accessories that finish them.</p>
      <p class="coll-total label tabular" data-total>${cv.stylesLabel(total)}</p>
      ${cv.categoryNavHTML(categories, products, { variant: 'index' })}
    </div>
  </div>
  ${cv.listingHTML({ products, facets, state, counts, total, withCategory: true, title: 'All styles' })}
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
