// The MONO demo admin: dashboard, products and orders. Everything renders from
// the browser store (lib/store.js) after loadStore(), and re-renders on
// mono:catalog and mono:orders, so edits made in another tab show up here too.
// Pure markup builders live in lib/admin-view.js; the product editor in
// lib/admin-editor.js.

import {
  loadStore, getAllProducts, getCategories, getProduct, seedProduct, saveProduct, deleteProduct,
  resetCatalog, adjustStock, listOrders, updateOrder, clearOrders, isEdited, storage,
} from '../lib/store.js';
import { esc, money, productUrl, icon } from '../lib/render.js';
import { $, $$, openDialog, closeDialog, announce, toast, enhance } from '../lib/ui.js';
import * as V from '../lib/admin-view.js';
import { createEditor } from '../lib/admin-editor.js';

const root = $('[data-admin]');
if (root) init();

function readData() {
  try { return JSON.parse($('#adm-data')?.textContent || '{}'); } catch { return {}; }
}

function init() {
  const view = root.dataset.view;
  const mount = $('[data-admin-view]', root);
  const data = readData();
  const seedSlugs = data.seedSlugs ?? [];

  loadStore().then(() => {
    mount.setAttribute('aria-busy', 'false');
    mount.classList.add('adm-enter');
    setTimeout(() => mount.classList.remove('adm-enter'), 1400);
    const ctx = { mount, seedSlugs, media: data.media ?? [] };
    const controller = (view === 'products' ? productsView : view === 'orders' ? ordersView : dashboardView)(ctx);
    const rerender = () => { controller.render(); updateStatus(seedSlugs); };
    controller.render();
    updateStatus(seedSlugs);
    window.addEventListener('mono:catalog', rerender);
    window.addEventListener('mono:orders', rerender);
    controller.ready?.();
  }).catch(() => {
    mount.setAttribute('aria-busy', 'false');
    mount.innerHTML = `<div class="notice is-error adm-load-error"><p>The demo data could not be loaded. Check the connection and try again.</p>`
      + `<button class="btn btn-sm" type="button" data-retry>Try again</button></div>`;
    $('[data-retry]', mount).addEventListener('click', () => window.location.reload());
  });
}

/* ---------- Shared helpers ---------- */

/** What changed in this browser compared with the shipped catalogue. */
function catalogueChanges(seedSlugs) {
  const products = getAllProducts();
  const slugs = new Set(products.map((p) => p.slug));
  let changed = 0;
  let added = 0;
  for (const p of products) {
    const seed = seedProduct(p.slug);
    if (!seed || p.custom) added += 1;
    else if (V.comparable(p) !== V.comparable(seed)) changed += 1;
  }
  const removed = seedSlugs.filter((s) => !slugs.has(s)).length;
  const saved = storage.get('mono.catalog.v1')?.savedAt;
  return { edited: isEdited(), changed, added, removed, savedAt: saved };
}

function catalogueText(c) {
  if (!c.edited) return 'No changes in this browser';
  const parts = [];
  if (c.changed) parts.push(`${c.changed} changed`);
  if (c.added) parts.push(`${c.added} added`);
  if (c.removed) parts.push(`${c.removed} removed`);
  const when = c.savedAt ? `Saved ${V.orderDate(c.savedAt, { time: true })}` : '';
  return [parts.join(', ') || 'Saved, same as the demo data', when].filter(Boolean).join('. ');
}

function updateStatus(seedSlugs) {
  const el = $('[data-admin-status]', root);
  if (!el) return;
  const c = catalogueChanges(seedSlugs);
  el.innerHTML = `<span class="adm-status-dot${c.edited ? ' is-edited' : ''}" aria-hidden="true"></span>`
    + `<span>${c.edited ? 'Catalogue edited in this browser' : 'Catalogue: demo data'}</span>`;
}

function statusOf(p) {
  const seed = seedProduct(p.slug);
  const custom = Boolean(p.custom || !seed);
  return { hidden: Boolean(p.hidden), custom, edited: !custom && V.comparable(p) !== V.comparable(seed) };
}

