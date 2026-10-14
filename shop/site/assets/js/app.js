// Runs on every page: header, menu, search, bag drawer, quick add, demo
// forms, image fades, scroll reveals and the card-to-product image morph.
// Page-specific code lives in assets/js/pages/ and imports the same modules.

import { loadStore, getProduct, getCategories } from './lib/store.js';
import * as cart from './lib/cart.js';
import { esc, money, picture, productUrl, needsChoice, icon } from './lib/render.js';
import { $, $$, openDialog, closeDialog, enhance, announce } from './lib/ui.js';
import { renderLines, bindLineControls, summaryHTML } from './lib/cart-view.js';
import { addToBag } from './lib/actions.js';
import { searchProducts } from './lib/search.js';

const html = document.documentElement;
html.classList.add('js');

/* ----- Header: border once the page scrolls ----- */
const header = $('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ----- Image fades and reveals for the server-rendered page ----- */
enhance(document);

/* ----- Dialog openers ----- */
const menu = $('#menu-drawer');
const search = $('#search-dialog');
const drawer = $('#cart-drawer');

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open-menu], [data-open-search], [data-open-cart], [data-close-dialog]');
  if (!t) return;
  if (t.matches('[data-close-dialog]')) { closeDialog(t.closest('dialog')); return; }
  e.preventDefault();
  if (t.matches('[data-open-menu]')) openDialog(menu, { opener: t });
  if (t.matches('[data-open-search]')) { openDialog(search, { opener: t }); $('input', search)?.focus(); }
  if (t.matches('[data-open-cart]')) openCart(t);
});
document.addEventListener('mono:open-cart', (e) => openCart(null, e.detail?.highlight));

// Links inside the menu close it before navigating (keeps the view transition clean).
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) menu.close(); });

/* ----- Store-dependent features ----- */
loadStore().then(() => {
  html.classList.add('store-ready');
  updateBagCounts();
  setupSearch();
  window.addEventListener('mono:cart', () => { updateBagCounts(); if (drawer?.open) renderDrawer(); });
  window.addEventListener('mono:catalog', () => { if (drawer?.open) renderDrawer(); });
}).catch((err) => {
  console.error(err);
});

function updateBagCounts() {
  const n = cart.count();
  $$('[data-bag-count]').forEach((el) => {
    el.textContent = String(n);
    el.dataset.count = String(n);
  });
  $$('[data-open-cart]').forEach((el) => el.setAttribute('aria-label', `Bag, ${n} ${n === 1 ? 'item' : 'items'}`));
}

/* ----- Bag drawer ----- */
function openCart(opener, highlight = null) {
  if (!drawer) { window.location.href = '/cart/'; return; }
  loadStore().then(() => {
    renderDrawer(highlight);
    if (!drawer.open) openDialog(drawer, { opener });
  });
}

function renderDrawer(highlight = null) {
  const list = $('[data-drawer-lines]', drawer);
  const foot = $('[data-drawer-foot]', drawer);
  const empty = $('[data-drawer-empty]', drawer);
  const ls = renderLines(list, { compact: true });
  bindLineControls(list);
  if (highlight) {
    const row = list.querySelector(`[data-slug="${CSS.escape(highlight.slug)}"][data-variant="${CSS.escape(highlight.variant)}"]`);
    if (row) { row.classList.add('is-new'); row.scrollIntoView({ block: 'nearest' }); }
  }
  const count = cart.count();
  $('[data-drawer-count]', drawer).textContent = count ? `(${count})` : '';
  empty.hidden = ls.length > 0;
  list.hidden = ls.length === 0;
  foot.hidden = ls.length === 0;
  $('[data-drawer-summary]', drawer).innerHTML = summaryHTML();
  const checkout = $('[data-drawer-checkout]', drawer);
  const blocked = cart.hasIssues();
  checkout.setAttribute('aria-disabled', blocked ? 'true' : 'false');
  $('[data-drawer-blocked]', drawer).hidden = !blocked;
}
drawer?.addEventListener('click', (e) => {
  const c = e.target.closest('[data-drawer-checkout]');
  if (c && c.getAttribute('aria-disabled') === 'true') e.preventDefault();
});

