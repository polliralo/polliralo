// Pure HTML builders for the MONO home page. Used by the Node build
// (src/templates/pages/home.mjs) and by the browser (assets/js/pages/home.js)
// so the pre-rendered markup and the re-rendered markup are identical.
// No window or document access at import time.

import { esc, money, picture, productUrl, productCard, icon, stockInfo, needsChoice } from '../lib/render.js';

/* ----- Hero product slider ----- */

// One slide per clothing product, olive polo first (owner decision).
export const HERO_ORDER = [
  'olive-pique-polo',
  'ivory-oxford-shirt',
  'charcoal-textured-tee',
  'blue-stripe-shirt',
  'ivory-heavyweight-tee',
  'navy-pique-polo',
];
const CLOTHING = ['shirts', 't-shirts', 'polos'];
const HERO_MAX = 8;

// The giant faint word behind each cut-out: a word from the product itself.
const GHOST_WORDS = {
  'olive-pique-polo': 'Polo',
  'ivory-oxford-shirt': 'Oxford',
  'charcoal-textured-tee': 'Texture',
  'blue-stripe-shirt': 'Stripe',
  'ivory-heavyweight-tee': 'Crew',
  'navy-pique-polo': 'Piqué',
};

const HERO_SIZES = '(min-width: 1180px) 44vw, (min-width: 760px) 58vw, 62vw';

const slugId = (value) => String(value ?? '').replace(/[^a-z0-9_-]/gi, '-');
const pad = (n) => String(n).padStart(2, '0');

/** Visible clothing products in hero order (unknown products go last). */
export function heroProducts(products) {
  const rank = (p) => {
    const i = HERO_ORDER.indexOf(p.slug);
    return i === -1 ? HERO_ORDER.length : i;
  };
  return products
    .filter((p) => p && !p.hidden && CLOTHING.includes(p.category))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p)
    .slice(0, HERO_MAX);
}

export function ghostWord(p) {
  if (GHOST_WORDS[p.slug]) return GHOST_WORDS[p.slug];
  const words = String(p.name ?? '').trim().split(/\s+/);
  return words[words.length - 1] || 'Mono';
}

function ghostClass(word) {
  const n = [...word].length;
  if (n <= 4) return '';
  return n <= 6 ? ' is-mid' : ' is-long';
}

/** Front, back and detail views (or the first three images). */
export function heroViews(p) {
  const imgs = p.images ?? [];
  const picked = ['Front', 'Back', 'Detail'].map((v) => imgs.find((i) => i.view === v)).filter(Boolean);
  return picked.length ? picked : imgs.slice(0, 3);
}

const layerKind = (kind) => (kind === 'cutout' ? 'is-cut' : 'is-photo');

/** One main-image layer of a slide (also built by the thumbnail swap). */
export function heroLayerHTML(view, { priority = false, current = true } = {}) {
  return `<div class="home-layer ${layerKind(view.kind)}${current ? ' is-current' : ''}" data-key="${esc(view.key)}">`
    + picture(view.key, { alt: view.alt ?? '', sizes: HERO_SIZES, priority, loading: priority ? 'eager' : 'lazy' })
    + `</div>`;
}

/** The picture for a view, for building layers in the browser. */
export function heroPictureHTML(key, alt) {
  return picture(key, { alt: alt ?? '', sizes: HERO_SIZES, loading: 'eager' });
}

function sizesHTML(p, id) {
  const label = p.option?.label ?? 'Size';
  return `<fieldset class="home-sizes" data-hero-sizes aria-describedby="${id}-msg">`
    + `<legend class="home-sizes-legend">${esc(label)}</legend>`
    + `<div class="home-sizes-list">`
    + p.variants.map((v) => {
      const out = !(Number(v.stock) > 0);
      const vid = `${id}-${slugId(v.id)}`;
      return `<input class="home-size-input" type="radio" name="${id}-size" id="${vid}" value="${esc(v.id)}"${out ? ' disabled' : ''}>`
        + `<label class="home-size${out ? ' is-out' : ''}" for="${vid}">${esc(v.label)}${out ? '<span class="visually-hidden">, sold out</span>' : ''}</label>`;
    }).join('')
    + `</div>`
    + `<a class="home-sizes-guide" href="/size-guide/">Size guide</a>`
    + `</fieldset>`;
}