function flash(el) {
  if (!el) return;
  el.classList.remove('is-flash');
  void el.offsetWidth;
  el.classList.add('is-flash');
  setTimeout(() => el.classList.remove('is-flash'), 1600);
}

/* ----- Confirmation dialog (delete, reset, clear, discard) ----- */

// A fresh <dialog> per question: ui.js closeDialog leaves a fallback timer
// running, which would otherwise shut a confirmation reopened within 500ms.
function ask({ title, text, confirmLabel = 'Confirm', cancelLabel = 'Cancel', opener }) {
  $$('dialog.adm-confirm:not([open])').forEach((d) => d.remove());
  const d = document.createElement('dialog');
  d.className = 'adm-confirm';
  d.setAttribute('aria-labelledby', 'adm-confirm-title');
  d.setAttribute('aria-describedby', 'adm-confirm-text');
  d.innerHTML = `<div class="adm-confirm-inner"><h2 id="adm-confirm-title">${esc(title)}</h2><p id="adm-confirm-text">${esc(text)}</p>`
    + `<div class="adm-confirm-actions"><button class="btn btn-ghost btn-sm" type="button" data-confirm-cancel>${esc(cancelLabel)}</button>`
    + `<button class="btn btn-sm adm-btn-solid-danger" type="button" data-confirm-ok>${esc(confirmLabel)}</button></div></div>`;
  document.body.append(d);
  const ok = $('[data-confirm-ok]', d);
  const cancel = $('[data-confirm-cancel]', d);
  return new Promise((resolve) => {
    let result = false;
    ok.addEventListener('click', () => { result = true; closeDialog(d); });
    cancel.addEventListener('click', () => closeDialog(d));
    openDialog(d, { opener });
    // Registered after openDialog's own close handler, so focus is restored first.
    d.addEventListener('close', () => {
      resolve(result);
      setTimeout(() => d.remove(), 0);
    }, { once: true });
    cancel.focus();
  });
}

/* ---------- Dashboard ---------- */

function dashboardView({ mount, seedSlugs }) {
  mount.innerHTML = `<div class="adm-dash">`
    + `<section class="adm-block" aria-labelledby="adm-glance-title"><h2 class="visually-hidden" id="adm-glance-title">At a glance</h2><div data-metrics></div></section>`
    + `<div class="adm-dash-grid"><div class="adm-dash-col" data-restock></div><div class="adm-dash-col" data-recent></div></div>`
    + V.dataToolsHTML()
    + `</div>`;

  function render() {
    const products = getAllProducts();
    const orders = listOrders();
    const c = catalogueChanges(seedSlugs);
    $('[data-metrics]', mount).innerHTML = V.metricsHTML(V.summarize(products, orders), { catalogue: { edited: c.edited, text: catalogueText(c) } });
    $('[data-restock]', mount).innerHTML = V.restockHTML(V.restockItems(products));
    $('[data-recent]', mount).innerHTML = V.recentOrdersHTML(sortOrders(orders));
    $('#adm-restock-title', mount)?.setAttribute('tabindex', '-1');
    enhance(mount);
  }

  function restock(btn) {
    const key = btn.dataset.restock;
    const [slug, id] = key.split('|');
    const keys = $$('[data-restock]', mount).map((b) => b.dataset.restock);
    const index = keys.indexOf(key);
    adjustStock(slug, id, 5); // emits mono:catalog, which re-renders
    const p = getProduct(slug);
    const v = p?.variants?.find((x) => x.id === id);
    const opt = V.optionName(p, v);
    const msg = `Added 5 to ${p?.name}, ${opt}. ${Number(v?.stock) || 0} in stock now.`;
    const buttons = $$('[data-restock]', mount);
    const next = $(`[data-restock="${CSS.escape(key)}"]`, mount) ?? buttons[index] ?? buttons[index - 1] ?? $('#adm-restock-title', mount);
    next?.focus();
    announce(msg);
    toast({ message: msg, imageKey: p?.images?.[0]?.key });
  }

  function download() {
    const payload = {
      note: 'MONO demo data from this browser. Fictional products and demo orders, not real records.',
      exportedAt: new Date().toISOString(),
      products: getAllProducts(),
      orders: listOrders(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mono-demo-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    announce('Download started: products and orders as a JSON file.');
  }

  async function reset(btn) {
    const yes = await ask({
      title: 'Reset the demo data?',
      text: 'This brings back the 12 demo products with their demo stock and deletes the demo orders saved in this browser. Your changes cannot be brought back.',
      confirmLabel: 'Reset demo data',
      opener: btn,
    });
    if (!yes) return;
    resetCatalog();
    clearOrders();
    const fresh = $('[data-reset]', mount);
    fresh?.focus();
    announce('Demo data reset. 12 demo products, no demo orders.');
    toast({ message: 'Demo data reset: 12 demo products, no demo orders.' });
  }

  mount.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-restock]')) restock(t);
    else if (t.matches('[data-download]')) download();
    else if (t.matches('[data-reset]')) reset(t);
  });

  return { render };
}

