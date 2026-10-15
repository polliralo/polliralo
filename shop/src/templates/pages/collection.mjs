// /collections/<category>/ : one of the six category pages.
// Head: breadcrumbs, the giant faint category word behind the heading, the
// category's lifestyle photo beside it (words never sit on the photo), then the
// filter bar and grid shared with the shop-all page (lib/catalog-view.js).

import { breadcrumbList } from '../partials/seo.mjs';
import * as cv from '../../../site/assets/js/lib/catalog-view.js';

export default function render(ctx, route) {
  const { r, categories } = ctx;
  const category = ctx.getCategory(route.params.category);
  if (!category) throw new Error(`Unknown category: ${route.params.category}`);
  const all = ctx.products.filter((p) => !p.hidden);
  const products = all.filter((p) => p.category === category.slug);
  const total = products.length;
  const index = categories.findIndex((c) => c.slug === category.slug) + 1;

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
      <p class="eyebrow coll-eyebrow">Collection <span class="tabular">${cv.pad2(index)} / ${cv.pad2(categories.length)}</span></p>
      <h1 class="coll-title">${r.esc(category.title)}</h1>
      <p class="lede coll-lede">${r.esc(category.description)}</p>
      <p class="coll-total label tabular" data-total>${cv.stylesLabel(total)}</p>
      <div class="coll-photo">
        ${r.picture(category.image.key, { alt: category.image.alt, sizes: '(min-width: 1180px) 320px, (min-width: 760px) 25vw, 32vw', loading: 'eager', className: 'coll-photo-pic' })}
      </div>
    </div>
  </div>
  <div class="wrap coll-cats-wrap">
    ${cv.categoryNavHTML(categories, all, { current: category.slug, includeAll: true, variant: 'row' })}
  </div>
  ${cv.listingHTML({ products, facets, state, counts, total, withCategory: false, title: `${category.name}: all styles` })}
  <section class="section-tight coll-more" aria-labelledby="coll-more-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="coll-more-title">Keep <em>browsing</em></h2>
        <a class="link" href="/collections/">Shop all</a>
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
