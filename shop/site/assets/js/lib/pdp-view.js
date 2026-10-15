// Product page markup builders. Pure functions (no window or document at
// import time), shared by the Node build (src/templates/pages/product.mjs and
// product-dynamic.mjs) and the browser (assets/js/pages/product.js), so a
// re-render after an admin edit produces exactly the pre-rendered markup.

import { esc, money, picture, productUrl, categoryUrl, productCard, icon, mediaInfo, stockInfo, needsChoice } from './render.js';
import { SHIPPING_OPTIONS, FREE_SHIPPING_OVER, MAX_QTY } from './pricing.js';

export { MAX_QTY };
/** At or below this many, the stock line names the number ("Only 2 left in XL"). Real data only. */
export const LOW_STOCK = 3;

const CLOTHING = new Set(['shirts', 't-shirts', 'polos']);

/* ----- Small helpers ----- */

const two = (n) => String(n).padStart(2, '0');
const stockOf = (v) => Math.max(0, Number(v?.stock) || 0);
const optionName = (p) => p.option?.label ?? 'Size';
export const isSized = (p) => needsChoice(p);

/** The giant faint word behind the cut-out: the last word of the name ("Polo", "Shirt", "Tee"). */
export function ghostWord(p) {
  const words = String(p.name ?? '').trim().split(/\s+/);
  return words.at(-1) || 'Mono';
}

/** Breadcrumb items: Home / Shop / Category / Product (also used for BreadcrumbList). */
export function trail(p, category) {
  return [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/collections/' },
    ...(category ? [{ name: category.name, url: categoryUrl(category.slug) }] : []),
    { name: p.name, url: productUrl(p) },
  ];
}

/** Which size table fits the product: 'tops', 'belts' or null (no picker, no guide). */
export function guideKind(p) {
  if (!isSized(p)) return null;
  if (p.option?.type === 'waist') return 'belts';
  if (p.option?.type === 'size' || CLOTHING.has(p.category)) return 'tops';
  return null;
}

/** Case-insensitive match of a ?size= value against the variants. Unknown or sold out: null. */
export function matchVariant(p, value) {
  if (!value || !isSized(p)) return null;
  const want = String(value).trim().toLowerCase();
  const v = p.variants.find((x) => String(x.id).toLowerCase() === want || String(x.label).toLowerCase() === want);
  return v && stockOf(v) > 0 ? v.id : null;
}

/**
 * Stock line for the chosen option, from the data only.
 * Returns { state: 'in' | 'low' | 'out' | 'none', text }.
 */
export function stockLine(p, variantId) {
  const sized = isSized(p);
  const variant = sized ? p.variants.find((v) => v.id === variantId) : p.variants?.[0];
  if (!variant) {
    const out = (p.variants ?? []).filter((v) => stockOf(v) === 0).map((v) => v.label);
    if (sized && out.length && out.length < p.variants.length) {
      return { state: 'none', text: `Sold out in ${out.join(', ')}` };
    }
    if (sized && out.length && out.length === p.variants.length) return { state: 'out', text: 'Sold out' };
    return { state: 'none', text: '' };
  }
  const n = stockOf(variant);
  const where = sized ? ` in ${variant.label}` : '';
  if (n === 0) return { state: 'out', text: `Sold out${where}` };
  if (n <= LOW_STOCK) return { state: 'low', text: `Only ${n} left${where}` };
  return { state: 'in', text: 'In stock' };
}

/** Highest quantity the stepper allows for the chosen option (1 when nothing fits). */
export function qtyCap(p, variantId, max = MAX_QTY) {
  const sized = isSized(p);
  const variant = sized ? p.variants.find((v) => v.id === variantId) : p.variants?.[0];
  const stock = variant ? stockOf(variant) : Math.max(0, ...(p.variants ?? []).map(stockOf));
  return Math.max(1, Math.min(stock, max));
}

/* ----- Data gathering (same rules in Node and the browser) ----- */

/**
 * collect(product, { getProduct, getCategory, products, sizeGuide })
 * `products` is the visible catalogue in display order.
 */
