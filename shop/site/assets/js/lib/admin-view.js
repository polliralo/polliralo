// Pure HTML builders and calculations for the MONO demo admin. Imported by the
// page template (Node, for the frame) and by assets/js/pages/admin.js (browser,
// for every view), so nothing here may touch window or document at import time.

import { esc, money, picture, productUrl, icon } from './render.js';

export const BANNER = 'Anyone can open this page, and changes are saved only in this browser. A real store needs server-side sign-in, a database and server-side checks.';

export const VIEWS = [
  { id: 'dashboard', href: '/admin/', name: 'Dashboard' },
  { id: 'products', href: '/admin/products/', name: 'Products' },
  { id: 'orders', href: '/admin/orders/', name: 'Orders' },
];

export const ORDER_STATUSES = [
  { id: 'received', name: 'Received' },
  { id: 'packed', name: 'Packed' },
  { id: 'shipped', name: 'Shipped' },
  { id: 'cancelled', name: 'Cancelled' },
];

/** An option with this many or fewer left (but not none) counts as low stock. */
export const LOW_STOCK = 2;

const pad = (n) => String(n).padStart(2, '0');
const stockOf = (v) => Math.max(0, Number(v?.stock) || 0);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- Frame ---------- */

export function navHTML(view) {
  const items = VIEWS.map((v, i) => `<li><a href="${v.href}"${v.id === view ? ' aria-current="page"' : ''}>`
    + `<span class="adm-nav-num" aria-hidden="true">${pad(i + 1)}</span><span class="adm-nav-text">${esc(v.name)}</span></a></li>`).join('');
  return `<nav class="adm-nav" aria-label="Admin sections">`
    + `<p class="adm-nav-title label" aria-hidden="true">Admin</p>`
    + `<ul role="list">${items}`
    + `<li class="adm-nav-store"><a href="/"><span class="adm-nav-num" aria-hidden="true">${icon('arrow', { size: 14 })}</span><span class="adm-nav-text">View store</span></a></li>`
    + `</ul>`
    + `<p class="adm-nav-status small" data-admin-status aria-live="polite"></p>`
    + `</nav>`;
}

/* ---------- Numbers ---------- */

export function optionName(product, variant) {
  if (!variant) return '';
  if (product?.option?.type === 'none' || (product?.variants?.length ?? 0) <= 1) return product?.option?.label || 'One size';
  return `${product?.option?.label || 'Size'} ${variant.label ?? variant.id}`;
}

export function totalStock(product) {
  return (product?.variants ?? []).reduce((sum, v) => sum + stockOf(v), 0);
}

export function summarize(products, orders) {
  const out = { live: 0, hidden: 0, units: 0, low: 0, soldOut: 0, options: 0, orders: orders.length, counted: 0, revenue: 0, cancelled: 0 };
  for (const p of products) {
    if (p.hidden) out.hidden += 1; else out.live += 1;
    for (const v of p.variants ?? []) {
      const s = stockOf(v);
      out.options += 1;
      out.units += s;
      if (s === 0) out.soldOut += 1;
      else if (s <= LOW_STOCK) out.low += 1;
    }
  }
  for (const o of orders) {
    if (o.status === 'cancelled') { out.cancelled += 1; continue; }
    out.counted += 1;
    out.revenue += Number(o.total) || 0;
  }
  return out;
}

/** Options at LOW_STOCK or fewer (sold out first), for the restock list. */
export function restockItems(products) {
  const items = [];
  for (const p of products) {
    for (const v of p.variants ?? []) {
      const s = stockOf(v);
      if (s <= LOW_STOCK) items.push({ product: p, variant: v, stock: s });
    }
  }
  return items.sort((a, b) => a.stock - b.stock || a.product.name.localeCompare(b.product.name));
}

/* ---------- Dates ---------- */

