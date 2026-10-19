// /cart/: renders the bag from localStorage once the catalogue has loaded,
// and keeps it in step with every change (this tab, other tabs, admin edits).
// Quantity buttons come from lib/cart-view.js. Remove is handled here so the
// removed row turns into an inline "Undo" that stays until you leave the page
// (checkout-ux.md section 7), instead of a toast that disappears.

import { loadStore, getProducts } from '../lib/store.js';
import * as cart from '../lib/cart.js';
import { renderLines, bindLineControls, summaryHTML } from '../lib/cart-view.js';
import { totals, SHIPPING_OPTIONS } from '../lib/pricing.js';
import { esc, money, productCard } from '../lib/render.js';
import { $, $$, announce, enhance, reducedMotion } from '../lib/ui.js';
import { arrivalText } from '../lib/checkout-view.js';

const page = $('[data-cart-page]');

if (page) {
  const list = $('[data-cart-lines]', page);
  const linesSection = $('.co-lines', page);
  const filled = $('[data-cart-filled]', page);
  const empty = $('[data-cart-empty]', page);
  const loading = $('[data-cart-loading]', page);
  const countEl = $('[data-cart-count]', page);
  const summary = $('[data-cart-summary]', page);
  const totalEl = $('[data-cart-total]', page);
  const etaEl = $('[data-cart-eta]', page);
  const live = $('[data-cart-live]', page);
  const blocked = $('[data-cart-blocked]', page);
  const checkoutBtn = $('[data-cart-checkout]', page);
  const issuesBox = $('[data-cart-issues]', page);
  const issuesText = $('[data-cart-issues-text]', page);
  const updateBtn = $('[data-update-qty]', page);
  const removeUnavailableBtn = $('[data-remove-unavailable]', page);
  const dialog = $('#co-clear-dialog');
  const clearDesc = $('[data-clear-desc]', page);
  const undoEmpty = $('[data-cart-undo-empty]', page);
  const newSection = $('[data-cart-new]', page);
  const newGrid = $('[data-cart-new-grid]', page);
  const bar = $('[data-cart-bar]', page);
  const barTotal = $('[data-cart-bar-total]', page);

  const keyOf = (slug, variant) => `${slug}|${variant}`;
  const order = [];          // first-seen order of lines, so an undone line returns to its place
  const removed = new Map(); // key -> { item, label }
  let lastSubtotal = null;
  let newRendered = false;
  let ready = false;

  const remember = (key) => { if (!order.includes(key)) order.push(key); };

  /** "Olive Piqué Polo, size M" (or just the name for one-size items). */
  function lineLabel(line) {
    const p = line?.product;
    if (!p) return 'Item';
    if ((p.variants?.length ?? 0) < 2 || !line.variantData) return p.name;
    return `${p.name}, ${(p.option?.label ?? 'size').toLowerCase()} ${line.variantData.label}`;
  }

  /* ----- Rendering ----- */

  function render({ focus } = {}) {
    // Keep keyboard focus on the same control when the list is redrawn.
    const restore = focus ?? focusMemo();
    const items = cart.getItems();
    items.forEach((i) => remember(keyOf(i.slug, i.variant)));
    const n = cart.count();

    page.dataset.state = items.length ? 'filled' : 'empty';
    loading.hidden = true;
    filled.hidden = items.length === 0;
    empty.hidden = items.length > 0;
    countEl.textContent = n ? `${n} ${n === 1 ? 'item' : 'items'}` : '';

    if (!items.length) {
      barAllowed = false;
      updateBar();
      renderEmpty();
      restoreFocus(restore);
      return;
    }

    const ls = renderLines(list, { compact: false });
    insertRemovedRows();
    sortRows();

    // Summary: subtotal, delivery, estimated total and delivery dates.
    const sub = cart.subtotal();
    const t = totals(sub, 'standard');
    summary.innerHTML = summaryHTML({ shippingId: 'standard', showShippingNote: true });
    totalEl.textContent = money(t.total, { cents: true });
    barTotal.textContent = money(t.total, { cents: true });
    const standard = SHIPPING_OPTIONS[0];
    const express = SHIPPING_OPTIONS[1];
    etaEl.innerHTML = `<span class="co-eta-row"><span>${esc(standard.name)}</span><span>${esc(arrivalText(standard))}</span></span>`
      + (express ? `<span class="co-eta-row"><span>${esc(express.name)}</span><span>${esc(arrivalText(express))}</span></span>` : '')
      + `<span class="co-eta-note">Demo estimates: nothing ships. Choose the method at checkout.</span>`;
    if (lastSubtotal != null && lastSubtotal !== sub) live.textContent = `Subtotal ${money(sub, { cents: true })}. Estimated total ${money(t.total, { cents: true })}.`;
    lastSubtotal = sub;

    // Issues: block checkout and offer the fixes.
    const limited = ls.filter((l) => l.issue === 'limited');
    const gone = ls.filter((l) => l.issue === 'missing' || l.issue === 'sold-out');
    const hasIssues = cart.hasIssues();
    issuesBox.hidden = !hasIssues;
    updateBtn.hidden = limited.length === 0;
    removeUnavailableBtn.hidden = gone.length === 0;
    if (hasIssues) {
      const parts = [];
      if (limited.length) parts.push(`${limited.length === 1 ? 'One item has' : `${limited.length} items have`} less stock than the quantity in your bag.`);
      if (gone.length) parts.push(`${gone.length === 1 ? 'One item is' : `${gone.length} items are`} no longer available.`);
      issuesText.textContent = parts.join(' ');
    }
    blocked.hidden = !hasIssues;
    if (hasIssues) {
      checkoutBtn.setAttribute('aria-disabled', 'true');
      checkoutBtn.setAttribute('aria-describedby', 'co-cart-blocked');
    } else {
      checkoutBtn.removeAttribute('aria-disabled');
      checkoutBtn.removeAttribute('aria-describedby');
    }
    barAllowed = !hasIssues;
    updateBar({ measure: true });
    clearDesc.textContent = `This removes ${n === 1 ? 'the 1 item' : `all ${n} items`} from your bag. You cannot undo it.`;
    restoreFocus(restore);
  }

  function insertRemovedRows() {
    for (const [key, { item, label }] of removed) {
      if (list.querySelector(`[data-line][data-key="${CSS.escape(key)}"]`)) continue;
      const li = document.createElement('li');
      li.className = 'co-removed';
      li.dataset.removedKey = key;
      li.innerHTML = `<p><span class="co-removed-name">${esc(label)}</span> removed.</p>`
        + `<button class="co-text-btn co-undo" type="button" data-undo="${esc(key)}">Undo</button>`;
      list.append(li);
    }
    $$('[data-line]', list).forEach((row) => { row.dataset.key = keyOf(row.dataset.slug, row.dataset.variant); });
  }

  function sortRows() {
    const rank = (el) => order.indexOf(el.dataset.key ?? el.dataset.removedKey);
    [...list.children].sort((a, b) => rank(a) - rank(b)).forEach((el) => list.append(el));
  }

  function renderEmpty() {
    // The last removed item can still be undone from the empty state.
    const last = [...removed.entries()].at(-1);
    undoEmpty.hidden = !last;
    undoEmpty.innerHTML = last
      ? `<p><span class="co-removed-name">${esc(last[1].label)}</span> removed.</p><button class="co-text-btn co-undo" type="button" data-undo="${esc(last[0])}">Undo</button>`
      : '';
    if (newRendered) return;
    const picks = getProducts().filter((p) => p.newArrival).slice(0, 4);
    const fill = picks.length >= 4 ? picks : [...picks, ...getProducts().filter((p) => !picks.includes(p))].slice(0, 4);
    newGrid.innerHTML = fill.map((p) => productCard(p, { headingLevel: 3, sizes: '(min-width: 1180px) 22vw, (min-width: 760px) 30vw, 46vw' })).join('');
    newSection.hidden = fill.length === 0;
    newRendered = true;
    enhance(newGrid);
  }

  /* ----- Phone: a checkout bar while the summary's button is still below the screen ----- */

  let barAllowed = false;
  let summaryBelow = false;
  let barObserver = null;
  const phone = window.matchMedia('(max-width: 760px)');
  function updateBar({ measure = false } = {}) {
    // After a redraw, measure directly: the observer only reports changes.
    if (measure && !filled.hidden) summaryBelow = checkoutBtn.getBoundingClientRect().top > window.innerHeight;
    const show = barAllowed && summaryBelow && phone.matches;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    // Keep focused controls clear of the bar (WCAG 2.4.11).
    document.documentElement.style.scrollPaddingBottom = show ? `${bar.offsetHeight + 16}px` : '';
  }
  function watchBar() {
    if (barObserver || !('IntersectionObserver' in window)) return;
    barObserver = new IntersectionObserver(([entry]) => {
      summaryBelow = !entry.isIntersecting && entry.boundingClientRect.top > 0;
      updateBar();
    });
    barObserver.observe(checkoutBtn);
    phone.addEventListener('change', () => updateBar({ measure: true }));
  }

  /* ----- Focus memory across re-renders ----- */

  function focusMemo() {
    const a = document.activeElement;
    if (!a || !page.contains(a)) return null;
    const row = a.closest('[data-line]');
    if (row) {
      const what = a.matches('[data-qty]') ? `[data-qty="${a.dataset.qty}"]` : a.matches('[data-remove]') ? '[data-remove]' : 'a';
      return { key: keyOf(row.dataset.slug, row.dataset.variant), what };
    }
    return null;
  }

  function restoreFocus(memo) {
    if (!memo) return;
    if (memo.el) { memo.el.focus({ preventScroll: memo.preventScroll ?? false }); return; }
    const row = list.querySelector(`[data-line][data-key="${CSS.escape(memo.key)}"]`);
    if (!row) return;
    const candidates = [memo.what, '[data-qty]:not([disabled])', '[data-remove]'];
    for (const sel of candidates) {
      const el = row.querySelector(`${sel}:not([disabled])`);
      if (el && el.offsetParent !== null) { el.focus({ preventScroll: true }); return; }
    }
  }

  /* ----- Remove with inline undo (capture phase, before cart-view's toast) ----- */

  linesSection.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn || !list.contains(btn)) return;
    e.stopPropagation();
    const row = btn.closest('[data-line]');
    const { slug, variant } = row.dataset;
    const key = keyOf(slug, variant);
    const item = cart.getItems().find((i) => i.slug === slug && i.variant === variant);
    if (!item) return;
    const line = cart.lines().find((l) => l.slug === slug && l.variant === variant);
    const label = lineLabel(line);
    removed.set(key, { item, label });
    cart.remove(slug, variant);
    announce(`${label} removed from your bag. Undo is available.`);
    const undo = page.querySelector(`[data-undo="${CSS.escape(key)}"]`);
    if (undo) undo.focus({ preventScroll: true });
  }, true);

  page.addEventListener('click', (e) => {
    const undo = e.target.closest('[data-undo]');
    if (!undo) return;
    const key = undo.dataset.undo;
    const entry = removed.get(key);
    if (!entry) return;
    removed.delete(key);
    cart.restore(entry.item);
    announce(`${entry.label} is back in your bag.`);
    const row = list.querySelector(`[data-line][data-key="${CSS.escape(key)}"]`);
    const link = row?.querySelector('.line-name a') ?? row?.querySelector('[data-remove]');
    link?.focus({ preventScroll: true });
  });

  /* ----- Fix issues ----- */

  updateBtn.addEventListener('click', () => {
    const fixed = cart.lines().filter((l) => l.issue === 'limited');
    fixed.forEach((l) => cart.setQty(l.slug, l.variant, l.stock));
    announce(fixed.length === 1 ? 'Quantity lowered to the stock available.' : 'Quantities lowered to the stock available.');
    checkoutBtn.focus({ preventScroll: true });
  });

  removeUnavailableBtn.addEventListener('click', () => {
    const gone = cart.lines().filter((l) => l.issue === 'missing' || l.issue === 'sold-out');
    gone.forEach((l) => cart.remove(l.slug, l.variant));
    announce(gone.length === 1 ? 'Unavailable item removed.' : 'Unavailable items removed.');
    if (cart.getItems().length) checkoutBtn.focus({ preventScroll: true });
    else $('#co-empty-title')?.focus({ preventScroll: true });
  });

  checkoutBtn.addEventListener('click', (e) => {
    if (checkoutBtn.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      blocked.hidden = false;
      announce(blocked.textContent);
    }
  });

  /* ----- Clear bag with a confirmation dialog ----- */

  // Own open/close (same motion as lib/ui.js dialogs): the shared closeDialog
  // keeps a fallback timer that can shut a dialog reopened within 500ms.
  let closeTimer = 0;
  let opener = null;
  function openClear(from) {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    opener = from;
    dialog.showModal();
    document.documentElement.classList.add('is-locked');
  }
  function closeClear({ focus } = {}) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    const onEnd = (e) => { if (e.target === dialog) finish(); };
    function finish() {
      clearTimeout(closeTimer);
      dialog.removeEventListener('animationend', onEnd);
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('is-locked');
      const target = focus ?? opener;
      if (target && target.offsetParent !== null) target.focus({ preventScroll: true });
    }
    if (reducedMotion()) { finish(); return; }
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend', onEnd);
    closeTimer = setTimeout(finish, 400);
  }
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeClear(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeClear(); });
  $('[data-keep-items]', dialog).addEventListener('click', () => closeClear());
  $('[data-clear-bag]', page).addEventListener('click', (e) => openClear(e.currentTarget));
  $('[data-confirm-clear]', dialog).addEventListener('click', () => {
    removed.clear();
    cart.clear();
    closeClear({ focus: $('#co-empty-title') });
    announce('Your bag is now empty.');
  });

  /* ----- Start ----- */

  loadStore().then(() => {
    ready = true;
    bindLineControls(list);
    render({ focus: null });
    watchBar();
    window.addEventListener('mono:cart', () => { if (ready) render(); });
    window.addEventListener('mono:catalog', () => {
      if (!ready) return;
      newRendered = false;
      render();
    });
  }).catch(() => {
    loading.innerHTML = '<p class="notice is-error">We could not load the shop data. Check your connection and reload the page.</p>';
  });
}