export function collect(p, { getProduct, getCategory, products = [], sizeGuide = null }) {
  const visible = products.filter((x) => x && !x.hidden);
  const category = getCategory(p.category);
  const siblings = p.group ? visible.filter((x) => x.group === p.group || x.slug === p.slug) : [];
  const look = (p.completeTheLook ?? [])
    .map((slug) => getProduct(slug))
    .filter((x) => x && !x.hidden && x.slug !== p.slug);
  return { category, siblings, look, more: moreProducts(p, visible), sizeGuide };
}

/** "More in {category}": the same category first, then other pieces, at least 4 and at most 6. */
export function moreProducts(p, products) {
  const pool = products.filter((x) => !x.hidden && x.slug !== p.slug);
  const lookSet = new Set(p.completeTheLook ?? []);
  const same = pool.filter((x) => x.category === p.category);
  const family = (x) => CLOTHING.has(x.category) === CLOTHING.has(p.category);
  const others = pool.filter((x) => x.category !== p.category);
  const ranked = [
    ...others.filter((x) => family(x) && !lookSet.has(x.slug)),
    ...others.filter((x) => !family(x) && !lookSet.has(x.slug)),
    ...others.filter((x) => lookSet.has(x.slug)),
  ];
  return [...same, ...ranked].slice(0, Math.max(4, Math.min(6, same.length + 4)));
}

/* ----- Gallery ----- */

const EXPAND = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

function slideKind(img) {
  if (img.kind === 'cutout') return 'cut';
  const m = mediaInfo(img.key);
  return m && m.w > m.h * 1.2 ? 'wide' : 'photo';
}

const SLIDE_SIZES = '(min-width: 1180px) 600px, (min-width: 761px) 46vw, 100vw';

function slideHTML(img, i) {
  const kind = slideKind(img);
  return `<div class="pdp-slide is-${kind}${i === 0 ? ' is-active' : ''}" data-slide="${i}"${i === 0 ? '' : ' aria-hidden="true"'}>`
    + picture(img.key, {
      alt: img.alt ?? '',
      sizes: SLIDE_SIZES,
      priority: i === 0,
      attrs: 'draggable="false"',
    })
    + `</div>`;
}

function thumbHTML(img, i, n) {
  const kind = slideKind(img);
  const view = img.view ?? `Image ${i + 1}`;
  return `<button type="button" class="pdp-thumb is-${kind}" data-thumb="${i}" aria-label="Image ${i + 1} of ${n}: ${esc(view)}"`
    + `${i === 0 ? ' aria-current="true" tabindex="0"' : ' tabindex="-1"'}>`
    + picture(img.key, { alt: '', sizes: '96px' })
    + `</button>`;
}

/** Thumbnails, the main frame (#pdp-media, first image at first paint), counter and dots. */
export function galleryHTML(p) {
  const images = p.images ?? [];
  const n = images.length;
  const first = images[0];
  const multi = n > 1;
  return `<div class="pdp-gallery${multi ? '' : ' is-single'}" data-pdp-gallery data-count="${n}">`
    + (multi ? `<div class="pdp-thumbs" role="group" aria-label="Product images" data-pdp-thumbs>${images.map((img, i) => thumbHTML(img, i, n)).join('')}</div>` : '')
    + `<div class="pdp-stage">`
    + `<div class="pdp-frame${first?.kind === 'cutout' ? ' starts-cut' : ''}" data-pdp-frame>`
    + `<span class="ghost-word pdp-ghost" data-word="${esc(ghostWord(p))}" aria-hidden="true"></span>`
    + `<div id="pdp-media" class="pdp-track" data-pdp-track role="region" aria-label="Images of ${esc(p.name)}">`
    + (n ? images.map(slideHTML).join('') : `<div class="pdp-slide is-photo is-active" data-slide="0">${picture('', { alt: p.name })}</div>`)
    + `</div>`
    + (n ? `<button type="button" class="pdp-zoom" data-pdp-zoom aria-haspopup="dialog" aria-label="View images full screen">${EXPAND}</button>` : '')
    + `</div>`
    + (multi
      ? `<div class="pdp-meta">`
        + `<p class="pdp-count tabular" aria-hidden="true"><span data-pdp-index>01</span> / ${two(n)}</p>`
        + `<div class="pdp-progress" aria-hidden="true"><i style="--w: ${(1 / n).toFixed(4)}; --x: 0"></i></div>`
        + `<p class="pdp-view label" data-pdp-view aria-hidden="true">${esc(first?.view ?? '')}</p>`
        + `<div class="pdp-dots" role="group" aria-label="Choose image">`
        + images.map((img, i) => `<button type="button" class="pdp-dot" data-dot="${i}" aria-label="Image ${i + 1} of ${n}"${i === 0 ? ' aria-current="true"' : ''}><span></span></button>`).join('')
        + `</div></div>`
      : '')
    + `</div></div>`;
}