export function orderDate(iso, { time = false } = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return time ? `${date}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : date;
}

export const itemCount = (o) => (o.items ?? []).reduce((n, it) => n + (Number(it.qty) || 0), 0);
export const statusName = (id) => ORDER_STATUSES.find((s) => s.id === id)?.name ?? 'Received';

/* ---------- Shared bits ---------- */

const thumb = (key, size = '48px') => `<span class="adm-thumb">${key ? picture(key, { alt: '', sizes: size }) : ''}</span>`;

function emptyHTML({ title, text, action = '' }) {
  return `<div class="adm-empty"><p class="adm-empty-title">${esc(title)}</p><p class="muted">${esc(text)}</p>${action}</div>`;
}

function panelHead(id, title, link = '') {
  return `<div class="adm-panel-head"><h2 id="${id}">${esc(title)}</h2>${link}</div>`;
}

/* ---------- Dashboard ---------- */

export function metricsHTML(m, { catalogue } = {}) {
  const tile = (label, value, sub, extra = '') => `<div class="adm-metric${extra}">`
    + `<dt>${esc(label)}</dt><dd class="adm-metric-value">${value}</dd><dd class="adm-metric-sub">${sub}</dd></div>`;
  const cat = catalogue ?? { edited: false, text: 'No changes in this browser' };
  return `<dl class="adm-metrics">`
    + tile('Live products', m.live, 'Shown in the store')
    + tile('Hidden products', m.hidden, m.hidden ? 'Kept out of the store' : 'None hidden')
    + tile('Units in stock', m.units.toLocaleString('en-US'), `Across ${plural(m.options, 'option')}`)
    + tile('Low stock', m.low, `Options with ${LOW_STOCK} or fewer left`, m.low ? ' is-alert' : '')
    + tile('Sold out', m.soldOut, m.soldOut ? '<a class="text-link" href="#adm-restock-title">Restock below</a>' : 'Every option in stock', m.soldOut ? ' is-alert' : '')
    + tile('Demo orders', m.orders, m.cancelled ? `${m.cancelled} cancelled` : 'Placed in this browser')
    + tile('Demo revenue', `<span class="adm-metric-money">${money(m.revenue, { cents: true })}</span>`, '<span class="tag">Demo</span> Excludes cancelled orders')
    + tile('Catalogue', cat.edited ? 'Edited' : 'Demo data', esc(cat.text))
    + `</dl>`;
}

export function restockHTML(items, { limit = 8 } = {}) {
  const head = panelHead('adm-restock-title', 'Needs restock', '<a class="link" href="/admin/products/">All products</a>');
  if (!items.length) {
    return `<section class="adm-panel" aria-labelledby="adm-restock-title">${head}`
      + emptyHTML({ title: 'Stock looks healthy', text: `No option has ${LOW_STOCK} or fewer left.` }) + `</section>`;
  }
  const shown = items.slice(0, limit);
  const rows = shown.map(({ product: p, variant: v, stock }) => {
    const key = `${p.slug}|${v.id}`;
    const opt = optionName(p, v);
    return `<li class="adm-restock-row" data-restock-row="${esc(key)}">`
      + thumb(p.images?.[0]?.key, '40px')
      + `<div class="adm-restock-name"><a href="/admin/products/?edit=${encodeURIComponent(p.slug)}">${esc(p.name)}</a>`
      + `<span class="muted small">${esc(opt)}${p.hidden ? ' <span class="tag">Hidden</span>' : ''}</span></div>`
      + `<span class="adm-restock-stock${stock === 0 ? ' is-out' : ''}">${stock === 0 ? 'Sold out' : `${stock} left`}</span>`
      + `<button class="adm-act adm-restock-btn" type="button" data-restock="${esc(key)}" aria-label="Add 5 to ${esc(p.name)}, ${esc(opt)}">${icon('plus', { size: 14 })}5</button>`
      + `</li>`;
  }).join('');
  const more = items.length > shown.length
    ? `<p class="small muted adm-more">${items.length - shown.length} more in <a class="text-link" href="/admin/products/">Products</a>.</p>` : '';
  return `<section class="adm-panel" aria-labelledby="adm-restock-title">${head}`
    + `<p class="small muted adm-panel-note">Options with ${LOW_STOCK} or fewer left. Each button adds 5 units to that option.</p>`
    + `<ul class="adm-restock" role="list">${rows}</ul>${more}</section>`;
}

export function recentOrdersHTML(orders, { limit = 5 } = {}) {
  const head = panelHead('adm-recent-title', 'Recent orders', orders.length ? '<a class="link" href="/admin/orders/">All orders</a>' : '');
  if (!orders.length) {
    return `<section class="adm-panel" aria-labelledby="adm-recent-title">${head}`
      + emptyHTML({ title: 'No demo orders yet', text: 'Orders placed through the demo checkout show here.', action: '<a class="link" href="/collections/">Go to the shop</a>' })
      + `</section>`;
  }
  const rows = orders.slice(0, limit).map((o) => `<tr>`
    + `<td><a class="adm-order-link" href="/admin/orders/?order=${encodeURIComponent(o.id)}">${esc(o.id)}</a><span class="adm-cell-sub">${esc(orderDate(o.createdAt))}</span></td>`
    + `<td class="num">${money(o.total, { cents: true })}</td>`
    + `<td>${statusTag(o.status)}</td>`
    + `</tr>`).join('');
  return `<section class="adm-panel" aria-labelledby="adm-recent-title">${head}`
    + `<div class="table-wrap"><table class="table adm-table adm-table-compact"><caption class="visually-hidden">The latest demo orders</caption>`
    + `<thead><tr><th scope="col">Order</th><th scope="col" class="num">Total</th><th scope="col">Status</th></tr></thead>`
    + `<tbody>${rows}</tbody></table></div></section>`;
}

export function statusTag(status) {
  const id = ORDER_STATUSES.some((s) => s.id === status) ? status : 'received';
  return `<span class="adm-state adm-state-${id}"><span class="adm-state-dot" aria-hidden="true"></span>${esc(statusName(id))}</span>`;
}

export function dataToolsHTML() {
  return `<section class="adm-panel adm-data" aria-labelledby="adm-data-title">`
    + panelHead('adm-data-title', 'Demo data')
    + `<p class="muted adm-data-text">Everything on these pages lives in this browser's storage. Download a copy as a file, or put the shop back to its demo state: the 12 demo products with their demo stock, and no demo orders.</p>`
    + `<div class="adm-data-actions">`
    + `<button class="btn btn-ghost btn-sm" type="button" data-download>Download data (JSON)</button>`
    + `<button class="btn btn-sm adm-btn-danger" type="button" data-reset>Reset demo data</button>`
    + `</div></section>`;
}

