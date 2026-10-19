// Pure HTML builders for the MONO home page. Used by the Node build
// (src/templates/pages/home.mjs) and by the browser (assets/js/pages/home.js)
// so the pre-rendered markup and the re-rendered markup are identical.
// No window or document access at import time.

import { esc, money, picture, productUrl, productCard, icon, stockInfo, needsChoice } from '../lib/render.js';

const slugId = (value) => String(value ?? '').replace(/[^a-z0-9_-]/gi, '-');
export const pad = (n) => String(n).padStart(2, '0');

/* ----- Hero: six message slides ----- */

// One message per slide, best first. The text column is always on the left
// at the same width and the call to action sits at the bottom of it, so it
// never moves. Every picture fills the same rounded panel on the right (on
// phones, above the words): words never sit on a picture.
//
// Characters are cut-outs shown large on the panel's soft surface, filling
// its height. The studio views are framed from the head to mid-thigh; the
// owner's two look photos are full length, so `full` shows them from the
// head to just above the knee (the panel clips the rest). A `pair` puts two
// portrait photos side by side in the panel.
const HERO_CUT_SIZES = '(min-width: 1040px) 40vw, (min-width: 760px) 62vw, 82vw';
const HERO_LOOK_SIZES = '(min-width: 1040px) 54vw, (min-width: 760px) 84vw, 112vw';
const HERO_PAIR_SIZES = '(min-width: 1040px) 27vw, (min-width: 760px) 30vw, 48vw';
// Cover crops of the wide photos: drawn wider than their panel.
const HERO_WIDE_SIZES = '(min-width: 1040px) 88vw, (min-width: 760px) 138vw, 180vw';

export const HERO_SLIDES = [
  {
    id: 'brand',
    level: 1,
    eyebrow: 'Modern menswear',
    title: 'Less noise. <em>Better essentials.</em>',
    line: 'Shirts, T-shirts and polos in calm colours, and the few accessories that finish them.',
    // The owner's character (October 2026): the transparent cut-out of
    // looks/look-02.png at its own proportions.
    character: {
      key: 'cut-look-02', full: true, sizes: HERO_LOOK_SIZES,
      alt: 'Model in an ivory Oxford shirt, charcoal trousers and black belt, holding silver aviator sunglasses',
    },
    cta: { label: 'Shop new arrivals', short: 'New arrivals', href: '/collections/?sort=new' },
  },
  {
    id: 'polos',
    level: 2,
    eyebrow: 'Polos',
    title: 'Weekends, <em>with a collar.</em>',
    line: 'Piqué polos in olive and navy, and an open-textured knit polo in cream.',
    // The owner's two full-length polo photos, side by side.
    pair: [
      { key: 'life-olive-polo-wall', x: '50%', y: '28%', alt: 'Man in an olive polo and charcoal trousers by an olive-green wall in the sun' },
      { key: 'life-cream-polo-walk', x: '50%', y: '24%', alt: 'Man in a cream knit polo and navy trousers walking along a sunlit terrace' },
    ],
    cta: { label: 'Shop polos', href: '/collections/polos/' },
  },
  {
    id: 'daylight',
    level: 2,
    eyebrow: 'Sunglasses',
    title: 'Made for <em>daylight.</em>',
    line: 'A strong black rectangle, a thin silver aviator and a round tortoiseshell.',
    // The owner's Look 01 photo: black rectangular sunglasses with the olive polo.
    character: {
      key: 'cut-look-01', full: true, sizes: HERO_LOOK_SIZES,
      alt: 'Model in an olive polo, stone trousers, white sneakers, black sunglasses and a black-dial watch',
    },
    cta: { label: 'Shop sunglasses', href: '/collections/sunglasses/' },
  },
  {
    id: 'shirts',
    level: 2,
    eyebrow: 'Shirts',
    title: 'Oxfords and a <em>fine stripe.</em>',
    line: 'Button-down Oxfords in ivory and light blue, and fine blue and white stripes with a point collar.',
    character: { key: 'cut-blue-stripe-shirt-front', sizes: HERO_CUT_SIZES, alt: 'Model in the blue stripe shirt' },
    cta: { label: 'Shop shirts', href: '/collections/shirts/' },
  },
  {
    id: 'uniform',
    level: 2,
    eyebrow: 'T-shirts',
    title: 'The everyday <em>uniform.</em>',
    line: 'Crew necks that keep their shape: textured charcoal, heavy ivory and plain navy.',
    character: { key: 'cut-charcoal-textured-tee-front', sizes: HERO_CUT_SIZES, alt: 'Model in the charcoal textured tee' },
    cta: { label: 'Shop T-shirts', href: '/collections/t-shirts/' },
  },
  {
    id: 'finish',
    level: 2,
    eyebrow: 'Accessories',
    title: 'Finish the <em>outfit.</em>',
    line: 'A brown bifold wallet, a black dress belt and a slim black card holder.',
    image: {
      key: 'wide-accessories-table', x: '52%', y: '50%', sizes: HERO_WIDE_SIZES,
      alt: 'Black dress belt, black card holder and brown bifold wallet on a dark wood table in window light',
    },
    cta: { label: 'Shop accessories', href: '/collections/accessories/' },
  },
];

function ctaHTML(cta) {
  const label = cta.short
    ? `<span class="home-cta-full">${esc(cta.label)}</span><span class="home-cta-short">${esc(cta.short)}</span>`
    : esc(cta.label);
  return `<a class="btn home-cta" href="${esc(cta.href)}"><span class="home-cta-label">${label}</span>${icon('arrow', { size: 16 })}</a>`;
}