/** Full-screen viewer <dialog>: every image, contained, with previous / next. */
export function viewerHTML(p) {
  const images = p.images ?? [];
  const n = images.length;
  if (!n) return '';
  return `<dialog class="pdp-viewer" id="pdp-viewer" aria-labelledby="pdp-viewer-title" data-pdp-viewer>`
    + `<div class="pdp-viewer-head">`
    + `<h2 class="pdp-viewer-title" id="pdp-viewer-title">${esc(p.name)}</h2>`
    + `<p class="pdp-viewer-count tabular"><span data-viewer-index>01</span> / ${two(n)}</p>`
    + `<button class="icon-btn" type="button" data-close-dialog aria-label="Close images">${icon('close', { size: 22 })}</button>`
    + `</div>`
    + `<div class="pdp-viewer-track" data-viewer-track>`
    + images.map((img, i) => `<div class="pdp-viewer-slide is-${slideKind(img)}" data-viewer-slide="${i}">`
      + picture(img.key, { alt: img.alt ?? '', sizes: '(min-width: 761px) 70vw, 100vw', attrs: 'draggable="false"' })
      + `</div>`).join('')
    + `</div>`
    + (n > 1
      ? `<button class="pdp-viewer-nav is-prev" type="button" data-viewer-prev aria-label="Previous image">${icon('left', { size: 22 })}</button>`
        + `<button class="pdp-viewer-nav is-next" type="button" data-viewer-next aria-label="Next image">${icon('right', { size: 22 })}</button>`
      : '')
    + `</dialog>`;
}

/* ----- Buy panel ----- */

function colourHTML(p, siblings) {
  const name = p.colour?.name ?? '';
  if (siblings.length > 1) {
    return `<div class="pdp-colour">`
      + `<p class="pdp-label label">Colour: <span data-pdp-colour>${esc(name)}</span></p>`
      + `<ul class="pdp-swatches" role="list" aria-label="Colour">`
      + siblings.map((s) => (s.slug === p.slug
        ? `<li><span class="pdp-sw" aria-current="true" data-colour="${esc(s.colour?.name ?? '')}"><span class="swatch is-on" style="--sw: ${esc(s.colour?.hex ?? '#ccc')}"></span><span class="visually-hidden">${esc(s.colour?.name ?? '')}, current colour</span></span></li>`
        : `<li><a class="pdp-sw" href="${productUrl(s)}" data-colour="${esc(s.colour?.name ?? '')}" aria-label="${esc(s.colour?.name ?? s.name)}"><span class="swatch" style="--sw: ${esc(s.colour?.hex ?? '#ccc')}"></span></a></li>`)).join('')
      + `</ul></div>`;
  }
  if (!name) return '';
  return `<div class="pdp-colour">`
    + `<p class="pdp-label label">Colour</p>`
    + `<p class="pdp-colour-one"><span class="dot" style="--dot: ${esc(p.colour?.hex ?? '#ccc')}" aria-hidden="true"></span>${esc(name)}</p>`
    + `</div>`;
}

