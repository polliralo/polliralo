// /search/ : product search (noindex). The form works as a plain GET form;
// pages/search.js reads ?q=, shows results as you type and keeps the address
// in step. Without JavaScript a short note points to the categories.

import * as cv from '../../../site/assets/js/lib/catalog-view.js';

export default function render(ctx) {
  const { r, categories } = ctx;
  const products = ctx.products.filter((p) => !p.hidden);

  const suggestions = `<ul class="srch-cats" role="list">`
    + categories.map((c) => `<li><a class="srch-cat" href="/collections/${c.slug}/">`
      + `<span class="srch-cat-frame">${r.picture(c.image.key, { alt: '', sizes: '(min-width: 1040px) 15vw, (min-width: 760px) 30vw, 44vw', className: 'srch-cat-pic' })}</span>`
      + `<span class="srch-cat-name"><span>${r.esc(c.name)}</span><span class="srch-cat-n tabular">${cv.pad2(products.filter((p) => p.category === c.slug).length)}</span></span></a></li>`).join('')
    + `</ul>`;

  const content = `
<div class="srch" data-search-page>
  <div class="wrap srch-head">
    <p class="eyebrow tabular" data-search-eyebrow>${products.length} pieces in ${categories.length} categories</p>
    <h1 class="srch-title">Search</h1>
    <form class="srch-form" action="/search/" method="get" role="search" data-search-form>
      <label class="visually-hidden" for="srch-q">Search products</label>
      ${r.icon('search', { size: 24 })}
      <input class="srch-input" id="srch-q" name="q" type="search" placeholder="Shirts, watches, olive..." autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search" data-search-input>
      <button class="srch-clear" type="button" data-search-clear hidden aria-label="Clear search">${r.icon('close', { size: 20 })}</button>
      <button class="btn btn-sm srch-submit" type="submit">Search</button>
    </form>
    <p class="srch-status tabular" role="status" aria-live="polite" data-search-status></p>
    <noscript><p class="notice srch-noscript">Search runs in your browser and needs JavaScript. Every piece is still one click away in the categories below.</p></noscript>
  </div>
  <section class="wrap srch-results" aria-labelledby="srch-results-title" data-srch-results hidden>
    <h2 class="visually-hidden" id="srch-results-title">Results</h2>
    <div class="grid-products srch-grid" data-grid data-stagger></div>
  </section>
  <section class="wrap srch-empty" aria-labelledby="srch-empty-title" data-search-empty>
    <div class="srch-empty-text">
      <h2 class="srch-empty-title" id="srch-empty-title" data-empty-title>Start with a category</h2>
      <p class="muted" data-empty-text>Or type a word above: a colour like olive, a cloth like Oxford, or a piece like watch.</p>
    </div>
    ${suggestions}
  </section>
</div>`;

  return {
    title: 'Search',
    description: 'Search the MONO demo store for shirts, T-shirts, polos, watches, sunglasses and accessories.',
    noindex: true,
    content,
    css: ['collection'],
    js: ['search'],
    bodyClass: 'page-search',
  };
}
