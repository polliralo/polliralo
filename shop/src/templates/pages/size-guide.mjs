// /size-guide/: demo body measurements from src/data/size-guide.json, the
// "how to measure" list and links to the sized categories.

import { esc } from '../../../site/assets/js/lib/render.js';
import { head, trail, onward, OG_DEFAULT } from '../partials/content.mjs';

function table(id, data, { caption }) {
  const [first, ...rest] = data.columns;
  return `<div class="table-wrap ct-table-wrap" role="region" aria-label="${esc(caption)}" tabindex="0">
    <table class="table ct-table" id="${id}-table">
      <caption class="visually-hidden">${esc(caption)}</caption>
      <thead><tr><th scope="col">${esc(first)}</th>${rest.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>
        ${data.rows.map(([size, ...cells]) => `<tr><th scope="row">${esc(size)}</th>${cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n        ')}
      </tbody>
    </table>
  </div>`;
}

export default function render(ctx) {
  const { r, sizeGuide: g } = ctx;
  const crumbs = trail('Size guide', '/size-guide/');
  const shopLinks = ['shirts', 't-shirts', 'polos']
    .map((slug) => ctx.getCategory(slug))
    .filter(Boolean)
    .map((c) => `<a class="link" href="${r.categoryUrl(c.slug)}">Shop ${esc(c.name.toLowerCase())}</a>`)
    .join('');
  const accessories = ctx.getCategory('accessories');

  const content = `
${head({
  crumbs: crumbs.html,
  eyebrow: 'Fit',
  title: 'Size guide',
  lede: 'Body measurements for every size, so you can pick yours before anything goes in your bag.',
  ghost: 'Fit',
})}

<nav class="wrap ct-jump" aria-label="Size tables">
  <ul class="ct-jump-list" role="list">
    <li><a class="chip ct-jump-chip" href="#tops">Tops</a></li>
    <li><a class="chip ct-jump-chip" href="#belts">Belts</a></li>
    <li><a class="chip ct-jump-chip" href="#measure">How to measure</a></li>
  </ul>
</nav>

<section class="wrap section-tight ct-size" id="tops" aria-labelledby="tops-title">
  <div class="ct-size-head">
    <p class="eyebrow">Tops</p>
    <h2 class="ct-h2" id="tops-title">${esc(g.tops.title)}</h2>
    <p class="muted">${esc(g.tops.unitNote)}</p>
  </div>
  <div class="ct-size-body" data-reveal>
    ${table('tops', g.tops, { caption: `${g.tops.title}: body measurements by size` })}
    <p class="ct-size-links">${shopLinks}</p>
  </div>
</section>

<section class="wrap section-tight ct-size" id="belts" aria-labelledby="belts-title">
  <div class="ct-size-head">
    <p class="eyebrow">Accessories</p>
    <h2 class="ct-h2" id="belts-title">${esc(g.belts.title)}</h2>
    <p class="muted">${esc(g.belts.unitNote)}</p>
  </div>
  <div class="ct-size-body" data-reveal>
    ${table('belts', g.belts, { caption: `${g.belts.title}: belt size by trouser waist` })}
    <p class="ct-size-links">${accessories ? `<a class="link" href="${r.categoryUrl(accessories.slug)}">Shop ${esc(accessories.name.toLowerCase())}</a>` : ''}<a class="link" href="/products/black-dress-belt/">See the belt</a></p>
  </div>
</section>

<section class="ct-measure" id="measure" aria-labelledby="measure-title">
  <div class="wrap ct-measure-grid">
    <figure class="ct-measure-figure" data-reveal>
      <div class="ct-measure-canvas">
        <span class="ghost-word ct-measure-word" data-word="Fit" aria-hidden="true"></span>
        ${r.picture('cut-ivory-oxford-shirt-front', {
          alt: 'The Ivory Oxford Shirt, worn buttoned, front view',
          sizes: '(min-width: 1040px) 34vw, (min-width: 760px) 44vw, 90vw',
          className: 'ct-measure-pic',
        })}
      </div>
      <figcaption class="ct-caption"><span class="label">Pictured</span> The Ivory Oxford Shirt, worn buttoned.</figcaption>
    </figure>
    <div class="ct-measure-words" data-reveal>
      <p class="eyebrow">Measuring</p>
      <h2 class="ct-h2" id="measure-title">How to measure</h2>
      <p class="muted">Use a soft tape measure and stand relaxed. Keep the tape level, snug but not tight.</p>
      <ol class="ct-steps" role="list">
        ${g.howToMeasure.map(([name, how], i) => `<li><span class="ct-step-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(name)}</h3><p>${esc(how)}</p></div></li>`).join('')}
      </ol>
      <p class="ct-tip"><span class="label">Between two sizes?</span> Choose the larger size for an easier fit, or the smaller one for a closer fit.</p>
      <p class="notice ct-demo-note">${esc(g.note)}</p>
    </div>
  </div>
</section>

${onward([
  ...['shirts', 't-shirts', 'polos', 'accessories'].map((slug) => ctx.getCategory(slug)).filter(Boolean)
    .map((c) => ({ href: r.categoryUrl(c.slug), label: c.name, note: c.description })),
], { title: 'Shop by category' })}`;

  return {
    title: 'Size Guide',
    description: 'MONO size guide: chest, neck and waist measurements for shirts, T-shirts and polos, belt sizes by trouser waist, and how to measure.',
    content,
    css: ['content'],
    js: ['content'],
    jsonld: [crumbs.jsonld],
    bodyClass: 'ct-page ct-size-page',
    ...OG_DEFAULT,
  };
}