/* ---------- Products ---------- */

export function productStatusHTML(s) {
  const tags = [s.hidden
    ? '<span class="adm-state adm-state-hidden"><span class="adm-state-dot" aria-hidden="true"></span>Hidden</span>'
    : '<span class="adm-state adm-state-live"><span class="adm-state-dot" aria-hidden="true"></span>Live</span>'];
  if (s.custom) tags.push('<span class="tag adm-tag-new">New</span>');
  else if (s.edited) tags.push('<span class="tag">Edited</span>');
  return `<span class="adm-states">${tags.join('')}</span>`;
}

const SORTABLE = { name: 'Product', price: 'Price', stock: 'Stock' };

function sortHead(key, sort, extra = '') {
  const active = sort?.key === key;
  const dir = active ? sort.dir : null;
  const aria = dir ? ` aria-sort="${dir === 'asc' ? 'ascending' : 'descending'}"` : '';
  return `<th scope="col"${aria}${extra}><button class="adm-sort${active ? ` is-${dir}` : ''}" type="button" data-sort="${key}">`
    + `${SORTABLE[key]}<span class="adm-sort-mark" aria-hidden="true"></span></button></th>`;
}

export function productRowsHTML(rows, { categories = [] } = {}) {
  const catName = (slug) => categories.find((c) => c.slug === slug)?.name ?? slug;
  return rows.map(({ product: p, status }) => {
    const stock = totalStock(p);
    const low = (p.variants ?? []).filter((v) => stockOf(v) > 0 && stockOf(v) <= LOW_STOCK).length;
    const out = (p.variants ?? []).filter((v) => stockOf(v) === 0).length;
    const note = out ? `${out} sold out` : low ? `${low} low` : '';
    const name = esc(p.name);
    return `<tr data-row="${esc(p.slug)}"${p.hidden ? ' class="is-hidden"' : ''}>`
      + `<th scope="row" class="adm-sticky"><div class="adm-prod">${thumb(p.images?.[0]?.key, '48px')}`
      + `<span class="adm-prod-text"><span class="adm-prod-name">${name}</span>`
      + `<span class="adm-cell-sub">${esc(p.sku || 'No SKU')} <span aria-hidden="true">/</span> <a class="adm-view-link" href="${productUrl(p)}" data-view-link>View<span class="visually-hidden"> ${name} in the store</span></a></span></span></div></th>`
      + `<td>${esc(catName(p.category))}</td>`
      + `<td class="num">${money(p.price, { cents: true })}</td>`
      + `<td class="num"><span class="adm-stock${stock === 0 ? ' is-out' : ''}">${stock}</span>${note ? `<span class="adm-cell-sub">${note}</span>` : ''}</td>`
      + `<td>${productStatusHTML(status)}</td>`
      + `<td class="adm-actions-cell"><div class="adm-actions">`
      + `<button class="adm-act" type="button" data-edit="${esc(p.slug)}" aria-label="Edit ${name}">${icon('edit', { size: 15 })}<span>Edit</span></button>`
      + `<button class="adm-act" type="button" data-toggle="${esc(p.slug)}" aria-label="${p.hidden ? 'Show' : 'Hide'} ${name}">`
      + `<span>${p.hidden ? 'Show' : 'Hide'}</span></button>`
      + `<button class="adm-act adm-act-danger" type="button" data-delete="${esc(p.slug)}" aria-label="Delete ${name}">${icon('trash', { size: 15 })}<span>Delete</span></button>`
      + `</div></td></tr>`;
  }).join('');
}

