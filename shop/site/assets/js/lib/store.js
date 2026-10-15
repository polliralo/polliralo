// The MONO demo "database". The seed catalogue ships as /assets/data/store.json
// (built from shop/src/data). Admin edits, stock changes and demo orders are
// kept in this browser's localStorage, so they survive reloads but are never
// shared with other visitors. A real shop would put this behind a server.

import { configure } from './render.js';

const STORE_URL = '/assets/data/store.json';
const KEYS = {
  catalog: 'mono.catalog.v1',
  orders: 'mono.orders.v1',
};

let seed = null;
let state = null; // { products, categories, looks, meta, edited }
let loading = null;

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage blocked */ }
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function hydrate() {
  const saved = storage.get(KEYS.catalog);
  // Saved edits only apply to the catalogue version they were made against.
  const usable = saved && saved.version === seed.version && Array.isArray(saved.products);
  state = {
    meta: seed.catalog.meta,
    categories: seed.catalog.categories,
    looks: seed.catalog.looks,
    products: usable ? saved.products : clone(seed.catalog.products),
    edited: Boolean(usable),
  };
}

/** Loads the catalogue once per page. Safe to call from anywhere. */
export function loadStore() {
  if (state) return Promise.resolve(state);
  if (!loading) {
    loading = fetch(STORE_URL, { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load the catalogue (${res.status})`);
        return res.json();
      })
      .then((data) => {
        seed = data;
        configure({ media: data.media });
        hydrate();
        return state;
      });
  }
  return loading;
}

/**
 * Run fn(state) once the catalogue has loaded, then again whenever it changes
 * (an admin edit in this tab or another). Use it to bring pre-rendered markup
 * in line with edited prices, stock or new products.
 */
export function onStore(fn) {
  return loadStore().then((s) => {
    fn(s);
    window.addEventListener('mono:catalog', () => fn(getState()));
    return s;
  });
}

/** Synchronous access after loadStore() has resolved. */
export function getState() {
  if (!state) throw new Error('loadStore() has not finished yet');
  return state;
}

export const getMeta = () => getState().meta;
export const getSizeGuide = () => seed?.sizeGuide ?? null;
export const getCategories = () => getState().categories;
export const getCategory = (slug) => getState().categories.find((c) => c.slug === slug) ?? null;
export const getLooks = () => getState().looks;
export const getProducts = ({ category } = {}) =>
  getState().products.filter((p) => !p.hidden && (!category || p.category === category));
export const getAllProducts = () => getState().products;
export const getProduct = (slug) => getState().products.find((p) => p.slug === slug) ?? null;
export const getVariant = (product, id) => product?.variants?.find((v) => v.id === id) ?? null;
export const isEdited = () => getState().edited;
export const seedProduct = (slug) => seed?.catalog.products.find((p) => p.slug === slug) ?? null;

function persistCatalog() {
  state.edited = true;
  storage.set(KEYS.catalog, { version: seed.version, products: state.products, savedAt: new Date().toISOString() });
  emit('mono:catalog', { products: state.products });
}

/** Create or update a product (admin). Returns the saved copy. */
export function saveProduct(product, { previousSlug } = {}) {
  const list = state.products;
  const key = previousSlug ?? product.slug;
  const index = list.findIndex((p) => p.slug === key);
  const isSeed = Boolean(seed.catalog.products.find((p) => p.slug === product.slug));
  const saved = { ...clone(product), custom: !isSeed };
  if (index === -1) list.push(saved);
  else list[index] = saved;
  persistCatalog();
  return saved;
}

export function deleteProduct(slug) {
  state.products = state.products.filter((p) => p.slug !== slug);
  persistCatalog();
}

/** Put the catalogue back to the shipped demo data. */
export function resetCatalog() {
  storage.remove(KEYS.catalog);
  state.products = clone(seed.catalog.products);
  state.edited = false;
  emit('mono:catalog', { products: state.products });
}

/** Change stock for one variant (negative to take stock away). */
export function adjustStock(slug, variantId, delta) {
  const product = getProduct(slug);
  const variant = getVariant(product, variantId);
  if (!variant) return;
  variant.stock = Math.max(0, (Number(variant.stock) || 0) + delta);
  persistCatalog();
}

/* ----- Demo orders ----- */

export const listOrders = () => storage.get(KEYS.orders, []);

export function getOrder(id) {
  return listOrders().find((o) => o.id === id) ?? null;
}

export function addOrder(order) {
  const orders = listOrders();
  orders.unshift(order);
  storage.set(KEYS.orders, orders);
  emit('mono:orders', { orders });
  return order;
}

export function updateOrder(id, patch) {
  const orders = listOrders().map((o) => (o.id === id ? { ...o, ...patch } : o));
  storage.set(KEYS.orders, orders);
  emit('mono:orders', { orders });
}

export function clearOrders() {
  storage.remove(KEYS.orders);
  emit('mono:orders', { orders: [] });
}

/** A short, readable demo order number, e.g. MONO-7KQ4-2M. */
export function newOrderId() {
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  const r = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `MONO-${t}-${r}`;
}

// Keep tabs in step: an edit in the admin tab shows up in the shop tab.
window.addEventListener('storage', (e) => {
  if (!state || !seed) return;
  if (e.key === KEYS.catalog) {
    hydrate();
    emit('mono:catalog', { products: state.products });
  }
  if (e.key === KEYS.orders) emit('mono:orders', { orders: listOrders() });
});