function thumbsHTML(p, views) {
  return `<div class="home-thumbs" role="group" aria-label="Views of ${esc(p.name)}">`
    + views.map((v, k) => `<button class="home-thumb ${layerKind(v.kind)}" type="button" aria-pressed="${k === 0}" data-view="${esc(v.key)}" data-kind="${esc(v.kind ?? 'photo')}" data-alt="${esc(v.alt ?? '')}">`
      + picture(v.key, { alt: '', sizes: '96px' })
      + `<span class="visually-hidden">${esc(v.view ?? `View ${k + 1}`)} view</span></button>`).join('')
    + `</div>`;
}

/** One slide of the hero. */
export function heroSlideHTML(p, i, total, { categoryName = '', first = false } = {}) {
  const views = heroViews(p);
  const main = views[0];
  const stock = stockInfo(p);
  const sized = needsChoice(p);
  const id = `hero-${slugId(p.slug)}`;
  const url = productUrl(p);
  const word = ghostWord(p);
  const eyebrow = [p.newArrival ? 'New in' : '', categoryName].filter(Boolean).join(' · ');
  const addLabel = stock.inStock ? 'Add to bag' : 'Sold out';
  return `<div class="home-slide${first ? ' is-active is-intro' : ''}" id="${id}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}" tabindex="-1" data-slide data-slug="${esc(p.slug)}" data-accent="${esc(p.accent ?? '')}"${first ? '' : ' inert'}>`
    + `<div class="home-stage">`
    + `<span class="ghost-word home-ghost${ghostClass(word)}" data-word="${esc(word)}" aria-hidden="true"></span>`
    + `<div class="home-frame" data-frame>${main ? heroLayerHTML(main, { priority: first }) : ''}</div>`
    + `</div>`
    + (sized && stock.inStock ? sizesHTML(p, id) : '')
    + `<div class="home-details">`
    + (eyebrow ? `<p class="eyebrow home-rise" style="--l:0">${esc(eyebrow)}</p>` : '')
    + `<h2 class="home-name home-rise" style="--l:1">${esc(p.name)}</h2>`
    + (p.summary ? `<p class="home-summary home-rise" style="--l:2">${esc(p.summary)}</p>` : '')
    + `<p class="price home-price home-rise" style="--l:3"><span>${money(p.price)}</span><span class="tag">Demo price</span></p>`
    + `<div class="home-actions home-rise" style="--l:4">`
    + `<button class="btn home-add" type="button" data-hero-add aria-describedby="${id}-msg"${stock.inStock ? '' : ' disabled'}><span data-label="${addLabel}">${addLabel}</span></button>`
    + `<a class="link home-view" href="${esc(url)}">View details<span class="visually-hidden">: ${esc(p.name)}</span></a>`
    + `<a class="btn btn-sm home-shop" href="${esc(url)}">Shop now<span class="visually-hidden">: ${esc(p.name)}</span></a>`
    + `</div>`
    + `<p class="home-msg" id="${id}-msg" data-hero-msg aria-live="polite"></p>`
    + `</div>`
    + (views.length > 1 ? thumbsHTML(p, views) : '')
    + `</div>`;
}

export function heroSlidesHTML(products, categories = []) {
  const name = (slug) => categories.find((c) => c.slug === slug)?.name ?? '';
  return products.map((p, i) => heroSlideHTML(p, i, products.length, { categoryName: name(p.category), first: i === 0 })).join('');
}

/** Counter, next name and accent for slide i. */
export function heroBarState(products, i) {
  const n = products.length;
  const next = products[(i + 1) % n];
  return {
    current: pad(i + 1),
    total: pad(n),
    nextName: next?.name ?? '',
    accent: products[i]?.accent ?? '#5C5F45',
  };
}

const PAUSE_ICON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6.5" y="5" width="3.2" height="14"/><rect x="14.3" y="5" width="3.2" height="14"/></svg>';
const PLAY_ICON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 4.8v14.4L19 12 7 4.8Z"/></svg>';
export const toggleIcon = (playing) => (playing ? PAUSE_ICON : PLAY_ICON);