export function productsTableHTML(rows, { categories = [], sort = null } = {}) {
  return `<div class="table-wrap adm-table-wrap"><table class="table adm-table adm-products-table">`
    + `<caption class="visually-hidden">Products in the demo catalogue</caption>`
    + `<thead><tr>${sortHead('name', sort, ' class="adm-sticky"')}<th scope="col">Category</th>${sortHead('price', sort, ' class="num"')}${sortHead('stock', sort, ' class="num"')}`
    + `<th scope="col">Status</th><th scope="col" class="adm-actions-cell"><span class="visually-hidden">Actions</span></th></tr></thead>`
    + `<tbody data-product-rows>${productRowsHTML(rows, { categories })}</tbody></table></div>`;
}

/* ---------- Orders ---------- */

function addressLines(d = {}) {
  return [d.name, d.address1, d.address2, [d.city, d.region, d.postcode].filter(Boolean).join(', '), d.country]
    .filter((x) => x && String(x).trim()).map((x) => `<span>${esc(x)}</span>`).join('');
}

export function orderDetailHTML(o) {
  const items = (o.items ?? []).map((it) => `<li class="adm-item">${thumb(it.imageKey, '40px')}`
    + `<span class="adm-item-text"><span class="adm-item-name">${esc(it.name)}</span>`
    + `<span class="muted small">${esc([it.optionLabel && it.variantLabel ? `${it.optionLabel} ${it.variantLabel}` : (it.variantLabel || ''), `Qty ${Number(it.qty) || 0}`, money(it.unitPrice, { cents: true })].filter(Boolean).join(' / '))}</span></span>`
    + `<span class="adm-item-total">${money(it.lineTotal ?? (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), { cents: true })}</span></li>`).join('');
  const contact = o.contact ?? {};
  return `<div class="adm-detail">`
    + `<div class="adm-detail-col adm-detail-items"><h3 class="label">Items</h3><ul class="adm-items" role="list">${items || '<li class="muted small">No items recorded.</li>'}</ul></div>`
    + `<div class="adm-detail-col"><h3 class="label">Delivery</h3><p class="adm-address">${addressLines(o.delivery) || '<span class="muted">No address recorded.</span>'}</p>`
    + `<p class="small"><span class="muted">Method:</span> ${esc(o.shippingName || 'Standard delivery')}, ${Number(o.shipping) ? money(o.shipping, { cents: true }) : 'free'}</p></div>`
    + `<div class="adm-detail-col"><h3 class="label">Contact and payment</h3>`
    + `<p class="adm-address">${contact.email ? `<span>${esc(contact.email)}</span>` : ''}${contact.phone ? `<span>${esc(contact.phone)}</span>` : ''}${!contact.email && !contact.phone ? '<span class="muted">No contact recorded.</span>' : ''}</p>`
    + `<p class="small"><span class="muted">Payment:</span> ${esc(o.paymentName || 'Test card')}</p>`
    + `<div class="adm-sums"><p class="sum-row"><span>Subtotal</span><span>${money(o.subtotal, { cents: true })}</span></p>`
    + `<p class="sum-row"><span>Delivery</span><span>${Number(o.shipping) ? money(o.shipping, { cents: true }) : 'Free'}</span></p>`
    + `<p class="sum-row total"><span>Total <span class="tag">Demo</span></span><span>${money(o.total, { cents: true })}</span></p></div>`
    + `<p class="small muted">Demo order: nothing was charged or shipped.</p></div>`
    + `</div>`;
}

