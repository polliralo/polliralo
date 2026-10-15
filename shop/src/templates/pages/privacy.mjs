// /privacy/: what this demo keeps in the browser and why, what it does not
// do, and how to clear it. Keep it in step with the storage keys in
// site/assets/js/lib/store.js, lib/cart.js, layout.mjs and the checkout.

import { esc } from '../../../site/assets/js/lib/render.js';
import { head, trail, pageIndex, onward, OG_DEFAULT } from '../partials/content.mjs';

const UPDATED = { iso: '2026-10-14', text: '14 October 2026' };

const STORED = [
  {
    key: 'mono.cart.v1', where: 'Local storage',
    holds: 'The products, options and quantities in your bag.',
    why: 'So your bag is still there on the next page and after a reload.',
  },
  {
    key: 'mono.orders.v1', where: 'Local storage',
    holds: 'Demo orders placed at the checkout, including the name, email, phone number and delivery address you typed.',
    why: 'So the order confirmation and the demo admin can show your orders.',
  },
  {
    key: 'mono.catalog.v1', where: 'Local storage',
    holds: 'Products you added or changed in the demo admin, and stock used up by demo orders.',
    why: 'So your edits show across the shop in this browser.',
  },
  {
    key: 'Checkout draft', where: 'Session storage',
    holds: 'What you have typed into the checkout form so far.',
    why: 'So a reload does not empty the form. It is removed when you close the tab.',
  },
  {
    key: 'mono:vt-from', where: 'Session storage',
    holds: 'The address of the page you came from.',
    why: 'To animate the product image between pages. It is removed when you close the tab.',
  },
];

const SECTIONS = [
  { id: 'short', label: 'The short version' },
  { id: 'stored', label: 'What is kept in your browser' },
  { id: 'not', label: 'What is not collected' },
  { id: 'forms', label: 'Forms' },
  { id: 'host', label: 'The host' },
  { id: 'clear', label: 'Clearing the data' },
  { id: 'changes', label: 'Changes to this policy' },
];

export default function render() {
  const crumbs = trail('Privacy policy', '/privacy/');

  const content = `
${head({
  crumbs: crumbs.html,
  eyebrow: 'Policy',
  title: 'Privacy policy',
  lede: 'MONO is a demo shop with no accounts, no tracking and no analytics. This page says exactly what it keeps, where it keeps it, and how to clear it.',
  ghost: 'Privacy',
  meta: `<p class="ct-updated"><span class="label">Last updated</span> <time datetime="${UPDATED.iso}">${UPDATED.text}</time></p>`,
})}

<div class="wrap section-tight ct-doc">
  <aside class="ct-doc-aside">${pageIndex(SECTIONS)}</aside>
  <article class="prose ct-prose" aria-labelledby="ct-title">
    <section id="short" aria-labelledby="short-title">
      <h2 id="short-title">The short version</h2>
      <ul class="ct-checks" role="list">
        <li>There are no accounts and no sign-in.</li>
        <li>There is no tracking, no analytics, no advertising and no third-party script.</li>
        <li>Forms send nothing. Messages and newsletter sign-ups go nowhere.</li>
        <li>Your bag, demo orders and admin edits are saved only in this browser.</li>
        <li>You can clear all of it at any time.</li>
      </ul>
    </section>

    <section id="stored" aria-labelledby="stored-title">
      <h2 id="stored-title">What is kept in your browser</h2>
      <p>The demo uses your browser's own storage so the bag, checkout and admin keep working as you move around. This data stays on your device. It is not sent to MONO or to anyone else, and other visitors cannot see it. The site's own code sets no cookies.</p>
      <dl class="ct-store">
        ${STORED.map((s) => `<div class="ct-store-row">
          <dt>${/[.:]/.test(s.key) ? `<code>${esc(s.key)}</code>` : `<span class="ct-store-name">${esc(s.key)}</span>`}<span class="ct-store-where">${esc(s.where)}</span></dt>
          <dd><span class="ct-store-label">Holds</span>${esc(s.holds)}</dd>
          <dd><span class="ct-store-label">Why</span>${esc(s.why)}</dd>
        </div>`).join('\n        ')}
      </dl>
    </section>

    <section id="not" aria-labelledby="not-title">
      <h2 id="not-title">What is not collected</h2>
      <p>There are no accounts, so there are no passwords or profiles. There are no analytics tools, tracking pixels or advertising tags, and the fonts and images come from this site rather than from other services.</p>
      <p>The checkout has no card fields and takes no payment, so no card details are ever asked for or kept.</p>
    </section>

    <section id="forms" aria-labelledby="forms-title">
      <h2 id="forms-title">Forms</h2>
      <p>The contact form, the newsletter box and the checkout all run inside your browser. Submitting them sends nothing over the network. The checkout saves the order you place in this browser, as described above, so you can see it again. The other forms keep nothing at all.</p>
    </section>

    <section id="host" aria-labelledby="host-title">
      <h2 id="host-title">The host</h2>
      <p>MONO is a set of static files on a web host. Like most hosts, it may keep standard request logs, such as IP addresses, the pages requested and browser details, to keep the service secure and working. The demo itself does nothing with them.</p>
    </section>

    <section id="clear" aria-labelledby="clear-title">
      <h2 id="clear-title">Clearing the data</h2>
      <p>Use the reset button in <a href="/about/#demo">How this demo works</a> to remove the bag, demo orders and admin edits from this browser in one step. You can also clear this site's data in your browser settings. A private window clears everything when you close it.</p>
    </section>

    <section id="changes" aria-labelledby="changes-title">
      <h2 id="changes-title">Changes to this policy</h2>
      <p>If this page changes, the date at the top changes with it. MONO is a fictional label with no inbox, so there is no one to write to about it; the <a href="/contact/">contact page</a> explains more.</p>
    </section>
  </article>
</div>

${onward([
  { href: '/about/#demo', label: 'How this demo works', note: 'Reset the demo in this browser' },
  { href: '/shipping-returns/', label: 'Shipping and returns', note: 'Demo delivery and returns policy' },
  { href: '/contact/', label: 'Contact', note: 'A demo form you can try' },
])}`;

  return {
    title: 'Privacy Policy',
    description: 'What the MONO demo store keeps in your browser and why: no accounts, no tracking or analytics, forms that send nothing, and how to clear it.',
    content,
    css: ['content'],
    js: ['content'],
    jsonld: [crumbs.jsonld],
    bodyClass: 'ct-page ct-privacy-page',
    ...OG_DEFAULT,
  };
}
