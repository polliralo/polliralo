// Content pages: about (demo reset), contact (form checks), 404 (product
// picks kept in line with admin edits). Each part runs only when its markup
// is on the page.

import { loadStore, onStore, storage, isEdited, getProduct, getProducts, resetCatalog } from '../lib/store.js';
import { productCard, esc } from '../lib/render.js';
import { $, $$, announce, enhance, reducedMotion } from '../lib/ui.js';

const KEYS = { cart: 'mono.cart.v1', catalog: 'mono.catalog.v1', orders: 'mono.orders.v1' };

/* ----- A small modal with open/close motion. ui.js openDialog/closeDialog
   leave a 500 ms fallback timer running after close, which shuts the dialog
   again if it is reopened quickly (shared fix requested), so the reset
   confirmation runs its own. ----- */

function modal(dialog) {
  const html = document.documentElement;
  let timer = 0;
  let opener = null;
  const finish = () => {
    clearTimeout(timer);
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
  };
  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reducedMotion()) { finish(); return; }
    dialog.classList.add('is-closing');
    timer = setTimeout(finish, 400);
  };
  dialog.addEventListener('animationend', (e) => {
    if (e.target === dialog && dialog.classList.contains('is-closing')) finish();
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('close', () => {
    html.classList.remove('is-locked');
    opener?.focus({ preventScroll: true });
  });
  return {
    open(from) {
      clearTimeout(timer);
      dialog.classList.remove('is-closing');
      opener = from ?? document.activeElement;
      if (!dialog.open) dialog.showModal();
      html.classList.add('is-locked');
    },
    close,
  };
}

/* ----- About: "In this browser now" and the reset ----- */

function setupReset() {
  const panel = $('[data-demo-reset]');
  if (!panel) return;
  const dialog = $('#ct-reset-dialog');
  const opener = $('[data-reset-open]', panel);
  const confirm = $('[data-reset-confirm]', dialog);
  const done = $('[data-reset-done]', panel);
  const confirmBox = modal(dialog);
  panel.hidden = false;

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function renderState() {
    const items = storage.get(KEYS.cart, []);
    const qty = Array.isArray(items) ? items.reduce((n, i) => n + (Number(i?.qty) || 0), 0) : 0;
    const orders = storage.get(KEYS.orders, []);
    const ordersN = Array.isArray(orders) ? orders.length : 0;
    const edited = storage.get(KEYS.catalog) != null;
    $('[data-state="cart"]', panel).textContent = qty ? plural(qty, 'item', 'items') : 'No items';
    $('[data-state="orders"]', panel).textContent = ordersN ? plural(ordersN, 'order', 'orders') : 'None';
    $('[data-state="catalog"]', panel).textContent = edited ? 'Edited in this browser' : 'As shipped';
  }
  renderState();
  ['mono:cart', 'mono:orders', 'mono:catalog', 'storage'].forEach((name) => window.addEventListener(name, renderState));

  opener.addEventListener('click', () => {
    done.hidden = true;
    confirmBox.open(opener);
  });

  $('[data-reset-cancel]', dialog).addEventListener('click', () => confirmBox.close());

  confirm.addEventListener('click', async () => {
    Object.values(KEYS).forEach((key) => storage.remove(key));
    // Tell the open page (bag count, drawer, anything listening) that the
    // data changed. The store reloads its catalogue from the seed.
    window.dispatchEvent(new CustomEvent('mono:cart', { detail: { items: [] } }));
    window.dispatchEvent(new CustomEvent('mono:orders', { detail: { orders: [] } }));
    try {
      await loadStore();
      resetCatalog();
    } catch { /* the store could not load; the keys are gone either way */ }
    confirmBox.close();
    renderState();
    const message = 'Done. The bag, demo orders and admin edits in this browser have been cleared.';
    done.textContent = message;
    done.hidden = false;
    announce(message);
  });
}

/* ----- Contact: required fields, inline errors, error summary ----- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setupContact() {
  const form = $('form[data-contact-form]');
  if (!form) return;
  const summary = $('[data-error-summary]', form);
  const list = $('[data-error-list]', summary);
  const title = $('[data-error-title]', summary);
  const message = $('[data-form-message]', form);
  const textarea = $('#ct-message', form);
  const counter = $('[data-char-count]', form);
  const fields = $$('[data-field]', form).map((wrap) => ({
    wrap,
    input: $('input, select, textarea', wrap),
    error: $('.field-error', wrap),
  }));
  let tried = false;

  function problem(input) {
    const value = input.value.trim();
    const what = input.dataset.label;
    if (!value) return input.tagName === 'SELECT' ? `Choose ${what}.` : `Enter ${what}.`;
    if (input.type === 'email' && !EMAIL.test(value)) return 'Enter an email address like name@example.com.';
    const min = Number(input.getAttribute('minlength')) || 0;
    if (min && value.length < min) return `Write at least ${min} characters (${value.length} so far).`;
    return '';
  }

  function show(field, text) {
    const { wrap, input, error } = field;
    const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== error.id);
    wrap.classList.toggle('is-invalid', Boolean(text));
    error.hidden = !text;
    error.textContent = text;
    if (text) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', [error.id, ...ids].join(' '));
    } else {
      input.removeAttribute('aria-invalid');
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
      else input.removeAttribute('aria-describedby');
    }
  }

  const check = (field) => {
    const text = problem(field.input);
    show(field, text);
    return text;
  };

  function renderSummary(errors) {
    if (!errors.length) {
      summary.hidden = true;
      list.innerHTML = '';
      return;
    }
    title.textContent = errors.length === 1 ? 'Check one field' : `Check ${errors.length} fields`;
    list.innerHTML = errors.map(({ field, text }) => `<li><a href="#${esc(field.input.id)}">${esc(text)}</a></li>`).join('');
    summary.hidden = false;
  }

  // Summary links move focus to the field (not just scroll to it).
  summary.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const input = form.querySelector(link.getAttribute('href'));
    input?.focus();
    input?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  });

  // Check a field when the visitor leaves it, once they have typed something
  // (or after a first submit); fix errors live as they type.
  fields.forEach((field) => {
    field.input.addEventListener('blur', () => {
      if (tried || field.input.value.trim()) check(field);
    });
    const live = () => {
      if (field.wrap.classList.contains('is-invalid')) check(field);
      if (tried && !summary.hidden) {
        renderSummary(fields.map((f) => ({ field: f, text: problem(f.input) })).filter((x) => x.text));
      }
    };
    field.input.addEventListener('input', live);
    field.input.addEventListener('change', live);
  });

  const max = Number(textarea?.getAttribute('maxlength')) || 1000;
  const count = () => { if (counter) counter.textContent = `${textarea.value.length} / ${max}`; };
  textarea?.addEventListener('input', count);
  form.addEventListener('reset', () => setTimeout(count, 0));

  // Runs before app.js's document-level handler (which shows the demo
  // confirmation). Invalid: stop it there. Valid: let it through.
  form.addEventListener('submit', (e) => {
    tried = true;
    message.textContent = '';
    message.classList.remove('is-shown');
    const errors = fields.map((f) => ({ field: f, text: check(f) })).filter((x) => x.text);
    renderSummary(errors);
    if (errors.length) {
      e.preventDefault();
      e.stopPropagation();
      summary.focus();
      return;
    }
    tried = false;
    // app.js fills [data-form-message] and resets the form in this same event.
    requestAnimationFrame(() => {
      message.classList.add('is-shown');
      fields.forEach((f) => show(f, ''));
      message.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  });
}

/* ----- 404: three product picks, kept in line with admin edits ----- */

function setupPicks() {
  const grid = $('[data-nf-products]');
  if (!grid) return;
  const preferred = (grid.dataset.picks ?? '').split(',').filter(Boolean);
  onStore(() => {
    if (!isEdited()) return;
    const visible = getProducts();
    const picks = preferred.map((slug) => getProduct(slug)).filter((p) => p && !p.hidden);
    for (const p of visible) if (picks.length < 3 && !picks.includes(p)) picks.push(p);
    grid.innerHTML = picks.slice(0, 3).map((p) => productCard(p, { sizes: '(min-width: 760px) 30vw, 68vw', headingLevel: 3 })).join('');
    enhance(grid);
  }).catch(() => { /* keep the pre-rendered cards */ });
}

/* ----- Long pages: mark the section in view in the "On this page" index ----- */

function setupIndex() {
  const links = $$('.ct-index a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const visible = new Set();
  const mark = () => {
    const current = sections.find((s) => visible.has(s)) ?? null;
    links.forEach((a) => a.removeAttribute('aria-current'));
    if (current) byId.get(current.id)?.setAttribute('aria-current', 'location');
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    mark();
  }, { rootMargin: '-20% 0px -55% 0px' });
  sections.forEach((s) => io.observe(s));
}

/* ----- Curtain reveals: Chromium's IntersectionObserver counts the target's
   own clip-path, so an element hidden by clip-path: inset(100% 0 0 0) never
   reports as visible. Watch its parent instead (shared fix requested). ----- */

function setupClipReveals() {
  const items = $$('[data-reveal="clip"]:not(.is-in)');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || !document.documentElement.classList.contains('motion')) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target._clipChild?.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) { el.classList.add('is-in'); return; }
    parent._clipChild = el;
    io.observe(parent);
  });
}

setupClipReveals();
setupReset();
setupContact();
setupPicks();
setupIndex();
