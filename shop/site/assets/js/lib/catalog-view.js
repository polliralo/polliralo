// Product listing logic and markup for the shop-all page, the six category
// pages and search. Imported by the Node build (to pre-render) and by
// pages/collection.js and pages/search.js (to re-render), so the markup is the
// same in both. Nothing here touches window or document at import time; the
// grid renderer uses the DOM only when it is called in the browser.
//
// Filters come from the products themselves (sizes, colours, prices, stock),
// so admin edits and custom products are filtered like the seed catalogue.
// State is mirrored in the query string: lower-case keys, repeated keys for
// several values, a stable key order, e.g. ?size=m&size=l&sort=price-asc.

import { esc, money, productCard, stockInfo, icon, picture } from './render.js';

export const FACET_IDS = ['category', 'size', 'colour', 'price', 'stock'];
export const QUERY_KEYS = [...FACET_IDS, 'sort'];

export const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'New arrivals first' },
  { id: 'price-asc', label: 'Price low to high' },
  { id: 'price-desc', label: 'Price high to low' },
  { id: 'name', label: 'Name A to Z' },
];

const LABELS = { category: 'Category', size: 'Size', colour: 'Colour', price: 'Price', stock: 'Availability' };

export const slugify = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const priceOf = (p) => Number(p.price) || 0;
const colourId = (p) => slugify(p.colour?.name);

export const stylesLabel = (n) => `${n} ${n === 1 ? 'style' : 'styles'}`;
export const resultsLabel = (n) => `${n} ${n === 1 ? 'result' : 'results'}`;
export const showingText = (shown, total) => `Showing ${shown} of ${total}`;
export const pad2 = (n) => String(n).padStart(2, '0');

/** Card image sizes for the listing grids: 3 columns from 1000px, 2 below. */
export const LISTING_SIZES = '(min-width: 1440px) 420px, (min-width: 1000px) 30vw, 46vw';

/* ----- Sizes ----- */

const LETTER_SIZES = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
function sizeRank(id) {
  const i = LETTER_SIZES.indexOf(id);
  if (i !== -1) return i;
  const n = parseFloat(id);
  return Number.isFinite(n) ? 100 + n : 1000;
}

/** The variants that are real sizes (one-size products have none). */
export function sizedVariants(p) {
  if (!p?.variants?.length || p.option?.type === 'none') return [];
  const group = p.option?.label || 'Size';
  return p.variants.map((v) => ({
    id: slugify(v.id),
    label: String(v.label ?? v.id),
    group,
    stock: Number(v.stock) || 0,
  }));
}

/* ----- Prices: ranges from the data ----- */

const PRICE_EDGES = [50, 100, 200, 500, 1000];

/**
 * Ranges such as Under $50, $50 to $100, Over $100. Only edges that fall
 * inside the price spread are used and empty ranges are dropped, so a
 * category with similar prices gets no price filter at all.
 */
export function priceRanges(products) {
  const prices = products.map(priceOf);
  if (prices.length < 2) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const edges = PRICE_EDGES.filter((e) => e > min && e < max);
  if (!edges.length) return [];
  const ranges = [{ id: `under-${edges[0]}`, label: `Under ${money(edges[0])}`, test: (n) => n < edges[0] }];
  for (let i = 1; i < edges.length; i += 1) {
    const lo = edges[i - 1];
    const hi = edges[i];
    const first = i === 1;
    ranges.push({ id: `${lo}-${hi}`, label: `${money(lo)} to ${money(hi)}`, test: (n) => (first ? n >= lo : n > lo) && n <= hi });
  }
  const last = edges.at(-1);
  ranges.push({ id: `over-${last}`, label: `Over ${money(last)}`, test: (n) => n > last });
  return ranges.filter((r) => products.some((p) => r.test(priceOf(p))));
}

/* ----- Facets ----- */

/**
 * Every filter option that exists in this set of products.
 * { category, size, colour, price, stock } each with .options [{ id, label, ... }]
 */
