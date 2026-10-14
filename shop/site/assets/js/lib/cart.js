// The bag. Items are stored as { slug, variant, qty }; names, prices and stock
// are always read from the catalogue, so an admin price change shows up in the
// bag straight away.

import { storage, getProduct, getVariant } from './store.js';

const KEY = 'mono.cart.v1';
export const MAX_QTY = 10;

const read = () => storage.get(KEY, []).filter((i) => i && i.slug && i.variant && i.qty > 0);
const write = (items) => {
  storage.set(KEY, items);
  window.dispatchEvent(new CustomEvent('mono:cart', { detail: { items } }));
};

export const getItems = read;
export const count = () => read().reduce((n, i) => n + i.qty, 0);

/**
 * Add to the bag. Returns { ok, qty, reason }:
 *   reason "missing"   product or option no longer exists
 *   reason "sold-out"  nothing left of that option
 *   reason "limit"     only part of the request fit (stock or the per-item cap)
 */
export function add(slug, variantId, qty = 1) {
  const product = getProduct(slug);
  const variant = getVariant(product, variantId);
  if (!product || !variant || product.hidden) return { ok: false, qty: 0, reason: 'missing' };
  const stock = Math.max(0, Number(variant.stock) || 0);
  if (stock === 0) return { ok: false, qty: 0, reason: 'sold-out' };
  const items = read();
  const line = items.find((i) => i.slug === slug && i.variant === variantId);
  const current = line?.qty ?? 0;
  const cap = Math.min(stock, MAX_QTY);
  const next = Math.min(cap, current + qty);
  if (next === current) return { ok: false, qty: current, reason: 'limit' };
  if (line) line.qty = next;
  else items.push({ slug, variant: variantId, qty: next });
  write(items);
  return { ok: true, qty: next, reason: next - current < qty ? 'limit' : null };
}

export function setQty(slug, variantId, qty) {
  const items = read();
  const line = items.find((i) => i.slug === slug && i.variant === variantId);
  if (!line) return;
  const variant = getVariant(getProduct(slug), variantId);
  const cap = Math.min(Math.max(0, Number(variant?.stock) || 0), MAX_QTY);
  line.qty = Math.max(0, Math.min(cap || 0, Math.round(qty)));
  write(items.filter((i) => i.qty > 0));
}

export function remove(slug, variantId) {
  write(read().filter((i) => !(i.slug === slug && i.variant === variantId)));
}

/** Put a removed line back (for "Undo"). */
export function restore(item) {
  const items = read();
  if (!items.find((i) => i.slug === item.slug && i.variant === item.variant)) items.push(item);
  write(items);
}

export function clear() {
  write([]);
}

/**
 * Lines with everything a view needs. `issue` is set when a line cannot be
 * bought as it stands: "missing", "sold-out" or "limited" (qty above stock).
 */
export function lines() {
  return read().map((item) => {
    const product = getProduct(item.slug);
    const variant = getVariant(product, item.variant);
    const stock = Math.max(0, Number(variant?.stock) || 0);
    let issue = null;
    if (!product || !variant || product.hidden) issue = 'missing';
    else if (stock === 0) issue = 'sold-out';
    else if (item.qty > stock) issue = 'limited';
    const unitPrice = product ? Number(product.price) || 0 : 0;
    return {
      ...item,
      product,
      variantData: variant,
      stock,
      issue,
      unitPrice,
      lineTotal: issue === 'missing' || issue === 'sold-out' ? 0 : unitPrice * Math.min(item.qty, stock),
    };
  });
}

export const subtotal = () => lines().reduce((sum, l) => sum + l.lineTotal, 0);
export const hasIssues = () => lines().some((l) => l.issue);

// Another tab changed the bag: tell this tab's views.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) window.dispatchEvent(new CustomEvent('mono:cart', { detail: { items: read() } }));
});