/** The whole hero: brand headline, carousel and the accent bar. */
export function heroHTML(products, categories = []) {
  const bar = heroBarState(products, 0);
  return `<div class="home-hero" data-hero style="--accent:${esc(bar.accent)}">`
    + `<div class="wrap home-hero-wrap">`
    + `<h1 class="home-hero-h1"><span class="home-hero-kicker">Modern menswear</span> <span class="home-hero-line">Less noise. <em>Better essentials.</em></span></h1>`
    + `<section class="home-carousel" aria-roledescription="carousel" aria-label="Featured products" data-carousel>`
    + `<div class="home-slides" data-slides>${heroSlidesHTML(products, categories)}</div>`
    + `<div class="home-bar" data-hero-bar>`
    + `<div class="home-bar-main">`
    + `<p class="home-bar-count"><span data-hero-current>${bar.current}</span><span class="home-bar-sep"> / </span><span data-hero-total>${bar.total}</span></p>`
    + `<p class="home-bar-next"><span class="home-bar-next-label">Next<span class="visually-hidden">:</span></span> <span data-hero-next-name>${esc(bar.nextName)}</span></p>`
    + `<span class="home-bar-progress" aria-hidden="true"><i data-hero-progress></i></span>`
    + `<button class="home-bar-toggle" type="button" data-hero-toggle><span class="home-toggle-icon" data-hero-toggle-icon>${PAUSE_ICON}</span><span data-hero-toggle-text>Pause</span><span class="visually-hidden"> slideshow</span></button>`
    + `</div>`
    + `<div class="home-bar-nav">`
    + `<button class="home-bar-btn" type="button" data-hero-prev aria-label="Previous product">${icon('left', { size: 20 })}</button>`
    + `<button class="home-bar-btn" type="button" data-hero-next aria-label="Next product">${icon('right', { size: 20 })}</button>`
    + `</div>`
    + `</div>`
    + `<p class="visually-hidden" aria-live="polite" aria-atomic="true" data-hero-live></p>`
    + `</section>`
    + `</div>`
    + `</div>`;
}

/* ----- New arrivals ----- */

const NEW_SIZES = '(min-width: 1180px) 23vw, (min-width: 760px) 31vw, 46vw';
export const newArrivals = (products) => products.filter((p) => p && !p.hidden && p.newArrival);
export function newArrivalsHTML(products) {
  return products.map((p) => productCard(p, { sizes: NEW_SIZES, headingLevel: 3, showNew: false })).join('');
}

/* ----- Small product rows with an add control (look panel, watch panel) ----- */

/**
 * One product row: image, linked name, price and an add control. One-size
 * items add straight away; sized items open compact size chips first.
 */
export function itemHTML(p, { prefix = 'item' } = {}) {
  const url = productUrl(p);
  const img = p.images?.[0];
  const stock = stockInfo(p);
  const sized = needsChoice(p);
  const id = `${prefix}-${slugId(p.slug)}`;
  const option = (p.option?.label ?? 'size').toLowerCase();
  let control;
  if (!stock.inStock) {
    control = `<span class="home-item-out">Sold out</span>`;
  } else if (!sized) {
    control = `<button class="home-item-add" type="button" data-add-slug="${esc(p.slug)}" data-add-variant="${esc(p.variants[0].id)}" aria-label="Add ${esc(p.name)} to bag">`
      + `${icon('plus', { size: 16 })}<span data-label="Add">Add</span></button>`;
  } else {
    control = `<button class="home-item-add" type="button" data-choose="${esc(p.slug)}" aria-expanded="false" aria-controls="${id}-sizes" aria-label="Add ${esc(p.name)}, choose a ${esc(option)}">`
      + `${icon('plus', { size: 16 })}<span data-label="Add">Add</span></button>`;
  }
  const chips = stock.inStock && sized
    ? `<div class="home-item-sizes" id="${id}-sizes" hidden>`
      + `<p class="home-item-sizes-label" id="${id}-sizes-label">Choose ${esc(option)}</p>`
      + `<div class="chips" role="group" aria-labelledby="${id}-sizes-label">`
      + p.variants.map((v) => (Number(v.stock) > 0
        ? `<button class="chip" type="button" data-add-slug="${esc(p.slug)}" data-add-variant="${esc(v.id)}"><span class="visually-hidden">Add ${esc(option)} </span>${esc(v.label)}</button>`
        : `<button class="chip is-out" type="button" disabled>${esc(v.label)}<span class="visually-hidden"> sold out</span></button>`)).join('')
      + `</div></div>`
    : '';
  return `<li class="home-item" data-slug="${esc(p.slug)}">`
    + `<a class="home-item-media${img?.kind === 'cutout' ? ' is-cut' : ''}" href="${esc(url)}" tabindex="-1" aria-hidden="true">`
    + (img ? picture(img.key, { alt: '', sizes: '96px' }) : '')
    + `</a>`
    + `<div class="home-item-meta">`
    + `<p class="home-item-name"><a href="${esc(url)}">${esc(p.name)}</a></p>`
    + `<p class="home-item-sub"><span class="dot" style="--dot:${esc(p.colour?.hex ?? '#ccc')}" aria-hidden="true"></span>${esc(p.colour?.name ?? '')}</p>`
    + `<p class="home-item-price">${money(p.price)}</p>`
    + `</div>`
    + `<div class="home-item-ctl">${control}</div>`
    + chips
    + `</li>`;
}