export function buildFacets(products, { categories = [], withCategory = false } = {}) {
  const facets = {};

  facets.category = {
    id: 'category',
    options: withCategory
      ? categories.filter((c) => products.some((p) => p.category === c.slug)).map((c) => ({ id: c.slug, label: c.name }))
      : [],
  };

  const sizes = new Map();
  products.forEach((p) => sizedVariants(p).forEach((v) => {
    const key = `${slugify(v.group)}:${v.id}`;
    if (!sizes.has(key)) sizes.set(key, { id: v.id, label: v.label, group: v.group });
  }));
  // One id per size; if two groups share an id (unlikely), the first wins.
  const sizeList = [];
  const seenIds = new Set();
  [...sizes.values()]
    .sort((a, b) => (a.group === b.group ? sizeRank(a.id) - sizeRank(b.id) : groupRank(a.group) - groupRank(b.group)))
    .forEach((s) => { if (!seenIds.has(s.id)) { seenIds.add(s.id); sizeList.push(s); } });
  facets.size = { id: 'size', options: sizeList };

  const colours = new Map();
  products.forEach((p) => {
    const id = colourId(p);
    if (id && !colours.has(id)) colours.set(id, { id, label: p.colour.name, hex: p.colour.hex || '#ccc' });
  });
  facets.colour = { id: 'colour', options: [...colours.values()] };

  facets.price = { id: 'price', options: priceRanges(products) };
  facets.stock = { id: 'stock', options: [{ id: 'in', label: 'In stock only' }] };
  return facets;
}

function groupRank(label) {
  // Letter sizes first, then waist and anything else, alphabetically.
  return label === 'Size' ? 0 : 1 + label.toLowerCase().charCodeAt(0) / 1000;
}

/** Groups of size options for display: [{ label, options }]. */
export function sizeGroups(options) {
  const groups = [];
  options.forEach((o) => {
    let g = groups.find((x) => x.label === o.group);
    if (!g) groups.push((g = { label: o.group, options: [] }));
    g.options.push(o);
  });
  return groups;
}

/* ----- State and the query string ----- */

export const emptyState = () => ({ category: [], size: [], colour: [], price: [], stock: false, sort: 'featured' });

/** Raw state from a query string; values are checked later by normalizeState(). */
export function parseQuery(search) {
  const state = emptyState();
  const params = new URLSearchParams(search);
  for (const [rawKey, rawValue] of params) {
    const key = rawKey.toLowerCase();
    if (!QUERY_KEYS.includes(key)) continue;
    const values = String(rawValue).split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
    if (key === 'stock') state.stock = values.some((v) => ['in', '1', 'true', 'yes', 'in-stock'].includes(v));
    else if (key === 'sort') state.sort = values[0] ?? 'featured';
    else state[key].push(...values);
  }
  return state;
}

/** Keep only values that exist in these facets, in the facets' own order. */
export function normalizeState(raw, facets) {
  const state = emptyState();
  ['category', 'size', 'colour', 'price'].forEach((f) => {
    const wanted = new Set(raw[f] ?? []);
    state[f] = (facets[f]?.options ?? []).map((o) => o.id).filter((id) => wanted.has(id));
  });
  state.stock = Boolean(raw.stock);
  state.sort = SORTS.some((s) => s.id === raw.sort) ? raw.sort : 'featured';
  return state;
}

