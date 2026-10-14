// Shared HTML builders for MONO. Imported by the Node build (to pre-render
// every page) and by the browser (to re-render cards, the cart and so on), so
// both always produce the same markup.

let MEDIA = {};
const IMG_BASE = '/assets/img/';

/** Give the builders the image manifest (assets/data/media.json). */
export function configure({ media } = {}) {
  if (media) MEDIA = media;
}

export function mediaInfo(key) {
  return MEDIA[key] ?? null;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** $48 or $48.00 (cents: true). Always USD. */
export function money(amount, { cents = false } = {}) {
  const n = Number(amount) || 0;
  const whole = Number.isInteger(n) && !cents;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
}

export const productUrl = (p) => (p.custom ? `/product/?slug=${encodeURIComponent(p.slug)}` : `/products/${p.slug}/`);
export const categoryUrl = (slug) => `/collections/${slug}/`;

export function srcset(key, ext) {
  const m = MEDIA[key];
  if (!m) return '';
  return m.widths.map((w) => `${IMG_BASE}${key}-${w}.${ext} ${w}w`).join(', ');
}

/** Largest file of an image in one format, for Open Graph tags and JSON-LD. */
export function imageUrl(key, { ext = 'jpg', width } = {}) {
  const m = MEDIA[key];
  if (!m) return '';
  if (ext === 'jpg' && !m.alpha) return IMG_BASE + m.fallback;
  const w = width ?? m.widths.at(-1);
  return `${IMG_BASE}${key}-${w}.${m.alpha ? 'webp' : ext}`;
}

/**
 * A responsive <picture>. Unknown keys render a neutral placeholder so a
 * missing image never breaks the layout.
 */
export function picture(key, {
  alt = '',
  sizes = '100vw',
  loading = 'lazy',
  priority = false,
  className = '',
  imgClass = '',
  attrs = '',
} = {}) {
  const m = MEDIA[key];
  if (!m) {
    return `<span class="img-missing ${esc(className)}" role="img" aria-label="${esc(alt)}"></span>`;
  }
  const load = priority ? 'loading="eager" fetchpriority="high"' : `loading="${loading}"`;
  const bg = m.color ? ` style="--img-color:${m.color}"` : '';
  return `<picture class="pic${m.alpha ? ' pic-cut' : ''}${className ? ' ' + esc(className) : ''}"${bg}>`
    + `<source type="image/avif" srcset="${srcset(key, 'avif')}" sizes="${esc(sizes)}">`
    + `<source type="image/webp" srcset="${srcset(key, 'webp')}" sizes="${esc(sizes)}">`
    + `<img src="${IMG_BASE}${m.fallback}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${load} decoding="async"${imgClass ? ` class="${esc(imgClass)}"` : ''}${attrs ? ' ' + attrs : ''}>`
    + `</picture>`;
}

/** Stock summary for a product. */
export function stockInfo(product) {
  const variants = product.variants ?? [];
  const total = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
  return {
    total,
    inStock: total > 0,
    soldOutVariants: variants.filter((v) => !(Number(v.stock) > 0)).map((v) => v.id),
  };
}

export const needsChoice = (product) => (product.variants?.length ?? 0) > 1;

const CARD_SIZES = '(min-width: 1180px) 24vw, (min-width: 760px) 32vw, 48vw';

/** First image is the card image, second (if any) shows on hover. */
export function productCard(product, { eager = false, sizes = CARD_SIZES, headingLevel = 3, showNew = true } = {}) {
  const [first, second] = product.images ?? [];
  const url = productUrl(product);
  const stock = stockInfo(product);
  const h = `h${headingLevel}`;
  const label = !stock.inStock ? '<span class="card-flag">Sold out</span>'
    : showNew && product.newArrival ? '<span class="card-flag">New</span>' : '';
  const hover = second && second.kind === first?.kind
    ? picture(second.key, { alt: '', sizes, className: 'card-img card-img-alt' })
    : '';
  const quick = stock.inStock
    ? `<button class="card-add" type="button" data-quick-add="${esc(product.slug)}" aria-label="Quick add ${esc(product.name)}" aria-expanded="false">`
      + `${icon('plus', { size: 16 })}</button>`
    : '';
  return `<article class="card${first?.kind === 'cutout' ? ' card-cut' : ''}" data-slug="${esc(product.slug)}" data-reveal>`
    + `<div class="card-frame">`
    + `<a class="card-link" href="${url}" tabindex="-1" aria-hidden="true" data-vt-media="${esc(product.slug)}">`
    + (first ? picture(first.key, { alt: '', sizes, priority: eager, className: 'card-img' }) : '')
    + hover
    + `</a>${label}${quick}`
    + `<div class="card-quick" data-quick-panel hidden></div>`
    + `</div>`
    + `<div class="card-meta">`
    + `<${h} class="card-name"><a href="${url}">${esc(product.name)}</a></${h}>`
    + `<p class="card-price">${money(product.price)}</p>`
    + `</div>`
    + `<p class="card-sub"><span class="dot" style="--dot:${esc(product.colour?.hex ?? '#ccc')}" aria-hidden="true"></span>${esc(product.colour?.name ?? '')}</p>`
    + `</article>`;
}

/** Breadcrumb trail as HTML; items are [{name, url}], the last is the current page. */
export function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>`
    + items.map((it, i) => (i === items.length - 1
      ? `<li><span aria-current="page">${esc(it.name)}</span></li>`
      : `<li><a href="${it.url}">${esc(it.name)}</a></li>`)).join('')
    + `</ol></nav>`;
}

/** Inline SVG icons (stroke style, 24px grid). */
const ICONS = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  left: '<path d="M15 4 7 12l8 8"/>',
  right: '<path d="m9 4 8 8-8 8"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
};
export function icon(name, { size = 20, label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon icon-${name}" ${a11y} viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</svg>`;
}
