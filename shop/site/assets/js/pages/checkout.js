// /checkout/: one-page guest checkout for the demo (checkout-ux.md).
// - Fills the order summary from the bag (re-rendered on mono:cart and
//   mono:catalog) and prices each delivery option with shippingCost().
// - Validates on submit with a GOV.UK-style error summary that takes focus,
//   inline errors linked with aria-describedby and aria-invalid; a field is
//   first checked when you leave it, then on every input once it has an error.
// - Keeps a draft in sessionStorage so Back or a reload never loses details.
// - Places the order: order record (BUILD-SPEC section 3), stock down, bag
//   cleared, draft cleared, then /order-confirmation/?order=<id>.

import { loadStore, adjustStock, addOrder, newOrderId } from '../lib/store.js';
import * as cart from '../lib/cart.js';
import { SHIPPING_OPTIONS, PAYMENT_OPTIONS, shippingOption, totals } from '../lib/pricing.js';
import { esc, money, productUrl } from '../lib/render.js';
import { $, $$, announce, enhance, reducedMotion } from '../lib/ui.js';
import { country, arrivalText, shippingPriceText, summaryLineHTML, optionText, totalsHTML } from '../lib/checkout-view.js';

const root = $('[data-checkout]');
const DRAFT_KEY = 'mono.checkout.draft.v1';
const ISSUE_NOTE = { missing: 'No longer available', 'sold-out': 'Sold out', limited: 'Less stock than this quantity' };

const draft = {
  get() { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') ?? {}; } catch { return {}; } },
  set(v) { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* storage blocked */ } },
  clear() { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage blocked */ } },
};