/** '?size=m&size=l&sort=price-asc', or '' for the default view. */
export function toQuery(state) {
  const params = new URLSearchParams();
  ['category', 'size', 'colour', 'price'].forEach((f) => state[f].forEach((v) => params.append(f, v)));
  if (state.stock) params.append('stock', 'in');
  if (state.sort && state.sort !== 'featured') params.append('sort', state.sort);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const activeCount = (state) =>
  state.category.length + state.size.length + state.colour.length + state.price.length + (state.stock ? 1 : 0);

export function isSelected(state, facet, value) {
  if (facet === 'stock') return state.stock;
  if (facet === 'sort') return state.sort === value;
  return state[facet]?.includes(value) ?? false;
}

/* ----- Filtering and sorting ----- */

/** Does a product pass every active filter (except `skip`, used for option counts)? */
export function matches(p, state, facets, skip = null) {
  if (skip !== 'category' && state.category.length && !state.category.includes(p.category)) return false;
  if (skip !== 'colour' && state.colour.length && !state.colour.includes(colourId(p))) return false;
  if (skip !== 'price' && state.price.length) {
    const n = priceOf(p);
    if (!facets.price.options.some((o) => state.price.includes(o.id) && o.test(n))) return false;
  }
  const stockOn = skip !== 'stock' && state.stock;
  if (skip !== 'size' && state.size.length) {
    // With "In stock only", the chosen size itself must be in stock.
    const hits = sizedVariants(p).filter((v) => state.size.includes(v.id));
    if (!hits.length) return false;
    if (stockOn && !hits.some((v) => v.stock > 0)) return false;
  } else if (stockOn && !stockInfo(p).inStock) {
    return false;
  }
  return true;
}

function optionMatches(facet, option, p, state) {
  switch (facet) {
    case 'category': return p.category === option.id;
    case 'colour': return colourId(p) === option.id;
    case 'price': return option.test(priceOf(p));
    case 'size': return sizedVariants(p).some((v) => v.id === option.id && (!state.stock || v.stock > 0));
    default: return false;
  }
}

/** How many products each option would show, given the other active filters. */
export function facetCounts(products, state, facets) {
  const counts = {};
  ['category', 'size', 'colour', 'price'].forEach((f) => {
    const pool = products.filter((p) => matches(p, state, facets, f));
    counts[f] = {};
    facets[f].options.forEach((o) => { counts[f][o.id] = pool.filter((p) => optionMatches(f, o, p, state)).length; });
  });
  counts.stock = { in: products.filter((p) => matches(p, { ...state, stock: true }, facets)).length };
  return counts;
}

/** Sorted copy. Featured keeps the catalogue order; ties keep it too. */
export function sortProducts(list, sort, base = list) {
  const order = new Map(base.map((p, i) => [p.slug, i]));
  const by = (fn) => (a, b) => fn(a, b) || order.get(a.slug) - order.get(b.slug);
  const out = [...list];
  switch (sort) {
    case 'new': return out.sort(by((a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival))));
    case 'price-asc': return out.sort(by((a, b) => priceOf(a) - priceOf(b)));
    case 'price-desc': return out.sort(by((a, b) => priceOf(b) - priceOf(a)));
    case 'name': return out.sort(by((a, b) => String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' })));
    default: return out.sort(by(() => 0));
  }
}

/** The filtered, sorted list for a state. */
export function apply(products, state, facets) {
  return sortProducts(products.filter((p) => matches(p, state, facets)), state.sort, products);
}

/** Active filters as removable chips: [{ facet, value, label }]. */
export function activeChips(state, facets) {
  const chips = [];
  const find = (f, id) => facets[f]?.options.find((o) => o.id === id);
  state.category.forEach((id) => chips.push({ facet: 'category', value: id, label: find('category', id)?.label ?? id }));
  state.size.forEach((id) => {
    const o = find('size', id);
    chips.push({ facet: 'size', value: id, label: `${o?.group ?? 'Size'} ${o?.label ?? id.toUpperCase()}` });
  });
  state.colour.forEach((id) => chips.push({ facet: 'colour', value: id, label: find('colour', id)?.label ?? id }));
  state.price.forEach((id) => chips.push({ facet: 'price', value: id, label: find('price', id)?.label ?? id }));
  if (state.stock) chips.push({ facet: 'stock', value: 'in', label: 'In stock only' });
  return chips;
}

/** What makes a card's markup: re-render a card only when one of these changes. */
export function cardSignature(p) {
  return JSON.stringify([
    p.slug, p.name, priceOf(p), Boolean(p.custom), Boolean(p.newArrival), p.colour?.name, p.colour?.hex,
    (p.images ?? []).slice(0, 2).map((i) => [i.key, i.kind]), stockInfo(p).inStock,
  ]);
}

/* ----- Markup ----- */

const CHEVRON = '<svg class="coll-chev" aria-hidden="true" viewBox="0 0 12 8" width="11" height="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1.5 5 5 5-5"/></svg>';

const checkedAttr = (on) => (on ? ' checked' : '');
const n = (counts, f, id) => counts?.[f]?.[id] ?? 0;

/** Options for one facet. `prefix` keeps input names apart between the bar and the drawer. */
export function optionsHTML(facet, facets, state, counts, prefix) {
  const name = `${prefix}-${facet}`;
  if (facet === 'sort') {
    return `<div class="coll-list">` + SORTS.map((s) => `<label class="coll-opt coll-radio" data-opt="sort:${s.id}">`
      + `<input type="radio" name="${name}" value="${s.id}" data-facet="sort"${checkedAttr(state.sort === s.id)}>`
      + `<span class="coll-opt-label">${esc(s.label)}</span></label>`).join('') + `</div>`;
  }
  if (facet === 'stock') {
    const c = n(counts, 'stock', 'in');
    return `<label class="coll-opt coll-check" data-opt="stock:in">`
      + `<input type="checkbox" name="${name}" value="in" data-facet="stock"${checkedAttr(state.stock)}${c === 0 && !state.stock ? ' disabled' : ''}>`
      + `<span class="coll-opt-label">In stock only</span><span class="coll-n tabular" data-n>${c}</span></label>`;
  }
  const options = facets[facet]?.options ?? [];
  if (facet === 'size') {
    return sizeGroups(options).map((g, _, all) => `<div class="coll-size-group">`
      + (all.length > 1 && g.label !== LABELS.size ? `<p class="coll-sub">${esc(g.label)}</p>` : '')
      + `<div class="coll-sizes">` + g.options.map((o) => {
        const on = isSelected(state, 'size', o.id);
        const c = n(counts, 'size', o.id);
        return `<label class="chip coll-size" data-opt="size:${esc(o.id)}">`
          + `<input class="visually-hidden" type="checkbox" name="${name}-${esc(o.id)}" value="${esc(o.id)}" data-facet="size"${checkedAttr(on)}${c === 0 && !on ? ' disabled' : ''}>`
          + `<span aria-hidden="true">${esc(o.label)}</span><span class="visually-hidden">${esc(g.label)} ${esc(o.label)}</span></label>`;
      }).join('') + `</div></div>`).join('');
  }
  return `<div class="coll-list${facet === 'colour' ? ' coll-colours' : ''}">` + options.map((o) => {
    const on = isSelected(state, facet, o.id);
    const c = n(counts, facet, o.id);
    const mark = facet === 'colour'
      ? `<span class="swatch coll-swatch" style="--sw:${esc(o.hex)}" aria-hidden="true"></span>`
      : '';
    return `<label class="coll-opt ${facet === 'colour' ? 'coll-colour' : 'coll-check'}" data-opt="${facet}:${esc(o.id)}">`
      + `<input${facet === 'colour' ? ' class="visually-hidden"' : ''} type="checkbox" name="${name}-${esc(o.id)}" value="${esc(o.id)}" data-facet="${facet}"${checkedAttr(on)}${c === 0 && !on ? ' disabled' : ''}>`
      + `${mark}<span class="coll-opt-label">${esc(o.label)}</span><span class="coll-n tabular" data-n>${c}</span></label>`;
  }).join('') + `</div>`;
}

/** Is a facet worth showing? (At least two options, or one already chosen.) */
export function facetVisible(facet, facets, state) {
  if (facet === 'stock' || facet === 'sort') return true;
  const count = facets[facet]?.options.length ?? 0;
  return count > 1 || (state[facet]?.length ?? 0) > 0;
}

function dropdownHTML(facet, label, inner, { hidden = false, end = false, value = '' } = {}) {
  return `<div class="coll-dd${end ? ' coll-dd-end' : ''}" data-dd="${facet}"${hidden ? ' hidden' : ''}>`
    + `<button class="coll-dd-btn" type="button" aria-expanded="false" aria-controls="coll-dd-${facet}">`
    + `<span class="coll-dd-label">${label}</span>`
    + (value ? `<span class="coll-dd-value" data-sort-label>${value}</span>` : `<span class="coll-dd-n tabular" data-dd-n="${facet}"></span>`)
    + `${CHEVRON}</button>`
    + `<div class="coll-dd-panel coll-dd-${facet}" id="coll-dd-${facet}" data-dd-panel hidden>`
    + `<fieldset class="coll-fs"><legend class="visually-hidden">${label}</legend><div data-options="${facet}">${inner}</div></fieldset>`
    + `</div></div>`;
}

/**
 * The listing block: sticky tools bar (dropdowns on wide screens, a
 * "Filter and sort" button on phones), active filter chips, the grid and the
 * empty state. The drawer is built by drawerHTML().
 */
export function listingHTML({ products, facets, state, counts, total, withCategory, eagerCount = 1, title = 'Products', tile = null }) {
  const shown = products.length;
  const filterFacets = (withCategory ? ['category'] : []).concat(['size', 'colour', 'price']);
  const sortLabel = SORTS.find((s) => s.id === state.sort)?.label ?? 'Featured';
  const active = activeCount(state);
  return `<section class="coll-results" aria-labelledby="coll-results-title" data-results>`
    + `<script>(function(s){if(/[?&](category|size|colour|price|stock|sort)=/i.test(location.search))s.classList.add('is-pending')})(document.currentScript.parentNode)</script>`
    + `<h2 class="visually-hidden" id="coll-results-title">${esc(title)}</h2>`
    + `<div class="coll-tools" data-tools><div class="wrap coll-tools-in">`
    + `<button class="coll-open" type="button" data-open-filters aria-haspopup="dialog" aria-controls="coll-drawer">`
    + `${icon('filter', { size: 18 })}<span>Filter and sort</span><span class="coll-badge tabular" data-filter-badge${active ? '' : ' hidden'}>${active}<span class="visually-hidden"> active</span></span></button>`
    + `<div class="coll-filters" role="group" aria-label="Filters">`
    + filterFacets.map((f) => dropdownHTML(f, LABELS[f], optionsHTML(f, facets, state, counts, 'bar'), { hidden: !facetVisible(f, facets, state) })).join('')
    + `<div class="coll-stock" data-options="stock">${optionsHTML('stock', facets, state, counts, 'bar')}</div>`
    + `</div>`
    + `<p class="coll-showing tabular" role="status" data-showing>${showingText(shown, total)}</p>`
    + dropdownHTML('sort', 'Sort by', optionsHTML('sort', facets, state, counts, 'bar'), { end: true, value: esc(sortLabel) })
    + `</div></div>`
    + `<div class="wrap coll-active" data-active${active ? '' : ' hidden'}>${chipsHTML(activeChips(state, facets))}</div>`
    + `<div class="wrap coll-grid-wrap">`
    + `<div class="grid-products coll-grid" data-grid${shown ? '' : ' hidden'}>`
    + products.map((p, i) => productCard(p, { eager: i < eagerCount, sizes: LISTING_SIZES })).join('')
    + (tile ? tileHTML(tile, shown) : '')
    + `</div>`
    + `<div class="empty coll-empty" data-empty${shown ? ' hidden' : ''}>`
    + `<h3>No pieces match these filters</h3>`
    + `<p class="muted">Remove a filter above, or clear them all to see every style again.</p>`
    + `<button class="btn" type="button" data-clear>Clear all</button>`
    + `</div></div>`
    + `</section>`;
}

/** Removable chips for the active filters plus "Clear all". */
export function chipsHTML(chips) {
  if (!chips.length) return '';
  return `<p class="visually-hidden" id="coll-active-title">Active filters</p>`
    + `<ul class="coll-pills" role="list" aria-labelledby="coll-active-title">`
    + chips.map((c) => `<li><button class="coll-pill" type="button" data-remove="${c.facet}:${esc(c.value)}" aria-label="Remove filter: ${esc(c.label)}">`
      + `<span>${esc(c.label)}</span>${icon('close', { size: 13 })}</button></li>`).join('')
    + `</ul><button class="coll-clear" type="button" data-clear>Clear all</button>`;
}

/**
 * The editorial tile that closes an incomplete last row. It is never a
 * product (no price, no add): a real photo, one short line and a link to a
 * real place. data-mod3 / data-mod2 hold the product count modulo 3 and 2;
 * the CSS shows the tile only when the last row has empty slots and makes it
 * span exactly those. pages/collection.js updates both after every filter.
 * { image, alt, kicker, line, href, cta, wide, x, y } (wide: a 16:9 photo;
 * x / y: the crop's focus, such as '70%').
 */
export function tileHTML({ image, alt = '', kicker, line, href, cta, wide = false, x = '', y = '' }, count) {
  // The photo sits inside the panel, at most about a column wide; a 16:9
  // photo cropped to a taller frame is drawn wider than its box.
  const sizes = wide ? '(min-width: 1440px) 760px, (min-width: 1000px) 54vw, 80vw' : '(min-width: 1440px) 400px, (min-width: 1000px) 28vw, 42vw';
  const focus = [x && `--x:${esc(x)}`, y && `--y:${esc(y)}`].filter(Boolean).join(';');
  return `<div class="coll-tile" data-tile data-mod3="${count % 3}" data-mod2="${count % 2}" role="group" aria-labelledby="coll-tile-title">`
    + `<div class="coll-tile-body">`
    + `<p class="coll-tile-kicker" id="coll-tile-title">${esc(kicker)}</p>`
    + `<p class="coll-tile-line">${esc(line)}</p>`
    + `<a class="link coll-tile-link" href="${esc(href)}">${esc(cta)}${icon('arrow', { size: 16 })}</a>`
    + `</div>`
    + `<div class="coll-tile-media"${focus ? ` style="${focus}"` : ''}>${picture(image, { alt, sizes, className: 'coll-tile-pic' })}</div>`
    + `</div>`;
}

/** Phone drawer with every filter and sort, and a "Show N results" button. */
export function drawerHTML({ facets, state, counts, shown, withCategory }) {
  const groups = ['sort', ...(withCategory ? ['category'] : []), 'size', 'colour', 'price', 'stock'];
  return `<dialog class="drawer coll-drawer" id="coll-drawer" aria-labelledby="coll-drawer-title">`
    + `<div class="drawer-head"><h2 id="coll-drawer-title">Filter and sort</h2>`
    + `<button class="icon-btn" type="button" data-close-dialog aria-label="Close filters">${icon('close', { size: 22 })}</button></div>`
    + `<div class="drawer-body coll-drawer-body">`
    + groups.map((f) => `<fieldset class="coll-group" data-group="${f}"${facetVisible(f, facets, state) ? '' : ' hidden'}>`
      + `<legend class="coll-legend">${f === 'sort' ? 'Sort by' : LABELS[f]}</legend>`
      + `<div data-options="${f}">${optionsHTML(f, facets, state, counts, 'drawer')}</div></fieldset>`).join('')
    + `<p class="visually-hidden" role="status" data-drawer-status></p>`
    + `</div>`
    + `<div class="drawer-foot coll-drawer-foot">`
    + `<button class="btn btn-ghost" type="button" data-clear>Clear all</button>`
    + `<button class="btn" type="button" data-show-results>Show ${resultsLabel(shown)}</button>`
    + `</div></dialog>`;
}

/** Category links with their counts (shop all index, and the phone row on category pages). */
export function categoryNavHTML(categories, products, { current = null, includeAll = false } = {}) {
  const items = categories.map((c) => ({
    href: `/collections/${c.slug}/`, name: c.name, slug: c.slug,
    count: products.filter((p) => p.category === c.slug).length,
  }));
  if (includeAll) items.unshift({ href: '/collections/', name: 'All', slug: '', count: products.length });
  return `<nav class="coll-cats" aria-label="Categories"><ol role="list">`
    + items.map((it) => `<li><a href="${it.href}"${it.slug === (current ?? '') && (it.slug || includeAll) ? ' aria-current="page"' : ''}>`
      + `<span class="coll-cat-name">${esc(it.name)}</span>`
      + `<span class="coll-cat-n tabular" data-cat-count="${it.slug || 'all'}"><span class="visually-hidden">, </span>${it.count}<span class="visually-hidden"> ${it.count === 1 ? 'style' : 'styles'}</span></span>`
      + `</a></li>`).join('')
    + `</ol></nav>`;
}

/* ----- Browser: keyed grid renderer with view transitions ----- */

const vtName = (slug) => `coll-card-${String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
function inView(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
}
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps one element per product so re-sorting and filtering move the existing
 * cards (no image reload, no flash) and only rebuilds a card whose data changed.
 * The editorial tile ([data-tile]), if the grid has one, always stays last.
 * createGrid(grid, { seed: slug => seedProduct, cardOptions, glue: [elements kept on top],
 *                    transition: withTransition from lib/ui.js })
 *   .render(list, { animate, update }) -> Promise that resolves once the DOM
 *   is updated (update() runs inside the transition, after the old snapshot).
 * Cards on screen get a temporary view-transition-name so they glide to their
 * new places; the names are removed when the transition ends.
 */
export function createGrid(grid, { seed = null, cardOptions = {}, glue = [], transition = null } = {}) {
  const cache = new Map();
  const named = new Set();
  const tile = grid.querySelector(':scope > [data-tile]');
  let running = 0;
  grid.querySelectorAll(':scope > .card').forEach((el) => {
    const p = seed ? seed(el.dataset.slug) : null;
    cache.set(el.dataset.slug, { el, sig: p ? cardSignature(p) : null });
  });

  function elementFor(p) {
    const sig = cardSignature(p);
    const hit = cache.get(p.slug);
    if (hit && hit.sig === sig) return { el: hit.el, fresh: false };
    const t = document.createElement('template');
    t.innerHTML = productCard(p, { headingLevel: 3, sizes: LISTING_SIZES, ...cardOptions });
    const el = t.content.firstElementChild;
    cache.set(p.slug, { el, sig });
    return { el, fresh: true };
  }

  function render(list, { animate = false, update = () => {} } = {}) {
    const els = list.map((p) => elementFor(p).el);
    const kids = [...grid.children].filter((el) => el !== tile);
    const same = els.length === kids.length && els.every((el, i) => kids[i] === el);
    const commit = () => {
      if (!same) grid.replaceChildren(...els, ...(tile ? [tile] : []));
      update();
    };
    const canAnimate = animate && !same && typeof transition === 'function' && typeof document.startViewTransition === 'function'
      && !prefersReduced() && !document.querySelector('dialog[open]');
    if (!canAnimate) {
      commit();
      return Promise.resolve();
    }
    const html = document.documentElement;
    const name = (el, n) => { el.style.viewTransitionName = n; named.add(el); };
    const nameVisible = () => {
      els.forEach((el) => { if (el.isConnected && inView(el)) name(el, vtName(el.dataset.slug)); });
      if (tile && inView(tile)) name(tile, 'coll-tile');
    };
    kids.forEach((el) => { if (inView(el)) name(el, vtName(el.dataset.slug)); });
    if (tile && inView(tile)) name(tile, 'coll-tile');
    glue.forEach((el, i) => { if (el) name(el, `coll-glue-${i}`); });
    html.classList.add('coll-vt');
    const token = ++running;
    const vt = transition(() => { commit(); nameVisible(); });
    const done = () => {
      // A newer transition (a quick second click) may already have named
      // the same cards: leave its names alone.
      if (token !== running) return;
      named.forEach((el) => { el.style.viewTransitionName = ''; });
      named.clear();
      html.classList.remove('coll-vt');
    };
    if (!vt) { done(); return Promise.resolve(); } // ran without a transition
    vt.finished.then(done, done);
    return vt.updateCallbackDone.catch(() => {});
  }

  return { render };
}