/* ----- Quick add on product cards ----- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-quick-add]');
  const chip = e.target.closest('[data-quick-size]');
  if (chip) {
    const card = chip.closest('.card');
    const slug = card?.dataset.slug;
    closeQuick(card);
    addToBag(slug, chip.dataset.quickSize);
    return;
  }
  if (!btn) {
    if (!e.target.closest('.card-quick')) $$('.card-add[aria-expanded="true"]').forEach((b) => closeQuick(b.closest('.card')));
    return;
  }
  e.preventDefault();
  loadStore().then(() => {
    const card = btn.closest('.card');
    const product = getProduct(btn.dataset.quickAdd);
    if (!product) return;
    if (!needsChoice(product)) {
      addToBag(product.slug, product.variants[0].id);
      return;
    }
    const panel = $('[data-quick-panel]', card);
    if (btn.getAttribute('aria-expanded') === 'true') { closeQuick(card); return; }
    $$('.card-add[aria-expanded="true"]').forEach((b) => closeQuick(b.closest('.card')));
    panel.innerHTML = `<p id="qa-${esc(product.slug)}">Choose ${esc((product.option?.label ?? 'size').toLowerCase())}</p>`
      + `<div class="chips" role="group" aria-labelledby="qa-${esc(product.slug)}">`
      + product.variants.map((v) => (Number(v.stock) > 0
        ? `<button type="button" class="chip" data-quick-size="${esc(v.id)}">${esc(v.label)}</button>`
        : `<span class="chip is-out" aria-disabled="true" title="Sold out">${esc(v.label)}<span class="visually-hidden"> sold out</span></span>`)).join('')
      + `</div>`;
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', `Close size choice for ${product.name}`);
    $('[data-quick-size]', panel)?.focus();
  });
});
function closeQuick(card) {
  if (!card) return;
  const btn = $('.card-add', card);
  const panel = $('[data-quick-panel]', card);
  if (panel) { panel.hidden = true; panel.innerHTML = ''; }
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    const name = $('.card-name', card)?.textContent?.trim() ?? '';
    btn.setAttribute('aria-label', `Quick add ${name}`);
  }
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = $('.card-add[aria-expanded="true"]');
  if (open) { closeQuick(open.closest('.card')); open.focus(); }
});

/* ----- Search dialog: instant results ----- */
function setupSearch() {
  if (!search) return;
  const input = $('input[name="q"]', search);
  const out = $('[data-search-results]', search);
  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = suggestions(); return; }
    const hits = searchProducts(q);
    out.innerHTML = hits.length
      ? `<p class="label muted" style="margin-bottom:16px">${hits.length} ${hits.length === 1 ? 'result' : 'results'}</p><div class="grid-mini">${hits.slice(0, 8).map(miniCard).join('')}</div>`
        + (hits.length > 8 ? `<p style="margin-top:20px"><a class="link" href="/search/?q=${encodeURIComponent(q)}">See all results</a></p>` : '')
      : `<p class="muted">Nothing matches "${esc(input.value.trim())}". Try a category like shirts or watches.</p>${suggestions()}`;
    enhance(out);
  };
  input.addEventListener('input', render);
  out.innerHTML = suggestions();
  enhance(out);
}

function suggestions() {
  return `<p class="label muted">Popular</p><div class="search-suggest">`
    + getCategories().map((c) => `<a class="chip" href="/collections/${c.slug}/">${esc(c.name)}</a>`).join('')
    + `</div>`;
}

function miniCard(p) {
  const img = p.images?.[0];
  return `<a class="mini-card" href="${productUrl(p)}"><span class="frame">${img ? picture(img.key, { alt: '', sizes: '160px' }) : ''}</span>`
    + `<span>${esc(p.name)}</span><span class="muted">${money(p.price)}</span></a>`;
}

/* ----- Demo forms (newsletter and the like): never sent anywhere ----- */
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-demo-form]');
  if (!form) return;
  e.preventDefault();
  const email = form.querySelector('input[type="email"]');
  const msg = form.querySelector('[data-form-message]');
  if (email && !email.checkValidity()) {
    msg.textContent = 'Enter an email address like name@example.com.';
    msg.classList.add('is-error');
    email.setAttribute('aria-invalid', 'true');
    email.focus();
    return;
  }
  email?.removeAttribute('aria-invalid');
  msg.classList.remove('is-error');
  msg.textContent = form.dataset.demoForm || 'Thanks. This is a demo, so nothing was sent or saved.';
  form.reset();
  announce(msg.textContent);
});

export { icon };