/** The option picker: a native radio group styled as chips. Empty for one-size products. */
export function optionsHTML(p, { selected = null } = {}) {
  if (!isSized(p)) return '';
  const label = optionName(p);
  const guide = guideKind(p);
  const chosen = p.variants.find((v) => v.id === selected && stockOf(v) > 0);
  return `<div class="pdp-option" data-pdp-option>`
    + `<fieldset class="pdp-options" role="radiogroup" data-pdp-options>`
    + `<legend class="pdp-label label">${esc(label)}<span data-pdp-chosen>${chosen ? `: ${esc(chosen.label)}` : ''}</span></legend>`
    + `<div class="chips pdp-chips">`
    + p.variants.map((v) => {
      const out = stockOf(v) === 0;
      return `<label class="chip${out ? ' is-out' : ''}${chosen?.id === v.id ? ' is-on' : ''}">`
        + `<input class="pdp-radio" type="radio" name="size" value="${esc(v.id)}" data-stock="${stockOf(v)}" data-label="${esc(v.label)}"${out ? ' disabled' : ''}${chosen?.id === v.id ? ' checked' : ''}>`
        // Sold out: the name reads "S, sold out" (the visible letter is hidden from the name).
        + (out ? `<span aria-hidden="true">${esc(v.label)}</span><span class="visually-hidden">${esc(v.label)}, sold out</span>` : `<span>${esc(v.label)}</span>`)
        + `</label>`;
    }).join('')
    + `</div>`
    + `<p class="field-error pdp-error" id="pdp-size-error" data-pdp-error hidden>${icon('close', { size: 14 })}<span>Choose a ${esc(label.toLowerCase())}</span></p>`
    + `</fieldset>`
    + (guide ? `<button type="button" class="pdp-guide-btn" data-open-guide aria-haspopup="dialog">Size guide</button>` : '')
    + `</div>`;
}

function stepperHTML(p, { selected = null, disabled = false } = {}) {
  const cap = qtyCap(p, selected);
  return `<div class="stepper pdp-qty" role="group" aria-label="Quantity" data-pdp-qty data-max="${cap}">`
    + `<button type="button" data-step="-1" aria-label="Decrease quantity" disabled>${icon('minus', { size: 14 })}</button>`
    + `<output data-pdp-qty-value aria-live="polite">1</output>`
    + `<button type="button" data-step="1" aria-label="Increase quantity"${disabled || cap <= 1 ? ' disabled' : ''}>${icon('plus', { size: 14 })}</button>`
    + `</div>`;
}

/** Everything inside the buy form: options, stock line, quantity and the Add to bag button. */
export function formInnerHTML(p, { selected = null } = {}) {
  const info = stockInfo(p);
  const soldOut = !info.inStock;
  const stock = stockLine(p, selected);
  return optionsHTML(p, { selected })
    + `<p class="pdp-stock" data-pdp-stock data-state="${stock.state}" aria-live="polite">${esc(stock.text)}</p>`
    + `<div class="pdp-actions">`
    + stepperHTML(p, { selected, disabled: soldOut })
    + (soldOut
      ? `<button class="btn pdp-add" type="button" data-pdp-add disabled>Sold out</button>`
      : `<button class="btn pdp-add" type="submit" data-pdp-add><span class="pdp-add-label" data-add-label>Add to bag</span><span class="pdp-add-done" data-add-done aria-hidden="true">${icon('check', { size: 16 })}Added</span></button>`)
    + `</div>`;
}

function formHTML(p, opts) {
  const sized = isSized(p);
  const one = sized ? null : p.variants?.[0];
  return `<form class="pdp-form" method="get" novalidate data-pdp-form data-slug="${esc(p.slug)}" data-sized="${sized}"`
    + ` data-option="${esc(optionName(p))}"${one ? ` data-variant="${esc(one.id)}" data-stock="${stockOf(one)}"` : ''}>`
    // Spans from far above the form to its bottom edge: when it leaves the
    // viewport the shopper has scrolled past Add to bag (sticky phone bar).
    + `<span class="pdp-sentinel" data-pdp-sentinel aria-hidden="true"></span>`
    + `<div class="pdp-form-body" data-pdp-form-body>${formInnerHTML(p, opts)}</div>`
    + `</form>`;
}