export function orderRowsHTML(orders, { open = new Set() } = {}) {
  return orders.map((o) => {
    const id = esc(o.id);
    const did = `adm-od-${String(o.id).replace(/[^A-Za-z0-9-]/g, '')}`;
    const isOpen = open.has(o.id);
    const options = ORDER_STATUSES.map((s) => `<option value="${s.id}"${s.id === (o.status || 'received') ? ' selected' : ''}>${s.name}</option>`).join('');
    const n = itemCount(o);
    return `<tr class="adm-order-row${isOpen ? ' is-open' : ''}${o.status === 'cancelled' ? ' is-cancelled' : ''}" data-order="${id}">`
      + `<th scope="row" class="adm-sticky"><button class="adm-order-toggle" type="button" aria-expanded="${isOpen}" aria-controls="${did}" data-toggle-order="${id}">`
      + `<span class="adm-chev" aria-hidden="true">${icon('right', { size: 14 })}</span><span class="adm-order-id">${id}</span><span class="visually-hidden">, details</span></button></th>`
      + `<td>${esc(orderDate(o.createdAt))}<span class="adm-cell-sub">${esc(new Date(o.createdAt).getTime() ? new Date(o.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '')}</span></td>`
      + `<td>${esc(o.delivery?.name || 'No name')}</td>`
      + `<td class="num">${n}</td>`
      + `<td class="num">${money(o.total, { cents: true })}</td>`
      + `<td>${esc(o.paymentName || 'Test card')}</td>`
      + `<td><span class="adm-status-wrap adm-state-${esc(o.status || 'received')}"><span class="adm-state-dot" aria-hidden="true"></span>`
      + `<label class="visually-hidden" for="adm-st-${id}">Status of order ${id}</label>`
      + `<select class="select adm-status-select" id="adm-st-${id}" data-status="${id}">${options}</select></span></td>`
      + `</tr>`
      + `<tr class="adm-order-detail" id="${did}"${isOpen ? '' : ' hidden'}><td colspan="7"><div class="adm-detail-pin">${orderDetailHTML(o)}</div></td></tr>`;
  }).join('');
}

export function ordersTableHTML(orders, opts) {
  return `<div class="table-wrap adm-table-wrap"><table class="table adm-table adm-orders-table">`
    + `<caption class="visually-hidden">Demo orders, newest first</caption>`
    + `<thead><tr><th scope="col" class="adm-sticky">Order</th><th scope="col">Date</th><th scope="col">Customer</th><th scope="col" class="num">Items</th>`
    + `<th scope="col" class="num">Total</th><th scope="col">Payment</th><th scope="col">Status</th></tr></thead>`
    + `<tbody data-order-rows>${orderRowsHTML(orders, opts)}</tbody></table></div>`;
}

export function ordersEmptyHTML() {
  return emptyHTML({
    title: 'No demo orders yet',
    text: 'Orders placed through the demo checkout in this browser show here, newest first.',
    action: '<a class="btn btn-sm" href="/collections/">Go to the shop</a>',
  });
}

/* ---------- Product editing helpers (pure) ---------- */

/** "Olive Piqué Polo!" -> "olive-pique-polo" */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stable JSON (sorted keys) so key order never counts as an edit. */
export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Comparable copy: drops bookkeeping and false "hidden". */
export function comparable(p) {
  if (!p) return '';
  const { custom, hidden, ...rest } = p;
  return stable(hidden ? { ...rest, hidden: true } : rest);
}
