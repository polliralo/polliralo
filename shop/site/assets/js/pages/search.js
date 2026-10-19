// /search/ : results while you type (debounced), the address kept in step
// with history.replaceState (?q=), a polite count, and category suggestions
// when there is nothing to show. Uses the store, so admin edits are searched.

import { onStore, getProducts } from '../lib/store.js';
import { searchProducts } from '../lib/search.js';
import { $, enhance, withTransition } from '../lib/ui.js';
import * as cv from '../lib/catalog-view.js';

const root = $('[data-search-page]');
if (root) init(root);

function init(root) {
  const form = $('[data-search-form]', root);
  const input = $('[data-search-input]', root);
  const clearBtn = $('[data-search-clear]', root);
  const status = $('[data-search-status]', root);
  const results = $('[data-srch-results]', root);
  const gridEl = $('[data-grid]', root);
  const empty = $('[data-search-empty]', root);
  const emptyTitle = $('[data-empty-title]', root);
  const emptyText = $('[data-empty-text]', root);
  const eyebrow = $('[data-search-eyebrow]', root);
  const grid = cv.createGrid(gridEl, { transition: withTransition });
  const defaults = { title: emptyTitle.textContent, text: emptyText.textContent };

  let ready = false;
  let timer = 0;
  let lastQuery = null;

  const initial = new URLSearchParams(location.search).get('q') ?? '';
  if (initial && !input.value) input.value = initial;
  clearBtn.hidden = !input.value;

  function updateUrl(q) {
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q); else params.delete('q');
    const s = params.toString();
    const url = location.pathname + (s ? `?${s}` : '') + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
  }

  function run({ animate = true } = {}) {
    if (!ready) return;
    const q = input.value.trim();
    clearBtn.hidden = !input.value;
    updateUrl(q);
    if (q === lastQuery) return;
    lastQuery = q;
    const hits = q ? searchProducts(q) : [];
    grid.render(hits, {
      animate: animate && Boolean(q),
      update: () => {
        results.hidden = hits.length === 0;
        empty.hidden = hits.length > 0;
        if (!q) {
          status.textContent = '';
          emptyTitle.textContent = defaults.title;
          emptyText.textContent = defaults.text;
        } else if (hits.length) {
          status.textContent = `${cv.resultsLabel(hits.length)} for “${q}”`;
        } else {
          status.textContent = `No results for “${q}”`;
          emptyTitle.textContent = `Nothing matches “${q}”`;
          emptyText.textContent = 'Check the spelling, try a broader word such as shirt or watch, or start from a category.';
        }
      },
    }).then(() => enhance(gridEl));
  }

  input.addEventListener('input', () => {
    clearBtn.hidden = !input.value;
    clearTimeout(timer);
    timer = setTimeout(run, 180);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    run();
    // On touch screens, put the keyboard away so the results can be seen.
    if (window.matchMedia('(pointer: coarse)').matches) input.blur();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearTimeout(timer);
    run();
    input.focus();
  });

  onStore(() => {
    ready = true;
    const visible = getProducts();
    if (eyebrow) eyebrow.textContent = eyebrow.textContent.replace(/^\d+/, String(visible.length));
    lastQuery = null; // the catalogue changed: search again
    run({ animate: false });
    root.dataset.ready = 'true';
  });

  // Typing "/" anywhere focuses the search box (not while typing elsewhere).
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.target.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    input.focus();
  });

  // Ready to type on desktop; phones keep the keyboard closed until tapped.
  if (!input.value && window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
}