/* ---------- Products ---------- */

function productsView({ mount, seedSlugs, media }) {
  const params = new URLSearchParams(window.location.search);
  const categories = getCategories();
  const state = {
    q: params.get('q') ?? '',
    category: categories.some((c) => c.slug === params.get('category')) ? params.get('category') : '',
    status: ['live', 'hidden', 'edited', 'new'].includes(params.get('status')) ? params.get('status') : '',
    sort: null,
  };

  mount.innerHTML = `<div class="adm-products">`
    + `<div class="adm-toolbar" role="search" aria-label="Filter products">`
    + `<div class="field adm-field adm-search"><label for="adm-q">Search</label><div class="adm-search-box">${icon('search', { size: 18 })}`
    + `<input class="input" id="adm-q" type="search" placeholder="Name or SKU" autocomplete="off" spellcheck="false" enterkeyhint="search" value="${esc(state.q)}"></div></div>`
    + `<div class="field adm-field adm-filter"><label for="adm-cat">Category</label><select class="select" id="adm-cat"><option value="">All categories</option>`
    + categories.map((c) => `<option value="${esc(c.slug)}"${c.slug === state.category ? ' selected' : ''}>${esc(c.name)}</option>`).join('')
    + `</select></div>`
    + `<div class="field adm-field adm-filter"><label for="adm-st">Status</label><select class="select" id="adm-st">`
    + [['', 'Any status'], ['live', 'Live'], ['hidden', 'Hidden'], ['edited', 'Edited'], ['new', 'New']].map(([v, n]) => `<option value="${v}"${v === state.status ? ' selected' : ''}>${n}</option>`).join('')
    + `</select></div>`
    + `<button class="btn btn-sm adm-add" type="button" data-add>${icon('plus', { size: 16 })}Add product</button>`
    + `</div>`
    + `<p class="adm-count" data-count aria-live="polite"></p>`
    + `<div data-table></div>`
    + `</div>`;

  const addBtn = $('[data-add]', mount);
  const tableHost = $('[data-table]', mount);

  const editor = createEditor({
    categories,
    media,
    getProducts: getAllProducts,
    seedSlugs,
    ask,
    onSave(product, { previousSlug, isNew }) {
      const saved = saveProduct(product, { previousSlug: previousSlug ?? undefined });
      if (!$(`[data-row="${CSS.escape(saved.slug)}"]`, mount)) {
        // The filters would hide it: clear them so the person sees what they saved.
        clearFilters({ silent: true });
      }
      flash($(`[data-row="${CSS.escape(saved.slug)}"]`, mount));
      const msg = isNew ? `Added ${saved.name}.` : `Saved ${saved.name}.`;
      announce(`${msg} ${saved.hidden ? 'It is hidden from the store.' : 'It shows in the store in this browser.'}`);
      toast({ message: msg, imageKey: saved.images?.[0]?.key, action: { label: 'View in store', href: productUrl(saved) }, timeout: 6000 });
      return { returnFocus: () => $(`[data-edit="${CSS.escape(saved.slug)}"]`, mount) ?? addBtn };
    },
  });

  function rows() {
    const q = state.q.trim().toLowerCase();
    let list = getAllProducts().map((p) => ({ product: p, status: statusOf(p) }));
    if (q) list = list.filter(({ product: p }) => [p.name, p.sku, p.slug].some((x) => String(x ?? '').toLowerCase().includes(q)));
    if (state.category) list = list.filter(({ product: p }) => p.category === state.category);
    if (state.status) {
      list = list.filter(({ status: s }) => (state.status === 'live' ? !s.hidden
        : state.status === 'hidden' ? s.hidden
          : state.status === 'edited' ? s.edited : s.custom));
    }
    if (state.sort) {
      const { key, dir } = state.sort;
      const val = (p) => (key === 'price' ? Number(p.price) || 0 : key === 'stock' ? V.totalStock(p) : String(p.name).toLowerCase());
      list = [...list].sort((a, b) => {
        const x = val(a.product);
        const y = val(b.product);
        const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
        return dir === 'asc' ? c : -c;
      });
    }
    return list;
  }

  function filtered() {
    return Boolean(state.q.trim() || state.category || state.status);
  }

  function syncUrl() {
    const p = new URLSearchParams(window.location.search);
    p.delete('edit');
    p.delete('new');
    for (const k of ['q', 'category', 'status']) { if (state[k]) p.set(k, state[k]); else p.delete(k); }
    const qs = p.toString();
    history.replaceState(history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }

  // Remember which control in the table had focus, so a re-render (from this
  // tab or another) puts focus back on its replacement.
  function focusMemo() {
    const a = document.activeElement;
    if (!a || !tableHost.contains(a)) return null;
    for (const attr of ['data-edit', 'data-toggle', 'data-delete', 'data-sort', 'data-clear-filters']) {
      if (a.hasAttribute(attr)) return `[${attr}="${CSS.escape(a.getAttribute(attr))}"]`;
    }
    if (a.matches('[data-view-link]')) return `[data-row="${CSS.escape(a.closest('[data-row]')?.dataset.row ?? '')}"] [data-view-link]`;
    return null;
  }

  function render() {
    const memo = focusMemo();
    const wrap = $('.table-wrap', tableHost);
    const scrollLeft = wrap?.scrollLeft ?? 0;
    const list = rows();
    const total = getAllProducts().length;
    if (!total) {
      tableHost.innerHTML = `<div class="adm-empty"><p class="adm-empty-title" tabindex="-1">No products yet</p>`
        + `<p class="muted">Add a product, or reset the demo data from the dashboard to bring back the 12 demo products.</p>`
        + `<a class="link" href="/admin/">Go to the dashboard</a></div>`;
    } else if (!list.length) {
      tableHost.innerHTML = `<div class="adm-empty"><p class="adm-empty-title" tabindex="-1">No products match</p>`
        + `<p class="muted">Nothing fits ${state.q.trim() ? `"${esc(state.q.trim())}"` : 'these filters'}. Try another word or clear the filters.</p>`
        + `<button class="btn btn-ghost btn-sm" type="button" data-clear-filters>Clear filters</button></div>`;
    } else {
      tableHost.innerHTML = V.productsTableHTML(list, { categories, sort: state.sort });
      const w = $('.table-wrap', tableHost);
      if (w && scrollLeft) w.scrollLeft = scrollLeft;
    }
    $('[data-count]', mount).textContent = filtered()
      ? `Showing ${list.length} of ${total} ${total === 1 ? 'product' : 'products'}`
      : `${total} ${total === 1 ? 'product' : 'products'}`;
    enhance(tableHost);
    if (memo) $(memo, tableHost)?.focus({ preventScroll: true });
  }

  function clearFilters({ silent = false } = {}) {
    state.q = '';
    state.category = '';
    state.status = '';
    $('#adm-q', mount).value = '';
    $('#adm-cat', mount).value = '';
    $('#adm-st', mount).value = '';
    syncUrl();
    render();
    if (!silent) {
      $('#adm-q', mount).focus();
      announce('Filters cleared.');
    }
  }

  function toggleHidden(slug) {
    const p = getProduct(slug);
    if (!p) return;
    const next = { ...p };
    if (next.hidden) delete next.hidden; else next.hidden = true;
    saveProduct(next, { previousSlug: slug });
    const btn = $(`[data-toggle="${CSS.escape(slug)}"]`, mount);
    (btn ?? addBtn).focus();
    flash($(`[data-row="${CSS.escape(slug)}"]`, mount));
    announce(next.hidden ? `${p.name} is hidden from the store.` : `${p.name} shows in the store again.`);
  }

  async function remove(slug, btn) {
    const p = getProduct(slug);
    if (!p) return;
    const status = statusOf(p);
    const yes = await ask({
      title: `Delete ${p.name}?`,
      text: status.custom
        ? 'This product was added in this browser. Deleting it removes it for good.'
        : 'It leaves the catalogue in this browser. Reset demo data on the dashboard brings the demo products back.',
      confirmLabel: 'Delete product',
      opener: btn,
    });
    if (!yes) return;
    const before = $$('[data-row]', mount).map((r) => r.dataset.row);
    const index = before.indexOf(slug);
    const copy = JSON.parse(JSON.stringify(p));
    deleteProduct(slug);
    const after = $$('[data-row]', mount);
    const target = after[index] ?? after[index - 1];
    ($('[data-delete]', target ?? document.createElement('div')) ?? addBtn).focus();
    announce(`${p.name} deleted.`);
    toast({
      message: `Deleted ${p.name}.`,
      action: {
        label: 'Undo',
        onClick: () => {
          if (getProduct(copy.slug)) return;
          saveProduct(copy);
          $(`[data-edit="${CSS.escape(copy.slug)}"]`, mount)?.focus();
          flash($(`[data-row="${CSS.escape(copy.slug)}"]`, mount));
          announce(`${copy.name} restored.`);
        },
      },
      timeout: 6000,
    });
  }

  function editByUrl() {
    const slug = params.get('edit');
    if (slug) {
      const p = getProduct(slug);
      if (p) editor.open(p, { returnFocus: () => $(`[data-edit="${CSS.escape(slug)}"]`, mount) ?? addBtn });
    } else if (params.get('new') === '1') {
      editor.open(null, { opener: addBtn });
    }
    if (slug || params.has('new')) syncUrl();
  }

  mount.addEventListener('input', (e) => {
    if (e.target.id !== 'adm-q') return;
    state.q = e.target.value;
    syncUrl();
    render();
  });
  mount.addEventListener('change', (e) => {
    if (e.target.id === 'adm-cat') state.category = e.target.value;
    else if (e.target.id === 'adm-st') state.status = e.target.value;
    else return;
    syncUrl();
    render();
  });
  mount.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-add]')) editor.open(null, { opener: t });
    else if (t.matches('[data-edit]')) {
      const slug = t.dataset.edit;
      const p = getProduct(slug);
      if (p) editor.open(p, { returnFocus: () => $(`[data-edit="${CSS.escape(slug)}"]`, mount) ?? addBtn });
    } else if (t.matches('[data-toggle]')) toggleHidden(t.dataset.toggle);
    else if (t.matches('[data-delete]')) remove(t.dataset.delete, t);
    else if (t.matches('[data-clear-filters]')) clearFilters();
    else if (t.matches('[data-sort]')) {
      const key = t.dataset.sort;
      state.sort = state.sort?.key === key ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
      render();
      $(`[data-sort="${key}"]`, mount)?.focus();
      announce(`Sorted by ${key === 'name' ? 'name' : key}, ${state.sort.dir === 'asc' ? 'ascending' : 'descending'}.`);
    }
  });

  return { render, ready: editByUrl };
}

