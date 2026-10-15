// /404.html: served for every unknown address (real HTTP 404). Every link is
// absolute because this page can appear at any depth. content.js brings the
// three product cards in line with admin edits in this browser.

import { esc, icon } from '../../../site/assets/js/lib/render.js';
import { OG_DEFAULT } from '../partials/content.mjs';

// Preferred picks: one shirt-type top, one polo, one watch.
export const NOT_FOUND_PICKS = ['olive-pique-polo', 'ivory-oxford-shirt', 'black-dial-watch'];

export default function render(ctx) {
  const { r } = ctx;
  const picks = NOT_FOUND_PICKS.map((slug) => ctx.getProduct(slug)).filter(Boolean);
  for (const p of ctx.products) if (picks.length < 3 && !picks.includes(p)) picks.push(p);

  const content = `
<section class="ct-nf" aria-labelledby="ct-nf-title">
  <span class="ghost-word ct-nf-ghost" data-word="404" aria-hidden="true"></span>
  <div class="wrap ct-nf-inner">
    <p class="eyebrow">Error 404</p>
    <h1 class="ct-nf-title" id="ct-nf-title">Page not found</h1>
    <p class="lede">The page you asked for is not here. It may have moved, or the address may have a typo. Try a search, or start from one of the collections.</p>
    <form class="ct-nf-search" action="/search/" method="get" role="search" aria-label="Search the shop">
      <label class="label" for="ct-nf-q">Search the shop</label>
      <div class="ct-nf-bar">
        ${icon('search', { size: 22 })}
        <input class="ct-nf-input" id="ct-nf-q" name="q" type="search" placeholder="Shirts, watches, olive..." autocomplete="off" enterkeyhint="search">
        <button class="btn btn-sm" type="submit">Search</button>
      </div>
    </form>
  </div>
</section>

<nav class="wrap ct-nf-cats" aria-labelledby="ct-nf-cats-title">
  <h2 class="label ct-nf-cats-title" id="ct-nf-cats-title">Collections</h2>
  <ul class="ct-nf-cat-list" role="list">
    ${ctx.categories.map((c, i) => `<li><a class="ct-nf-cat" href="${r.categoryUrl(c.slug)}"><span class="ct-nf-cat-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="ct-nf-cat-name">${esc(c.name)}</span>${icon('arrow', { size: 20 })}</a></li>`).join('')}
    <li><a class="ct-nf-cat" href="/collections/"><span class="ct-nf-cat-n" aria-hidden="true">${String(ctx.categories.length + 1).padStart(2, '0')}</span><span class="ct-nf-cat-name">Shop all</span>${icon('arrow', { size: 20 })}</a></li>
  </ul>
</nav>

<section class="wrap section-tight ct-nf-picks" aria-labelledby="ct-nf-picks-title">
  <div class="section-head">
    <h2 id="ct-nf-picks-title">A good place <em>to start</em></h2>
    <a class="link" href="/collections/">Shop all</a>
  </div>
  <div class="ct-nf-grid" data-nf-products data-picks="${esc(NOT_FOUND_PICKS.join(','))}">
    ${picks.slice(0, 3).map((p) => r.productCard(p, { sizes: '(min-width: 760px) 30vw, 68vw', headingLevel: 3 })).join('')}
  </div>
</section>`;

  return {
    title: 'Page Not Found',
    description: 'This page could not be found. Search the MONO demo store or start from one of its collections.',
    content,
    css: ['content'],
    js: ['content'],
    noindex: true,
    bodyClass: 'ct-page ct-nf-page',
    ...OG_DEFAULT,
  };
}
