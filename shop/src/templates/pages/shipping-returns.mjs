// /shipping-returns/: the demo delivery options (from lib/pricing.js, the same
// numbers the checkout uses), a clearly labelled demo returns policy and an FAQ.

import { esc, money } from '../../../site/assets/js/lib/render.js';
import { SHIPPING_OPTIONS, FREE_SHIPPING_OVER } from '../../../site/assets/js/lib/pricing.js';
import { head, trail, onward, OG_DEFAULT } from '../partials/content.mjs';

const RETURNS = [
  ['Return window', '30 days from the day your order arrives.'],
  ['Condition', 'Unworn and unwashed, in the original packaging.'],
  ['Refund', 'To the original payment method, once the return has been checked.'],
  ['In this demo', 'Nothing is delivered, so there is nothing to return and nothing to refund.'],
];

export default function render() {
  const crumbs = trail('Shipping and returns', '/shipping-returns/');
  const standard = SHIPPING_OPTIONS.find((o) => o.freeOver != null) ?? SHIPPING_OPTIONS[0];
  const others = SHIPPING_OPTIONS.filter((o) => o !== standard);
  const free = money(FREE_SHIPPING_OVER);

  const optionNote = (o) => (o.freeOver != null
    ? `Free when your bag reaches ${money(o.freeOver)}.`
    : 'The same price on every order.');

  const faqs = [
    ['Will my order arrive?', 'No. MONO is a fictional shop made as a portfolio demo. Orders are saved in your browser so you can see the confirmation, but nothing is packed or sent.'],
    ['Am I charged anything?', 'No. The checkout has no card fields and takes no payment. The test card and cash on delivery options are both part of the demo.'],
    ['How is the delivery price worked out?', `${esc(standard.name)} is ${money(standard.price)}, or free when your bag reaches ${free}. ${others.map((o) => `${esc(o.name)} is ${money(o.price)} on any order.`).join(' ')} The checkout shows the full total before you place the order.`],
    ['Where do you deliver?', 'Nowhere, as nothing ships. The checkout accepts any address so you can try the whole flow.'],
    ['Can I track my order?', 'There is no tracking. Your demo orders appear on the order confirmation page and in the demo admin, in this browser only.'],
    ['How do I start a return?', 'There is nothing to return in this demo. The returns policy above shows how returns would work in a real shop.'],
  ];

  const content = `
${head({
  crumbs: crumbs.html,
  eyebrow: 'Help',
  title: 'Shipping and returns',
  lede: 'MONO is a demo shop, so nothing ships. The checkout still offers delivery options and a returns policy so the flow is complete. Here they are, all demo data.',
  ghost: 'Delivery',
})}

<section class="wrap section-tight ct-ship" id="delivery" aria-labelledby="delivery-title">
  <div class="ct-split-head">
    <div>
      <p class="eyebrow">Delivery</p>
      <h2 class="ct-h2" id="delivery-title">Delivery options</h2>
    </div>
    <p class="muted ct-split-note"><span class="tag">Demo prices</span> Chosen at checkout. Standard delivery is free on bags of ${free} or more.</p>
  </div>
  <ul class="ct-options" role="list" data-stagger>
    ${SHIPPING_OPTIONS.map((o) => `<li class="ct-option">
      <h3 class="label ct-option-name">${esc(o.name)}</h3>
      <p class="ct-option-price tabular">${money(o.price)}</p>
      <p class="ct-option-eta">${esc(o.eta.charAt(0).toUpperCase() + o.eta.slice(1))}</p>
      <p class="ct-option-note muted">${esc(optionNote(o))}</p>
    </li>`).join('\n    ')}
  </ul>
</section>

<section class="wrap section-tight ct-returns" id="returns" aria-labelledby="returns-title">
  <div class="ct-split-head">
    <div>
      <p class="eyebrow">Returns</p>
      <h2 class="ct-h2" id="returns-title">Returns policy</h2>
    </div>
    <p class="muted ct-split-note"><span class="tag">Demo policy</span> Written so the shop reads like a real one. It does not apply to anything, because nothing is sold.</p>
  </div>
  <dl class="ct-terms">
    ${RETURNS.map(([term, text]) => `<div class="ct-term"><dt class="label">${esc(term)}</dt><dd>${esc(text)}</dd></div>`).join('\n    ')}
  </dl>
</section>

<section class="wrap section-tight ct-faq" id="faq" aria-labelledby="faq-title">
  <div class="ct-faq-grid">
    <div class="ct-faq-head">
      <p class="eyebrow">Questions</p>
      <h2 class="ct-h2" id="faq-title">Good to know</h2>
      <p class="muted">Short answers about delivery, payment and returns in this demo.</p>
    </div>
    <div class="ct-faq-list">
      ${faqs.map(([q, a], i) => `<details class="acc" id="faq-${i + 1}"><summary>${esc(q)}</summary><div class="acc-body"><p>${a}</p></div></details>`).join('\n      ')}
    </div>
  </div>
</section>

${onward([
  { href: '/cart/', label: 'Your bag', note: 'Delivery is worked out here and at checkout' },
  { href: '/size-guide/', label: 'Size guide', note: 'Measurements for every size' },
  { href: '/contact/', label: 'Contact', note: 'A demo form you can try' },
])}`;

  return {
    title: 'Shipping and Returns',
    description: 'Demo delivery options and prices for the MONO store, a clearly labelled demo returns policy and answers about orders. Nothing ships.',
    content,
    css: ['content'],
    js: ['content'],
    jsonld: [crumbs.jsonld],
    bodyClass: 'ct-page ct-ship-page',
    ...OG_DEFAULT,
  };
}