/** Details disclosure body: description, details and SKU (facts from the data only). */
export function detailsBodyHTML(p) {
  return `<p>${esc(p.description ?? p.summary ?? '')}</p>`
    + (p.details?.length ? `<ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '')
    + (p.sku ? `<p class="pdp-sku small">SKU <span class="tabular">${esc(p.sku)}</span></p>` : '');
}

function fitHTML(p, sizeGuide) {
  const kind = guideKind(p);
  if (!kind) return '';
  const table = sizeGuide?.[kind];
  const first = p.variants[0]?.label;
  const last = p.variants.at(-1)?.label;
  const range = kind === 'belts' ? `Waist sizes ${first} to ${last}.` : `Sizes ${first} to ${last}.`;
  return `<details class="acc"><summary>Size and fit</summary><div class="acc-body">`
    + `<p>${esc(range)}${table?.unitNote ? ` ${esc(table.unitNote)}` : ''}</p>`
    + `<p class="pdp-acc-links"><button type="button" class="text-link" data-open-guide aria-haspopup="dialog">Open the size guide</button>`
    + `<a class="text-link" href="/size-guide/">Full size guide</a></p>`
    + `</div></details>`;
}

function deliveryHTML() {
  return `<details class="acc"><summary>Delivery and returns</summary><div class="acc-body">`
    + `<ul class="pdp-ship" role="list">`
    + SHIPPING_OPTIONS.map((o) => `<li><span class="pdp-ship-name">${esc(o.name)}</span><span class="muted">${esc(o.eta)}</span>`
      + `<span class="tabular">${money(o.price)}${o.freeOver != null ? `, free over ${money(o.freeOver)}` : ''}</span></li>`).join('')
    + `</ul>`
    + `<p class="small muted">Demo rates. Nothing is delivered in this demo store.</p>`
    + `<p><a class="text-link" href="/shipping-returns/">Shipping and returns</a></p>`
    + `</div></details>`;
}

/** The three disclosures under the buy form. */
export function disclosuresHTML(p, sizeGuide) {
  return `<div class="pdp-acc">`
    + `<details class="acc" open><summary>Details</summary><div class="acc-body" data-pdp-details>${detailsBodyHTML(p)}</div></details>`
    + fitHTML(p, sizeGuide)
    + deliveryHTML()
    + `</div>`;
}

/* ----- Complete the look ----- */

function lookItemHTML(x) {
  const img = x.images?.[0];
  const sized = isSized(x);
  const info = stockInfo(x);
  const optLabel = optionName(x);
  let add;
  if (!info.inStock) add = `<p class="pdp-look-out small muted">Sold out</p>`;
  else if (!sized) {
    add = `<button type="button" class="pdp-look-add" data-look-add="${esc(x.slug)}" data-variant="${esc(x.variants[0].id)}">`
      + `<span class="pdp-add-label" data-add-label>Add<span class="visually-hidden"> ${esc(x.name)} to bag</span></span>`
      + `<span class="pdp-add-done" data-add-done aria-hidden="true">Added</span></button>`;
  } else {
    add = `<div class="pdp-look-sizes" role="group" aria-label="Add ${esc(x.name)}, choose ${esc(optLabel.toLowerCase())}">`
      + x.variants.map((v) => (stockOf(v) > 0
        ? `<button type="button" class="chip" data-look-add="${esc(x.slug)}" data-variant="${esc(v.id)}" aria-label="${esc(optLabel)} ${esc(v.label)}">${esc(v.label)}</button>`
        : `<span class="chip is-out" aria-disabled="true">${esc(v.label)}<span class="visually-hidden"> sold out</span></span>`)).join('')
      + `</div>`;
  }
  return `<li class="pdp-look-item${img?.kind === 'cutout' ? ' is-cut' : ''}" data-look-slug="${esc(x.slug)}">`
    + `<a class="pdp-look-media" href="${productUrl(x)}" tabindex="-1" aria-hidden="true">${img ? picture(img.key, { alt: '', sizes: '96px' }) : ''}</a>`
    + `<div class="pdp-look-body">`
    + `<h3 class="pdp-look-name"><a href="${productUrl(x)}">${esc(x.name)}</a></h3>`
    + `<p class="pdp-look-price tabular">${money(x.price)}</p>`
    + `</div>`
    + `<div class="pdp-look-act">${add}</div>`
    + `</li>`;
}

export function lookHTML(items) {
  if (!items?.length) return '';
  return `<section class="pdp-look" aria-labelledby="pdp-look-title" data-pdp-look>`
    + `<h2 class="pdp-look-title label" id="pdp-look-title">Complete the look</h2>`
    + `<ul class="pdp-look-list" role="list">${items.map(lookItemHTML).join('')}</ul>`
    + `</section>`;
}

/* ----- More in {category} ----- */

export function moreHTML(p, category, items) {
  if (!items?.length) return '';
  const catName = category?.name ?? 'the shop';
  return `<section class="pdp-more" aria-labelledby="pdp-more-title" data-pdp-more>`
    + `<div class="wrap">`
    + `<div class="rail-wrap" data-rail>`
    + `<div class="section-head pdp-more-head">`
    + `<div><p class="eyebrow">Keep looking</p><h2 id="pdp-more-title">More in <em>${esc(catName)}</em></h2></div>`
    + `<div class="pdp-more-tools">`
    + (category ? `<a class="link" href="${categoryUrl(category.slug)}">Shop ${esc(catName)}</a>` : '')
    + `<div class="rail-nav"><button type="button" data-rail-prev aria-label="Previous products">${icon('left', { size: 18 })}</button>`
    + `<button type="button" data-rail-next aria-label="Next products">${icon('right', { size: 18 })}</button></div>`
    + `</div></div>`
    + `<div class="rail pdp-rail" tabindex="0" role="region" aria-label="More products" data-stagger>`
    + items.map((x) => productCard(x, { headingLevel: 3 })).join('')
    + `</div></div></div></section>`;
}

/* ----- Size guide dialog ----- */

export function guideDialogHTML(p, sizeGuide, { selected = null } = {}) {
  const kind = guideKind(p);
  const table = kind ? sizeGuide?.[kind] : null;
  if (!table) return '';
  const chosen = p.variants.find((v) => v.id === selected)?.label;
  return `<dialog class="drawer pdp-guide" id="pdp-guide" aria-labelledby="pdp-guide-title" data-pdp-guide>`
    + `<div class="drawer-head"><h2 id="pdp-guide-title" tabindex="-1" autofocus>Size guide</h2>`
    + `<button class="icon-btn" type="button" data-close-dialog aria-label="Close size guide">${icon('close', { size: 22 })}</button></div>`
    + `<div class="drawer-body pdp-guide-body">`
    + `<p class="eyebrow">${esc(table.title)}</p>`
    + (table.unitNote ? `<p class="pdp-guide-note">${esc(table.unitNote)}</p>` : '')
    + `<div class="table-wrap"><table class="table pdp-guide-table"><thead><tr>${table.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>`
    + `<tbody>${table.rows.map((r) => `<tr data-guide-row="${esc(r[0])}"${r[0] === chosen ? ' class="is-on"' : ''}>`
      + r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('') + `</tr>`).join('')}</tbody></table></div>`
    + (kind === 'tops' && sizeGuide.howToMeasure?.length
      ? `<h3 class="pdp-guide-sub label">How to measure</h3><dl class="pdp-guide-how">`
        + sizeGuide.howToMeasure.map(([term, text]) => `<div><dt>${esc(term)}</dt><dd>${esc(text)}</dd></div>`).join('')
        + `</dl>`
      : '')
    + (sizeGuide.note ? `<p class="small muted pdp-guide-demo">${esc(sizeGuide.note)}</p>` : '')
    + `<p><a class="link" href="/size-guide/">Full size guide</a></p>`
    + `</div></dialog>`;
}

/* ----- Sticky add bar (phones) ----- */

export function stickyHTML(p) {
  const info = stockInfo(p);
  const sized = isSized(p);
  return `<div class="pdp-sticky" data-pdp-sticky inert>`
    + `<div class="pdp-sticky-info">`
    + `<p class="pdp-sticky-name" data-sticky-name>${esc(p.name)}</p>`
    + `<p class="pdp-sticky-meta"><span class="tabular" data-sticky-price>${money(p.price)}</span>`
    + (sized ? `<span data-sticky-size>Select ${esc(optionName(p).toLowerCase())}</span>` : '')
    + `</p></div>`
    + `<button class="btn btn-sm pdp-sticky-add" type="button" data-sticky-add${info.inStock ? '' : ' disabled'}>`
    + (info.inStock
      ? `<span class="pdp-add-label" data-add-label>Add to bag</span><span class="pdp-add-done" data-add-done aria-hidden="true">Added</span>`
      : 'Sold out')
    + `</button></div>`;
}

/* ----- The whole page body ----- */

/**
 * pdpHTML(product, collected, { crumbs }) -> markup for inside <main>.
 * `collected` comes from collect(); `crumbs` is the breadcrumb HTML.
 */
export function pdpHTML(p, data, { crumbs = '', selected = null } = {}) {
  const { category, siblings = [], look = [], more = [], sizeGuide = null } = data;
  const accent = p.accent ?? p.colour?.hex ?? '#5C5F45';
  return `<div class="pdp" data-pdp data-slug="${esc(p.slug)}" style="--accent: ${esc(accent)}">`
    + `<div class="wrap pdp-crumbs">${crumbs}</div>`
    + `<section class="wrap pdp-main" aria-labelledby="pdp-title">`
    + galleryHTML(p)
    + `<div class="pdp-buy" data-pdp-buy>`
    + (category ? `<a class="eyebrow pdp-eyebrow" href="${categoryUrl(category.slug)}">${esc(category.name)}</a>` : '')
    + `<h1 class="pdp-name" id="pdp-title" data-pdp-name>${esc(p.name)}</h1>`
    + `<p class="price pdp-price"><span data-pdp-price>${money(p.price)}</span><span class="tag">Demo price</span></p>`
    + `<p class="pdp-summary" data-pdp-summary>${esc(p.summary ?? '')}</p>`
    + colourHTML(p, siblings)
    + formHTML(p, { selected })
    + `<ul class="pdp-notes" role="list">`
    + `<li>Demo checkout. No payment is taken.</li>`
    + `<li>Free standard delivery over ${money(FREE_SHIPPING_OVER)} (demo rate).</li>`
    + `</ul>`
    + disclosuresHTML(p, sizeGuide)
    + `<div data-pdp-look-slot>${lookHTML(look)}</div>`
    + `</div>`
    + `</section>`
    + `<div data-pdp-more-slot>${moreHTML(p, category, more)}</div>`
    + stickyHTML(p)
    + guideDialogHTML(p, sizeGuide, { selected })
    + viewerHTML(p)
    + `</div>`;
}

/* ----- Calm end states ----- */

/** A product that was deleted or hidden in the admin. */
export function unavailableHTML(p, category, { categories = [] } = {}) {
  const name = p?.name ? esc(p.name) : 'This product';
  return `<section class="wrap pdp-gone" data-pdp-gone>`
    + (category ? `<p class="eyebrow">${esc(category.name)}</p>` : '')
    + `<h1 class="pdp-gone-title">No longer available</h1>`
    + `<p class="lede">${name} is no longer in this demo store. Have a look at what is.</p>`
    + `<div class="pdp-gone-actions">`
    + (category ? `<a class="btn" href="${categoryUrl(category.slug)}">Shop ${esc(category.name)}</a>` : '')
    + `<a class="btn btn-ghost" href="/collections/">Shop all</a>`
    + `</div>`
    + (categories.length ? `<ul class="pdp-gone-cats" role="list">${categories.map((c) => `<li><a class="link" href="${categoryUrl(c.slug)}">${esc(c.name)}</a></li>`).join('')}</ul>` : '')
    + `</section>`;
}

/** /product/?slug= with no matching product. */
export function notFoundHTML({ categories = [], slug = '' } = {}) {
  return `<section class="wrap pdp-gone" data-pdp-gone>`
    + `<p class="eyebrow">Product</p>`
    + `<h1 class="pdp-gone-title">Product not found</h1>`
    + `<p class="lede">${slug ? `Nothing in this demo store is called "${esc(slug)}".` : 'No product was named in this address.'} Try one of the categories below.</p>`
    + `<div class="pdp-gone-actions"><a class="btn" href="/collections/">Shop all</a><a class="btn btn-ghost" href="/">Home</a></div>`
    + (categories.length ? `<ul class="pdp-gone-cats" role="list">${categories.map((c) => `<li><a class="link" href="${categoryUrl(c.slug)}">${esc(c.name)}</a></li>`).join('')}</ul>` : '')
    + `</section>`;
}