/* ---------- Orders ---------- */

function sortOrders(orders) {
  return [...orders].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}

function ordersView({ mount }) {
  const params = new URLSearchParams(window.location.search);
  const open = new Set(params.get('order') ? [params.get('order')] : []);
  let first = true;

  mount.innerHTML = `<div class="adm-orders">`
    + `<div class="adm-toolbar adm-orders-bar"><p class="adm-orders-summary" data-orders-summary aria-live="polite"></p>`
    + `<button class="btn btn-sm adm-btn-danger" type="button" data-clear-orders>Clear demo orders</button></div>`
    + `<div data-orders></div></div>`;
  const host = $('[data-orders]', mount);
  const clearBtn = $('[data-clear-orders]', mount);

  function render() {
    const active = document.activeElement;
    const memo = active && host.contains(active)
      ? (active.dataset.status ? `[data-status="${CSS.escape(active.dataset.status)}"]` : active.dataset.toggleOrder ? `[data-toggle-order="${CSS.escape(active.dataset.toggleOrder)}"]` : null)
      : null;
    const wrap = $('.table-wrap', host);
    const scrollLeft = wrap?.scrollLeft ?? 0;
    const orders = sortOrders(listOrders());
    const m = V.summarize([], orders);
    clearBtn.hidden = !orders.length;
    $('[data-orders-summary]', mount).innerHTML = orders.length
      ? `<span>${orders.length} ${orders.length === 1 ? 'demo order' : 'demo orders'}</span><span class="adm-sep" aria-hidden="true">/</span>`
        + `<span>${money(m.revenue, { cents: true })} demo revenue</span>${m.cancelled ? `<span class="adm-sep" aria-hidden="true">/</span><span>${m.cancelled} cancelled</span>` : ''}`
      : '';
    if (!orders.length) {
      host.innerHTML = V.ordersEmptyHTML();
      $('.adm-empty-title', host)?.setAttribute('tabindex', '-1');
      return;
    }
    host.innerHTML = V.ordersTableHTML(orders, { open });
    const w = $('.table-wrap', host);
    if (w && scrollLeft) w.scrollLeft = scrollLeft;
    enhance(host);
    if (memo) $(memo, host)?.focus({ preventScroll: true });
    if (first) {
      first = false;
      const deep = params.get('order');
      const btn = deep && $(`[data-toggle-order="${CSS.escape(deep)}"]`, host);
      if (btn) { btn.focus({ preventScroll: true }); btn.scrollIntoView({ block: 'center' }); }
    }
  }

  function toggle(btn) {
    const id = btn.dataset.toggleOrder;
    const row = btn.closest('tr');
    const detail = document.getElementById(btn.getAttribute('aria-controls'));
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    row.classList.toggle('is-open', !isOpen);
    if (detail) {
      detail.hidden = isOpen;
      if (!isOpen) enhance(detail);
    }
    if (isOpen) open.delete(id); else open.add(id);
  }

  async function clearAll(btn) {
    const n = listOrders().length;
    const yes = await ask({
      title: 'Clear the demo orders?',
      text: `This deletes ${n === 1 ? 'the demo order' : `all ${n} demo orders`} saved in this browser. Stock already taken by those orders stays as it is.`,
      confirmLabel: 'Clear demo orders',
      opener: btn,
    });
    if (!yes) return;
    open.clear();
    clearOrders();
    $('.adm-empty-title', host)?.focus();
    announce('Demo orders cleared.');
  }

  mount.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-toggle-order]')) toggle(t);
    else if (t.matches('[data-clear-orders]')) clearAll(t);
  });
  mount.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    const id = sel.dataset.status;
    updateOrder(id, { status: sel.value }); // emits mono:orders, which re-renders
    $(`[data-status="${CSS.escape(id)}"]`, host)?.focus({ preventScroll: true });
    flash($(`[data-order="${CSS.escape(id)}"]`, host));
    announce(`Order ${id} marked as ${V.statusName(sel.value).toLowerCase()}.`);
  });

  return { render };
}