/* ----- Shop the look ----- */

const LOOK_SIZES = '(min-width: 1040px) 34vw, (min-width: 760px) 44vw, 88vw';
const lookWords = ['one', 'two', 'three', 'four', 'five', 'six'];

/** Products of a look that still exist and are visible. */
export function lookProducts(look, getProduct) {
  return (look.products ?? []).map((s) => getProduct(s)).filter((p) => p && !p.hidden);
}

export function lookTextHTML(look, i, total, active) {
  const count = `${lookWords[i] ? `${lookWords[i][0].toUpperCase()}${lookWords[i].slice(1)}` : i + 1} of ${lookWords[total - 1] ?? total} looks`;
  return `<div class="home-look-text" data-look="${esc(look.id)}"${active ? '' : ' hidden'}>`
    + `<h3 class="home-look-name">${esc(look.name)}</h3>`
    + `<p class="home-look-count">${esc(count)}</p>`
    + `<p class="home-look-line">${esc(look.line ?? '')}</p>`
    + `</div>`;
}

export function lookFigureHTML(look, active) {
  return `<div class="home-look-figure" data-look="${esc(look.id)}"${active ? '' : ' hidden'}>`
    + `<span class="ghost-word home-look-ghost" data-word="${esc(look.name)}" aria-hidden="true"></span>`
    + picture(look.image.key, { alt: look.image.alt ?? '', sizes: LOOK_SIZES, className: 'home-look-pic' })
    + `</div>`;
}

export function lookListHTML(look, products, active) {
  const body = products.length
    ? `<ul class="home-items" role="list">${products.map((p) => itemHTML(p, { prefix: `look-${slugId(look.id)}` })).join('')}</ul>`
    : `<p class="home-gone">The pieces in this look are no longer available. <a class="text-link" href="/collections/">Shop all</a></p>`;
  return `<div class="home-look-list" data-look="${esc(look.id)}"${active ? '' : ' hidden'}>`
    + `<p class="home-panel-label">In this look <span class="muted">${products.length} ${products.length === 1 ? 'piece' : 'pieces'}</span></p>`
    + body
    + `</div>`;
}

/* ----- Watches spotlight buy panel ----- */

export function watchPanelHTML(watch, extras = [], alt = null) {
  if (!watch) {
    return `<div class="home-watch-gone"><p>This watch is no longer available.</p><a class="link" href="/collections/watches/">Shop watches</a></div>`;
  }
  const stock = stockInfo(watch);
  const url = productUrl(watch);
  const v = watch.variants?.[0];
  const sized = needsChoice(watch);
  return `<h3 class="home-watch-name">${esc(watch.name)}</h3>`
    + `<p class="price home-watch-price"><span>${money(watch.price)}</span><span class="tag">Demo price</span></p>`
    + `<p class="home-watch-meta">${esc(sized ? `${watch.variants.length} options` : (v?.label ?? 'One size'))}</p>`
    + `<div class="home-watch-actions">`
    + (stock.inStock && v && !sized
      ? `<button class="btn btn-block" type="button" data-add-slug="${esc(watch.slug)}" data-add-variant="${esc(v.id)}"><span data-label="Add to bag">Add to bag</span></button>`
      : stock.inStock
        ? `<a class="btn btn-block" href="${esc(url)}">Choose an option</a>`
        : `<button class="btn btn-block" type="button" disabled>Sold out</button>`)
    + `<a class="link" href="${esc(url)}">View details<span class="visually-hidden">: ${esc(watch.name)}</span></a>`
    + `</div>`
    + (extras.length
      ? `<div class="home-watch-ctl"><h3 class="home-panel-label">Complete the look</h3><ul class="home-items" role="list">${extras.map((p) => itemHTML(p, { prefix: 'watch' })).join('')}</ul></div>`
      : '')
    + (alt ? `<p class="home-watch-alt">Prefer a white dial? <a class="text-link" href="${esc(productUrl(alt))}">See the ${esc(alt.name)}</a></p>` : '');
}