if (root) {
  const form = $('[data-co-form]', root);
  const layout = $('[data-co-ready]', root);
  const loading = $('[data-co-loading]', root);
  const emptyBox = $('[data-co-empty]', root);
  const blocked = $('[data-co-blocked]', root);
  const summaryBox = $('[data-error-summary]', root);
  const summaryList = $('[data-error-list]', root);
  const linesEl = $('[data-sum-lines]', root);
  const totalsEl = $('[data-sum-totals]', root);
  const barTotal = $('[data-sum-bar-total]', root);
  const placeTotals = $('[data-place-totals]', root);
  const toggle = $('[data-sum-toggle]', root);
  const toggleText = $('[data-sum-toggle-text]', root);
  const sumBody = $('[data-sum-body]', root);
  const submit = $('[data-submit]', root);
  const submitLabel = $('[data-submit-label]', root);
  const line2 = $('[data-line2]', root);
  const line2Toggle = $('[data-line2-toggle]', root);

  const baseTitle = document.title;
  const TEXT_FIELDS = ['email', 'phone', 'country', 'name', 'address1', 'address2', 'city', 'region', 'postcode'];
  const ORDER = ['email', 'phone', 'country', 'name', 'address1', 'address2', 'city', 'region', 'postcode', 'shipping', 'payment'];
  let attempted = false;
  let placing = false;
  const touched = new Set();

  /* ----- Values ----- */

  const input = (name) => form.elements.namedItem(name);
  function values() {
    const v = {};
    TEXT_FIELDS.forEach((n) => { v[n] = String(input(n)?.value ?? '').trim(); });
    v.shipping = $('input[name="shipping"]:checked', form)?.value ?? '';
    v.payment = $('input[name="payment"]:checked', form)?.value ?? '';
    return v;
  }

  /* ----- Rules: specific messages, never "invalid input" ----- */

  const lowerLabel = (label) => (/^[A-Z]{2}/.test(label) || label === 'Eircode' ? label : label.charAt(0).toLowerCase() + label.slice(1));
  const RULES = {
    email: (v) => (!v ? 'Enter your email address'
      : !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v) ? 'Enter an email address in the correct format, like name@example.com' : ''),
    phone: (v) => {
      if (!v) return '';
      const digits = v.replace(/\D/g, '');
      if (/[^\d\s()+.\-]/.test(v) || digits.length < 7 || digits.length > 15) return 'Enter a phone number with 7 to 15 digits, or leave it empty';
      return '';
    },
    country: (v) => (!v ? 'Select your country' : ''),
    name: (v) => (v.length < 2 ? 'Enter your full name' : ''),
    address1: (v) => (v.length < 3 ? 'Enter the first line of your address, like 12 Market Street' : ''),
    address2: () => '',
    city: (v) => (!v ? 'Enter your town or city' : ''),
    region: () => '',
    postcode: (v, all) => {
      const c = country(all.country);
      const label = lowerLabel(c.postcode.label);
      if (!v) return `Enter your ${label}`;
      if (!c.postcode.pattern.test(v)) return `Enter a ${label} in the correct format, like ${c.postcode.example}`;
      return '';
    },
    shipping: (v) => (SHIPPING_OPTIONS.some((o) => o.id === v) ? '' : 'Select a delivery method'),
    payment: (v) => (PAYMENT_OPTIONS.some((o) => o.id === v) ? '' : 'Select a payment method'),
  };
  const errorFor = (name, all = values()) => RULES[name]?.(all[name] ?? '', all) ?? '';

  /* ----- Showing errors ----- */

  const targetId = (name) => (name === 'shipping' || name === 'payment'
    ? ($(`input[name="${name}"]:checked`, form) ?? $(`input[name="${name}"]`, form))?.id
    : input(name)?.id);

  function setDescribedBy(el, id, on) {
    const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    if (on) ids.add(id); else ids.delete(id);
    if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
    else el.removeAttribute('aria-describedby');
  }

  function showError(name, message) {
    const errEl = $(`[data-error-for="${name}"]`, form);
    if (!errEl) return;
    const on = Boolean(message);
    errEl.hidden = !on;
    errEl.innerHTML = on ? `<span class="visually-hidden">Error:</span> ${esc(message)}` : '';
    if (name === 'shipping' || name === 'payment') {
      const set = errEl.closest('fieldset');
      set.classList.toggle('is-invalid', on);
      setDescribedBy(set, errEl.id, on);
      $$(`input[name="${name}"]`, form).forEach((r) => { if (on) r.setAttribute('aria-invalid', 'true'); else r.removeAttribute('aria-invalid'); });
      return;
    }
    const el = input(name);
    const wrap = errEl.closest('.field');
    wrap?.classList.toggle('is-invalid', on);
    if (on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    // Error first, then the hint (GOV.UK order).
    const hintId = `${el.id}-hint`;
    const hasHint = Boolean(document.getElementById(hintId));
    const ids = [on ? errEl.id : null, hasHint ? hintId : null].filter(Boolean);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  }

  function markValid(name, all = values()) {
    const wrap = input(name)?.closest('.co-has-tick');
    if (!wrap) return;
    wrap.classList.toggle('is-valid', Boolean(all[name]) && !errorFor(name, all));
  }

  function validateField(name) {
    const all = values();
    const msg = errorFor(name, all);
    showError(name, msg);
    markValid(name, all);
    if (attempted) refreshSummary(all);
    return msg;
  }

  function collectErrors(all = values()) {
    return ORDER.map((name) => ({ name, message: errorFor(name, all) })).filter((e) => e.message);
  }

  function refreshSummary(all = values()) {
    const errors = collectErrors(all);
    if (!errors.length) {
      summaryBox.hidden = true;
      summaryList.innerHTML = '';
      document.title = baseTitle;
      return errors;
    }
    summaryList.innerHTML = errors.map((e) => `<li><a href="#${esc(targetId(e.name))}" data-error-link="${e.name}">${esc(e.message)}</a></li>`).join('');
    summaryBox.hidden = false;
    document.title = `Error: ${baseTitle}`;
    return errors;
  }

  // Error summary links move focus to the field and bring its label into view.
  summaryBox.addEventListener('click', (e) => {
    const a = e.target.closest('[data-error-link]');
    if (!a) return;
    e.preventDefault();
    const name = a.dataset.errorLink;
    const id = targetId(name);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    const anchor = name === 'shipping' || name === 'payment' ? el.closest('fieldset') : el.closest('.field');
    el.focus({ preventScroll: true });
    (anchor ?? el).scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
  });

  /* ----- Country changes the address labels ----- */

  function applyCountry(code) {
    const c = country(code);
    const pc = input('postcode');
    const pcLabel = $('[data-label-for="postcode"]', form);
    const pcHint = document.getElementById(`${pc.id}-hint`);
    pcLabel.textContent = c.postcode.label;
    if (pcHint) pcHint.textContent = `For example ${c.postcode.example}`;
    if (c.postcode.numeric) pc.setAttribute('inputmode', 'numeric'); else pc.removeAttribute('inputmode');
    $('[data-label-for="region"]', form).textContent = `${c.region} (optional)`;
  }

  /* ----- Order summary and prices ----- */

  function renderSummary() {
    const ls = cart.lines();
    const v = values();
    const sub = cart.subtotal();
    const option = shippingOption(v.shipping || SHIPPING_OPTIONS[0].id);
    const t = totals(sub, option.id);

    linesEl.innerHTML = ls.map((l) => summaryLineHTML({
      name: l.product?.name ?? 'Unavailable item',
      optionText: optionText(l.product, l.variantData),
      qty: l.qty,
      lineTotal: l.lineTotal,
      imageKey: l.product?.images?.[0]?.key ?? null,
      url: l.product ? productUrl(l.product) : null,
      note: l.issue ? ISSUE_NOTE[l.issue] : '',
    })).join('');
    enhance(linesEl);
    totalsEl.innerHTML = totalsHTML({ ...t, shippingName: option.name });
    placeTotals.innerHTML = totalsHTML({ ...t, shippingName: option.name });
    barTotal.textContent = money(t.total, { cents: true });

    SHIPPING_OPTIONS.forEach((o) => {
      const price = $(`[data-ship-price="${o.id}"]`, form);
      if (price) price.textContent = shippingPriceText(o.id, sub);
      const arrive = $(`[data-arrive="${o.id}"]`, form);
      if (arrive) arrive.textContent = `Arrives ${arrivalText(o)} (estimate)`;
    });
    return t;
  }

  /* ----- Bag state: loading, empty, blocked, ready ----- */

  function render() {
    if (placing) return;
    const items = cart.getItems();
    loading.hidden = true;
    if (!items.length) {
      root.dataset.state = 'empty';
      layout.hidden = true;
      emptyBox.hidden = false;
      document.title = baseTitle;
      return;
    }
    root.dataset.state = 'ready';
    layout.hidden = false;
    emptyBox.hidden = true;
    renderSummary();
    const issues = cart.hasIssues();
    blocked.hidden = !issues;
    if (issues) submit.setAttribute('aria-disabled', 'true');
    else submit.removeAttribute('aria-disabled');
  }

  /* ----- Draft in sessionStorage ----- */

  let saveTimer;
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => draft.set(values()), 200);
  }

  function restoreDraft() {
    const d = draft.get();
    TEXT_FIELDS.forEach((n) => {
      const el = input(n);
      if (!el || d[n] == null || d[n] === '') return;
      if (el.tagName === 'SELECT' && !$(`option[value="${CSS.escape(d[n])}"]`, el)) return;
      el.value = d[n];
    });
    ['shipping', 'payment'].forEach((n) => {
      const r = d[n] && $(`input[name="${n}"][value="${CSS.escape(d[n])}"]`, form);
      if (r) r.checked = true;
    });
    if (d.address2) openLine2({ focus: false });
    applyCountry(input('country').value);
    if (d.email) markValid('email');
  }

  /* ----- Address line 2 behind a link (Baymard) ----- */

  function openLine2({ focus = true } = {}) {
    line2.classList.add('is-open');
    line2Toggle.setAttribute('aria-expanded', 'true');
    line2Toggle.closest('.co-line2-toggle-wrap').hidden = true;
    if (focus) input('address2').focus();
  }
  line2Toggle.addEventListener('click', () => openLine2());

  /* ----- Phone: collapsible summary ----- */

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    sumBody.classList.toggle('is-open', open);
    toggleText.textContent = open ? 'Hide order summary' : 'Show order summary';
  });

  /* ----- Field events ----- */

  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (!name) return;
    saveDraft();
    touched.add(name);
    const showing = !$(`[data-error-for="${name}"]`, form)?.hidden;
    if (attempted || showing) validateField(name);
    else if (name === 'email') markValid('email');
  });

  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!name || !TEXT_FIELDS.includes(name)) return;
    // First check on blur, and only once something was typed (no premature errors).
    if (attempted || (touched.has(name) && String(e.target.value).trim() !== '')) validateField(name);
  });

  form.addEventListener('change', (e) => {
    const name = e.target.name;
    if (!name) return;
    saveDraft();
    if (name === 'country') {
      applyCountry(e.target.value);
      const pc = input('postcode');
      if (attempted || (touched.has('postcode') && pc.value.trim())) validateField('postcode');
    }
    if (name === 'shipping') {
      const t = renderSummary();
      const option = shippingOption(e.target.value);
      announce(`${option.name} selected. Total ${money(t.total, { cents: true })}.`);
      if (attempted) validateField('shipping');
    }
    if (name === 'payment' && attempted) validateField('payment');
  });

  /* ----- Submit ----- */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (placing) return;
    if (!cart.getItems().length) { render(); $('#co-empty-title')?.focus(); return; }
    if (cart.hasIssues()) {
      blocked.hidden = false;
      blocked.focus();
      blocked.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    attempted = true;
    const all = values();
    ORDER.forEach((name) => showError(name, errorFor(name, all)));
    const errors = refreshSummary(all);
    if (errors.length) {
      summaryBox.focus({ preventScroll: true });
      summaryBox.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    placeOrder(all);
  });

  function placeOrder(v) {
    placing = true;
    submit.setAttribute('aria-disabled', 'true');
    submit.classList.add('is-busy');
    submitLabel.textContent = 'Placing order';
    root.setAttribute('aria-busy', 'true');
    announce('Placing your demo order.');

    const ls = cart.lines();
    const sub = cart.subtotal();
    const option = shippingOption(v.shipping);
    const t = totals(sub, option.id);
    const pay = PAYMENT_OPTIONS.find((p) => p.id === v.payment) ?? PAYMENT_OPTIONS[0];
    const c = country(v.country);
    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      status: 'received',
      items: ls.map((l) => ({
        slug: l.slug,
        variant: l.variant,
        name: l.product.name,
        variantLabel: l.variantData?.label ?? l.variant,
        optionLabel: l.product.option?.label ?? 'Option',
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        imageKey: l.product.images?.[0]?.key ?? null,
      })),
      subtotal: t.subtotal,
      shippingId: option.id,
      shippingName: option.name,
      shipping: t.shipping,
      total: t.total,
      paymentId: pay.id,
      paymentName: pay.name,
      contact: { email: v.email, phone: v.phone },
      delivery: {
        name: v.name,
        address1: v.address1,
        address2: v.address2,
        city: v.city,
        region: v.region,
        postcode: /[a-z]/i.test(v.postcode) ? v.postcode.toUpperCase() : v.postcode,
        country: c.name,
      },
      demo: true,
    };

    // A short busy state so the press registers; no fake processing wait.
    setTimeout(() => {
      ls.forEach((l) => adjustStock(l.slug, l.variant, -l.qty));
      addOrder(order);
      cart.clear();
      draft.clear();
      window.location.assign(`/order-confirmation/?order=${encodeURIComponent(order.id)}`);
    }, reducedMotion() ? 0 : 380);
  }

  submit.addEventListener('click', (e) => {
    if (submit.getAttribute('aria-disabled') === 'true' && placing) e.preventDefault();
  });

  /* ----- Start ----- */

  restoreDraft();
  loadStore().then(() => {
    render();
    window.addEventListener('mono:cart', render);
    window.addEventListener('mono:catalog', render);
  }).catch(() => {
    loading.hidden = false;
    loading.innerHTML = '<p class="notice is-error">We could not load the shop data. Check your connection and reload the page.</p>';
  });

  // Coming back with the Back button after an order: show the current bag.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    placing = false;
    submit.classList.remove('is-busy');
    submitLabel.textContent = 'Place demo order';
    root.removeAttribute('aria-busy');
    render();
  });
}