function panelHTML(slide, first) {
  if (slide.pair) {
    return `<div class="home-panel is-pair">`
      + `<div class="home-art">${slide.pair.map((img, i) => `<div class="home-pair-item" style="--x:${esc(img.x ?? '50%')};--y:${esc(img.y ?? '50%')}">`
        + picture(img.key, { alt: img.alt ?? '', sizes: HERO_PAIR_SIZES, priority: first && i === 0 })
        + `</div>`).join('')}</div>`
      + `</div>`;
  }
  if (slide.image) {
    const img = slide.image;
    return `<div class="home-panel is-photo" style="--x:${esc(img.x ?? '50%')};--y:${esc(img.y ?? '50%')}">`
      + `<div class="home-art">${picture(img.key, { alt: img.alt ?? '', sizes: img.sizes, priority: first })}</div>`
      + `</div>`;
  }
  // The character stands large in front of a warm studio wall with the
  // brand name across it. The word is decoration (drawn from data-word, so
  // it is not read out) and always sits behind him; nothing is drawn over him.
  const c = slide.character;
  return `<div class="home-panel is-stage${c.full ? ' is-full' : ''}">`
    + `<span class="home-word" data-word="Mono" aria-hidden="true"></span>`
    + `<div class="home-art home-character">${picture(c.key, { alt: c.alt ?? '', sizes: c.sizes, priority: first })}</div>`
    + `</div>`;
}

/** One slide: the message on the left, its picture panel on the right. */
export function heroSlideHTML(slide, i, total) {
  const first = i === 0;
  const h = `h${slide.level === 1 ? 1 : 2}`;
  return `<div class="home-slide${first ? ' is-active is-intro' : ''}" id="hero-${esc(slide.id)}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}" tabindex="-1" data-slide data-slide-id="${esc(slide.id)}"${first ? '' : ' inert'}>`
    + `<div class="home-copy-col">`
    + `<div class="home-copy">`
    + `<p class="eyebrow home-eyebrow">${esc(slide.eyebrow)}</p>`
    + `<${h} class="home-title">${slide.title}</${h}>`
    + (slide.line ? `<p class="home-line">${esc(slide.line)}</p>` : '')
    + `</div>`
    + ctaHTML(slide.cta)
    + `</div>`
    + panelHTML(slide, first)
    + `</div>`;
}

const PAUSE_ICON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6.5" y="5" width="3.2" height="14"/><rect x="14.3" y="5" width="3.2" height="14"/></svg>';
const PLAY_ICON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.5 4.8v14.4L19 12 7.5 4.8Z"/></svg>';
export const toggleIcon = (playing) => (playing ? PAUSE_ICON : PLAY_ICON);

/** The hero: stacked slides and one restrained control bar. */
export function heroHTML(slides) {
  const n = slides.length;
  return `<div class="home-hero" data-hero>`
    + `<section class="home-carousel" aria-roledescription="carousel" aria-label="Highlights" data-carousel data-autoplay="off">`
    + `<div class="home-slides" data-slides>${slides.map((s, i) => heroSlideHTML(s, i, n)).join('')}</div>`
    + `<div class="home-bar" data-hero-bar>`
    + `<p class="home-bar-count"><span data-hero-current>01</span> / <span data-hero-total>${pad(n)}</span></p>`
    + `<div class="home-bar-progress" aria-hidden="true">${slides.map((s, i) => `<span class="home-seg${i === 0 ? ' is-current' : ''}"><i></i></span>`).join('')}</div>`
    + `<div class="home-bar-nav">`
    + `<button class="home-bar-btn" type="button" data-hero-prev aria-label="Previous slide">${icon('left', { size: 18 })}</button>`
    + `<button class="home-bar-btn home-bar-toggle" type="button" data-hero-toggle aria-label="Pause slideshow" title="Pause slideshow"><span class="home-toggle-icon" data-hero-toggle-icon>${PAUSE_ICON}</span></button>`
    + `<button class="home-bar-btn" type="button" data-hero-next aria-label="Next slide">${icon('right', { size: 18 })}</button>`
    + `</div>`
    + `</div>`
    + `<p class="visually-hidden" aria-live="polite" aria-atomic="true" data-hero-live></p>`
    + `</section>`
    + `</div>`;
}

/* ----- New arrivals ----- */

const NEW_SIZES = '(min-width: 1180px) 23vw, (min-width: 760px) 31vw, 62vw';
const EDITORIAL = /^(life|wide)-/;
export const newArrivals = (products) => products.filter((p) => p && !p.hidden && p.newArrival);

// Lifestyle photos already appear once elsewhere on the home page (category
// tiles, hero), so the cards here keep their cut-out hover views only.
const homeCard = (p) => ({ ...p, images: (p.images ?? []).filter((img, i) => i === 0 || !EDITORIAL.test(img.key)) });

export function newArrivalsHTML(products) {
  return products.map((p) => productCard(homeCard(p), { sizes: NEW_SIZES, headingLevel: 3, showNew: false })).join('');
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

/**
 * watchPanelHTML(watch, extras, { alt, altQuestion }): name, price with the
 * demo tag, add to bag, "Complete the look" rows and a link to the other dial.
 */
export function watchPanelHTML(watch, extras = [], { alt = null, altQuestion = '' } = {}) {
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
    + (alt ? `<p class="home-watch-alt">${esc(altQuestion)} <a class="text-link" href="${esc(productUrl(alt))}">See the ${esc(alt.name)}</a></p>` : '');
}
