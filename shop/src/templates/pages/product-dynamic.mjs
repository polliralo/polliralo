// /product/?slug=<slug>: a shell for products created in the demo admin, which
// have no pre-rendered page. product.js fills it from the store with the same
// builders the static product pages use (site/assets/js/lib/pdp-view.js).

export default function render(ctx) {
  const links = ctx.categories.map((c) => `<li><a class="link" href="${ctx.r.categoryUrl(c.slug)}">${ctx.r.esc(c.name)}</a></li>`).join('');
  return {
    title: 'Product',
    noindex: true,
    description: 'A product from the MONO demo store.',
    css: ['product'],
    js: ['product'],
    bodyClass: 'page-product',
    content: `<div class="pdp-shell" data-pdp-dynamic aria-busy="true">`
      + `<section class="wrap pdp-gone pdp-loading" data-pdp-loading>`
      + `<p class="eyebrow">Product</p>`
      + `<h1 class="pdp-gone-title">Loading the product</h1>`
      + `<p class="lede">One moment while the demo catalogue loads in your browser.</p>`
      + `<noscript><p class="lede">This page needs JavaScript. Browse the categories instead.</p></noscript>`
      + `<ul class="pdp-gone-cats" role="list">${links}</ul>`
      + `</section></div>`,
  };
}
