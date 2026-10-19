// /checkout/: guest checkout on one page (checkout-ux.md). Four numbered
// sections, an order summary (sticky aside on desktop, a collapsible bar on
// phones), GOV.UK-style error summary, and no card fields anywhere: payment
// is a demo choice. assets/js/pages/checkout.js fills the summary from the
// bag, validates, saves a draft in sessionStorage and places the demo order.

import { SHIPPING_OPTIONS, PAYMENT_OPTIONS } from '../../../site/assets/js/lib/pricing.js';
import { countryOptions, country, DEFAULT_COUNTRY, shippingRule } from '../../../site/assets/js/lib/checkout-view.js';

export default function render(ctx) {
  const { r } = ctx;
  const { esc, money, icon } = r;
  const c = country(DEFAULT_COUNTRY);

  /** A text field with label, optional hint and a slot for its error. */
  const field = ({ id, name, label, type = 'text', autocomplete, required = true, hint = '', attrs = '', className = '' }) => {
    const hintId = hint ? `${id}-hint` : '';
    return `<div class="field co-field${className ? ` ${className}` : ''}" data-field="${name}">
          <label for="${id}" data-label-for="${name}">${label}</label>
          ${hint ? `<p class="hint" id="${hintId}">${hint}</p>` : ''}
          <p class="field-error" id="${id}-error" data-error-for="${name}" hidden></p>
          <input class="input" id="${id}" name="${name}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${required ? ' required' : ''}${hintId ? ` aria-describedby="${hintId}"` : ''} ${attrs}>
        </div>`;
  };

  const shippingCards = SHIPPING_OPTIONS.map((o, i) => `
          <label class="co-option">
            <input class="co-radio" type="radio" id="co-ship-${o.id}" name="shipping" value="${o.id}"${i === 0 ? ' checked' : ''} required aria-describedby="co-ship-${o.id}-meta">
            <span class="co-option-main">
              <span class="co-option-name">${esc(o.name)}</span>
              <span class="co-option-meta" id="co-ship-${o.id}-meta">
                <span>${esc(o.eta)}</span>
                <span class="co-option-arrive" data-arrive="${o.id}"></span>
                <span class="co-option-rule">${esc(shippingRule(o))}</span>
              </span>
            </span>
            <span class="co-option-price" data-ship-price="${o.id}">${money(o.price, { cents: true })}</span>
          </label>`).join('');

  const paymentCards = PAYMENT_OPTIONS.map((o, i) => `
          <label class="co-option">
            <input class="co-radio" type="radio" id="co-pay-${o.id}" name="payment" value="${o.id}"${i === 0 ? ' checked' : ''} required aria-describedby="co-pay-${o.id}-note">
            <span class="co-option-main">
              <span class="co-option-name">${esc(o.name)}</span>
              <span class="co-option-meta" id="co-pay-${o.id}-note">${esc(o.id === 'test-card' ? 'Nothing is charged and no card details are collected.' : o.note)}</span>
            </span>
          </label>`).join('');

  const content = `
<div class="co-page co-checkout" data-checkout data-state="loading">
  <div class="wrap">
    <header class="co-head co-head-checkout">
      <div class="co-head-main">
        <nav class="co-steps" aria-label="Checkout steps">
          <ol>
            <li><a href="/cart/">Bag</a></li>
            <li aria-current="step"><span>Details</span></li>
            <li><span>Confirmation</span></li>
          </ol>
        </nav>
        <h1 class="co-title" id="co-title">Checkout</h1>
      </div>
      <p class="co-demo-banner">${icon('check', { size: 16 })}<span><strong>Demo checkout.</strong> Nothing is charged and nothing ships. There is no need to use real details.</span></p>
    </header>

    <noscript>
      <p class="notice co-noscript">Your bag is kept in this browser, so checkout needs JavaScript. Turn JavaScript on to place a demo order.</p>
    </noscript>

    <div class="co-loading" data-co-loading>
      <p class="visually-hidden" role="status">Loading your bag</p>
    </div>

    <div class="co-empty-state co-empty-checkout" data-co-empty hidden>
      <h2 class="co-empty-title" id="co-empty-title" tabindex="-1">Your bag is empty</h2>
      <p class="co-empty-text muted">Add something to your bag first, then come back here to place a demo order.</p>
      <div class="co-empty-actions">
        <a class="btn" href="/collections/">Shop all</a>
        <a class="btn btn-ghost" href="/cart/">Your bag</a>
      </div>
    </div>

    <div class="co-layout" data-co-ready>
      <aside class="co-summary" aria-labelledby="co-sum-title">
        <button class="co-sum-toggle" type="button" aria-expanded="false" aria-controls="co-sum-body" data-sum-toggle>
          <span class="co-sum-toggle-label">${icon('bag', { size: 18 })}<span data-sum-toggle-text>Show order summary</span><span class="co-chev" aria-hidden="true"></span></span>
          <span class="co-sum-toggle-total" data-sum-bar-total></span>
        </button>
        <div class="co-sum-body" id="co-sum-body" data-sum-body>
          <div class="co-panel co-sum-panel">
            <div class="co-panel-head">
              <h2 class="co-panel-title" id="co-sum-title">Order summary</h2>
              <a class="text-link small co-edit" href="/cart/">Edit bag</a>
            </div>
            <ul class="co-slines" role="list" data-sum-lines></ul>
            <div class="co-sum-totals" data-sum-totals></div>
            <p class="co-sum-foot"><span class="tag">Demo prices</span><span class="small muted">Rates and dates are illustrative.</span></p>
          </div>
          <p class="co-sum-links small"><a class="text-link" href="/shipping-returns/">Shipping and returns</a><a class="text-link" href="/privacy/">Privacy</a><a class="text-link" href="/contact/">Contact</a></p>
        </div>
      </aside>

      <form class="co-form" novalidate data-co-form aria-labelledby="co-title">
        <div class="co-error-summary" data-error-summary tabindex="-1" aria-labelledby="co-err-title" hidden>
          <h2 class="co-error-title" id="co-err-title">There is a problem</h2>
          <ul class="co-error-list" data-error-list></ul>
        </div>
        <div class="notice is-error co-blocked" data-co-blocked tabindex="-1" hidden>
          <p>Some items in your bag have changed since you added them. <a class="text-link" href="/cart/">Review your bag</a> to continue.</p>
        </div>
        <p class="co-required-note small muted">All fields are required unless marked optional.</p>

        <fieldset class="co-step" data-step="contact">
          <legend class="co-legend"><h2 class="co-legend-text"><span class="co-num" aria-hidden="true">01</span> Contact</h2></legend>
          <div class="co-grid">
            ${field({ id: 'co-email', name: 'email', label: 'Email', type: 'email', autocomplete: 'email', hint: 'For the order confirmation on screen. No email is sent.', attrs: 'spellcheck="false" autocapitalize="off" inputmode="email" maxlength="120"', className: 'co-span-2 co-has-tick' })}
            ${field({ id: 'co-phone', name: 'phone', label: 'Phone (optional)', type: 'tel', autocomplete: 'shipping tel', required: false, hint: 'Only used if the courier needs to reach you. In this demo nobody will call.', attrs: 'maxlength="24"', className: 'co-span-2' })}
          </div>
        </fieldset>

        <fieldset class="co-step" data-step="delivery">
          <legend class="co-legend"><h2 class="co-legend-text"><span class="co-num" aria-hidden="true">02</span> Delivery address</h2></legend>
          <div class="co-grid">
            <div class="field co-field co-span-2" data-field="country">
              <label for="co-country">Country</label>
              <p class="field-error" id="co-country-error" data-error-for="country" hidden></p>
              <select class="select" id="co-country" name="country" autocomplete="shipping country" required>${countryOptions(DEFAULT_COUNTRY)}</select>
            </div>
            ${field({ id: 'co-name', name: 'name', label: 'Full name', autocomplete: 'shipping name', attrs: 'autocapitalize="words" spellcheck="false" maxlength="80"', className: 'co-span-2' })}
            ${field({ id: 'co-address1', name: 'address1', label: 'Address', autocomplete: 'shipping address-line1', hint: 'Street and house number', attrs: 'maxlength="120"', className: 'co-span-2' })}
            <div class="co-span-2 co-line2-toggle-wrap">
              <button class="co-text-btn co-line2-toggle" type="button" aria-expanded="false" aria-controls="co-line2" data-line2-toggle>${icon('plus', { size: 14 })}<span>Add apartment, suite or floor</span></button>
            </div>
            <div class="co-span-2 co-line2" id="co-line2" data-line2>
              ${field({ id: 'co-address2', name: 'address2', label: 'Apartment, suite or floor (optional)', autocomplete: 'shipping address-line2', required: false, attrs: 'maxlength="120"' })}
            </div>
            ${field({ id: 'co-city', name: 'city', label: 'Town or city', autocomplete: 'shipping address-level2', attrs: 'autocapitalize="words" maxlength="80"', className: 'co-span-2' })}
            ${field({ id: 'co-region', name: 'region', label: `${esc(c.region)} (optional)`, autocomplete: 'shipping address-level1', required: false, hint: 'Only if your address uses one', attrs: 'autocapitalize="words" maxlength="80"' })}
            ${field({ id: 'co-postcode', name: 'postcode', label: esc(c.postcode.label), autocomplete: 'shipping postal-code', hint: `For example ${esc(c.postcode.example)}`, attrs: `autocapitalize="characters" spellcheck="false" maxlength="12"${c.postcode.numeric ? ' inputmode="numeric"' : ''}` })}
          </div>
        </fieldset>

        <fieldset class="co-step" data-step="shipping">
          <legend class="co-legend"><h2 class="co-legend-text"><span class="co-num" aria-hidden="true">03</span> Delivery method</h2></legend>
          <p class="field-error" id="co-shipping-error" data-error-for="shipping" hidden></p>
          <div class="co-options" data-field="shipping">${shippingCards}
          </div>
        </fieldset>

        <fieldset class="co-step co-step-pay" data-step="payment">
          <legend class="co-legend"><h2 class="co-legend-text"><span class="co-num" aria-hidden="true">04</span> Payment</h2></legend>
          <p class="field-error" id="co-payment-error" data-error-for="payment" hidden></p>
          <div class="co-pay-box">
            <div class="co-options" data-field="payment">${paymentCards}
            </div>
            <p class="co-pay-note small muted">${icon('check', { size: 14 })}<span>No card number, expiry or security code is asked for on this site.</span></p>
          </div>
        </fieldset>

        <div class="co-place">
          <div class="co-place-totals" data-place-totals></div>
          <button class="btn btn-block co-submit" type="submit" data-submit><span data-submit-label>Place demo order</span></button>
          <p class="co-place-note small muted">Demo order: nothing is charged and nothing ships. The order is saved in this browser only.</p>
        </div>
      </form>
    </div>
  </div>
</div>`;

  return {
    title: 'Checkout',
    description: 'MONO demo checkout: contact, delivery address, delivery method and a demo payment choice. Nothing is charged and nothing ships.',
    noindex: true,
    css: ['checkout'],
    js: ['checkout'],
    content,
  };
}
