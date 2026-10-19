// Shop all and the category pages: filters, sort, active chips, the phone
// drawer and the grid. Works over the store's products (lib/store.js), so
// admin edits, hidden products and custom products all show up. State lives
// in the address (history.replaceState) and is restored on load.

import { onStore, getProducts, getCategories, isEdited, seedProduct } from '../lib/store.js';
import { $, $$, openDialog, closeDialog, enhance, reducedMotion, withTransition } from '../lib/ui.js';
import * as cv from '../lib/catalog-view.js';

const root = $('[data-coll]');
if (root) init(root);

function init(root) {
  const category = root.dataset.category || null;
  const withCategory = !category;
  const results = $('[data-results]', root);
  const tools = $('[data-tools]', root);
  const gridEl = $('[data-grid]', root);
  const emptyEl = $('[data-empty]', root);
  const tile = $('[data-tile]', root);
  const activeEl = $('[data-active]', root);
  const showing = $('[data-showing]', root);
  const drawer = $('#coll-drawer', root);
  const badge = $('[data-filter-badge]', root);
  const showBtn = $('[data-show-results]', root);
  const drawerStatus = $('[data-drawer-status]', root);
  const sortLabel = $('[data-sort-label]', root);

  let products = [];
  let facets = null;
  let counts = null;
  let grid = null;
  let ready = false;
  // Until the catalogue loads, changes are kept here and checked on load.
  let state = cv.parseQuery(location.search);

  /* ----- State changes ----- */

  function mutate(facet, value, on) {
    if (facet === 'sort') state.sort = value;
    else if (facet === 'stock') state.stock = on;
    else {
      const set = new Set(state[facet]);
      if (on) set.add(value); else set.delete(value);
      state[facet] = ready ? facets[facet].options.map((o) => o.id).filter((id) => set.has(id)) : [...set];
    }
  }

  root.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-facet]');
    if (!input) return;
    const facet = input.dataset.facet;
    mutate(facet, input.value, input.checked);
    if (facet === 'sort') {
      const dd = input.closest('[data-dd]');
      if (dd) closeDropdown(dd, { focus: true });
    }
    if (ready) commit();
  });

  /* ----- Render ----- */

  function commit({ animate = true } = {}) {
    counts = cv.facetCounts(products, state, facets);
    const list = cv.apply(products, state, facets);
    updateUrl();
    return grid.render(list, {
      animate,
      update: () => {
        syncControls();
        renderChips();
        const n = list.length;
        gridEl.hidden = n === 0;
        emptyEl.hidden = n > 0;
        setTile(n);
        showing.textContent = cv.showingText(n, products.length);
        showBtn.textContent = `Show ${cv.resultsLabel(n)}`;
        drawerStatus.textContent = drawer?.open ? `${cv.resultsLabel(n)} match` : '';
      },
    }).then(() => enhance(gridEl));
  }

  /** The editorial tile spans the empty slots of the last row (CSS reads these). */
  function setTile(n) {
    if (!tile) return;
    tile.dataset.mod3 = String(n % 3);
    tile.dataset.mod2 = String(n % 2);
  }

  function syncControls() {
    $$('input[data-facet]', root).forEach((input) => {
      input.checked = cv.isSelected(state, input.dataset.facet, input.value);
    });
    $$('[data-opt]', root).forEach((label) => {
      const [facet, id] = label.dataset.opt.split(':');
      if (facet === 'sort') return;
      const c = counts[facet]?.[id] ?? 0;
      const on = cv.isSelected(state, facet, id);
      const input = $('input', label);
      const off = c === 0 && !on;
      if (input.disabled !== off) input.disabled = off;
      label.classList.toggle('is-zero', off);
      const num = $('[data-n]', label);
      if (num) num.textContent = String(c);
    });
    $$('[data-dd-n]', root).forEach((el) => {
      const k = state[el.dataset.ddN]?.length ?? 0;
      el.innerHTML = k ? `${k}<span class="visually-hidden"> selected</span>` : '';
    });
    const active = cv.activeCount(state);
    badge.hidden = active === 0;
    badge.innerHTML = `${active}<span class="visually-hidden"> active</span>`;
    if (sortLabel) sortLabel.textContent = cv.SORTS.find((s) => s.id === state.sort)?.label ?? 'Featured';
  }

  function renderChips() {
    const chips = cv.activeChips(state, facets);
    activeEl.hidden = chips.length === 0;
    activeEl.innerHTML = cv.chipsHTML(chips);
  }

  function updateUrl() {
    const keep = [...new URLSearchParams(location.search)].filter(([k]) => !cv.QUERY_KEYS.includes(k.toLowerCase()));
    const params = new URLSearchParams(keep);
    new URLSearchParams(cv.toQuery(state)).forEach((v, k) => params.append(k, v));
    const q = params.toString();
    const url = location.pathname + (q ? `?${q}` : '') + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
  }

  /** Option lists and which filters show, rebuilt when the catalogue changes. */
  function refreshOptions() {
    counts = cv.facetCounts(products, state, facets);
    $$('[data-options]', root).forEach((box) => {
      const facet = box.dataset.options;
      const prefix = box.closest('dialog') ? 'drawer' : 'bar';
      box.innerHTML = cv.optionsHTML(facet, facets, state, counts, prefix);
    });
    $$('[data-dd]', root).forEach((dd) => { dd.hidden = !cv.facetVisible(dd.dataset.dd, facets, state); });
    $$('[data-group]', root).forEach((g) => { g.hidden = !cv.facetVisible(g.dataset.group, facets, state); });
  }

  /** Counts in the heading and the category links follow the store. */
  function refreshHead() {
    const total = $('[data-total]', root);
    if (total) total.textContent = cv.stylesLabel(products.length);
    const visible = getProducts();
    $$('[data-cat-count]', root).forEach((el) => {
      const slug = el.dataset.catCount;
      const k = slug === 'all' ? visible.length : visible.filter((p) => p.category === slug).length;
      el.innerHTML = `<span class="visually-hidden">, </span>${k}<span class="visually-hidden"> ${k === 1 ? 'style' : 'styles'}</span>`;
    });
  }

  onStore(() => {
    const first = !ready;
    products = getProducts(category ? { category } : {});
    facets = cv.buildFacets(products, { categories: getCategories(), withCategory });
    state = cv.normalizeState(state, facets);
    if (first) grid = cv.createGrid(gridEl, { seed: seedProduct, glue: [tools], transition: withTransition });
    ready = true;
    if (!first || isEdited()) {
      refreshOptions();
      refreshHead();
    }
    const plain = cv.activeCount(state) === 0 && state.sort === 'featured';
    if (first && plain && !isEdited()) {
      // The pre-rendered grid is already right: leave it alone (no flash).
      counts = cv.facetCounts(products, state, facets);
      syncControls();
      updateUrl();
    } else {
      commit({ animate: false });
    }
    results.classList.remove('is-pending');
    root.dataset.ready = 'true';
  }).catch(() => results.classList.remove('is-pending'));

  /* ----- Chips, clear all, empty state ----- */

  function focusFallback() {
    const target = [$('[data-open-filters]', root), ...$$('[data-dd]:not([hidden]) .coll-dd-btn', root)]
      .find((el) => el && el.offsetParent !== null);
    target?.focus();
  }

  root.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-remove]');
    if (remove && ready) {
      const [facet, value] = remove.dataset.remove.split(':');
      const index = $$('[data-remove]', root).indexOf(remove);
      const inDrawer = Boolean(remove.closest('dialog'));
      mutate(facet, value, false);
      commit().then(() => {
        if (inDrawer) return;
        const chips = $$('[data-remove]', activeEl);
        if (chips.length) chips[Math.min(index, chips.length - 1)].focus();
        else focusFallback();
      });
      return;
    }
    const clear = e.target.closest('[data-clear]');
    if (clear && ready) {
      const keepSort = state.sort;
      state = cv.emptyState();
      state.sort = keepSort;
      const inDrawer = Boolean(clear.closest('dialog'));
      commit().then(() => { if (!inDrawer) focusFallback(); });
      return;
    }
    const ddBtn = e.target.closest('.coll-dd-btn');
    if (ddBtn) {
      const dd = ddBtn.closest('[data-dd]');
      if (ddBtn.getAttribute('aria-expanded') === 'true') closeDropdown(dd);
      else openDropdown(dd);
      return;
    }
    const opener = e.target.closest('[data-open-filters]');
    if (opener && drawer) {
      openDialog(drawer, { opener });
      return;
    }
    if (e.target.closest('[data-show-results]') && drawer) {
      drawer.addEventListener('close', () => {
        // If the grid starts above the filter bar, bring its top into view.
        const gridTop = gridEl.getBoundingClientRect().top;
        const barBottom = tools.getBoundingClientRect().bottom;
        if (gridTop < barBottom) results.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }, { once: true });
      closeDialog(drawer);
    }
  });

  /* ----- Dropdown panels (disclosure pattern) ----- */

  function openDropdown(dd) {
    $$('[data-dd]', root).forEach((other) => { if (other !== dd) closeDropdown(other); });
    const btn = $('.coll-dd-btn', dd);
    const panel = $('[data-dd-panel]', dd);
    panel.classList.remove('is-closing', 'is-flip');
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    // Keep the panel on screen near the right edge.
    if (panel.getBoundingClientRect().right > document.documentElement.clientWidth - 12) panel.classList.add('is-flip');
  }

  function closeDropdown(dd, { focus = false } = {}) {
    const btn = $('.coll-dd-btn', dd);
    const panel = $('[data-dd-panel]', dd);
    if (!panel || panel.hidden) return;
    btn.setAttribute('aria-expanded', 'false');
    if (focus) btn.focus();
    if (reducedMotion()) { panel.hidden = true; return; }
    panel.classList.add('is-closing');
    const done = () => {
      if (!panel.classList.contains('is-closing')) return;
      panel.classList.remove('is-closing');
      panel.hidden = true;
    };
    panel.addEventListener('animationend', done, { once: true });
    setTimeout(done, 260);
  }

  const openDropdowns = () => $$('[data-dd]', root).filter((dd) => $('.coll-dd-btn', dd).getAttribute('aria-expanded') === 'true');

  // Click outside closes.
  document.addEventListener('click', (e) => {
    openDropdowns().forEach((dd) => { if (!dd.contains(e.target)) closeDropdown(dd); });
  });
  // Esc closes and returns focus to the button.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = openDropdowns();
    if (!open.length) return;
    open.forEach((dd) => closeDropdown(dd, { focus: dd.contains(document.activeElement) }));
  });
  // Tabbing out of a panel closes it.
  $$('[data-dd]', root).forEach((dd) => {
    dd.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !dd.contains(e.relatedTarget)) closeDropdown(dd);
    });
  });
}
