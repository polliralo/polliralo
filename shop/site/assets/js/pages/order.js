// /order-confirmation/?order=<id>: shows a demo order saved in this browser.
// The id is the only thing in the address (no personal data in URLs). The
// receipt follows checkout-ux.md section 5: number and date, the honest demo
// line, items, totals, address, method with an estimated date, payment,
// what happens next, and the way onward. Focus moves to the heading.

import { loadStore, getOrder, getProduct } from '../lib/store.js';
import { esc, money, productUrl } from '../lib/render.js';
import { $, enhance } from '../lib/ui.js';
import { arrivalText, summaryLineHTML, orderItemOptionText, totalsHTML } from '../lib/checkout-view.js';

const root = $('[data-order-page]');

const STATUS = { received: 'Received', packed: 'Packed', shipped: 'Shipped', cancelled: 'Cancelled' };

function addressHTML(d = {}) {
  const cityLine = [d.city, [d.region, d.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [d.name, d.address1, d.address2, cityLine, d.country].filter(Boolean).map((l) => `<span>${esc(l)}</span>`).join('');
}

function bodyHTML(order) {
  const placed = new Date(order.createdAt);
  const items = (order.items ?? []).map((it) => {
    const product = getProduct(it.slug);
    return summaryLineHTML({
      name: it.name,
      optionText: orderItemOptionText(it),
      qty: it.qty,
      lineTotal: it.lineTotal,
      imageKey: it.imageKey,
      url: product && !product.hidden ? productUrl(product) : null,
    }, { imageSizes: '88px' });
  }).join('');
  const shipText = order.shipping === 0 ? 'Free' : money(order.shipping, { cents: true });
  const phone = order.contact?.phone ? `<span>${esc(order.contact.phone)}</span>` : '';
  return `
    <div class="co-order-grid">
      <section class="co-panel co-order-items" aria-labelledby="co-items-title">
        <div class="co-panel-head">
          <h2 class="co-panel-title" id="co-items-title">Your items</h2>
          <span class="tag">Demo prices</span>
        </div>
        <ul class="co-slines co-slines-lg" role="list">${items}</ul>
        <div class="co-sum-totals">${totalsHTML({ subtotal: order.subtotal, shipping: order.shipping, total: order.total, shippingName: order.shippingName ?? 'Delivery' })}</div>
      </section>
      <div class="co-order-details">
        <section class="co-detail" aria-labelledby="co-d-address">
          <h2 class="co-detail-title" id="co-d-address">Delivery address</h2>
          <p class="co-lines-text">${addressHTML(order.delivery)}</p>
        </section>
        <section class="co-detail" aria-labelledby="co-d-method">
          <h2 class="co-detail-title" id="co-d-method">Delivery method</h2>
          <p class="co-lines-text"><span>${esc(order.shippingName)}, ${shipText}</span><span class="muted small">Estimated arrival ${esc(arrivalText(order.shippingId, placed))}, if this were a real order.</span></p>
        </section>
        <section class="co-detail" aria-labelledby="co-d-pay">
          <h2 class="co-detail-title" id="co-d-pay">Payment</h2>
          <p class="co-lines-text"><span>${esc(order.paymentName)}</span><span class="muted small">Nothing was charged.</span></p>
        </section>
        <section class="co-detail" aria-labelledby="co-d-contact">
          <h2 class="co-detail-title" id="co-d-contact">Contact</h2>
          <p class="co-lines-text"><span>${esc(order.contact?.email ?? '')}</span>${phone}</p>
        </section>
      </div>
    </div>

    <section class="co-next" aria-labelledby="co-next-title">
      <h2 class="co-next-title" id="co-next-title">What happens next</h2>
      <ol class="co-next-list" role="list">
        <li><span class="co-num" aria-hidden="true">01</span><h3>Saved in this browser</h3><p>The order is kept in this browser's storage only. Nothing was sent to MONO or anyone else, and no email is on its way.</p></li>
        <li><span class="co-num" aria-hidden="true">02</span><h3>Visible in the demo admin</h3><p>Open the demo admin to see the order as a shop owner would, with its items, totals and status.</p></li>
        <li><span class="co-num" aria-hidden="true">03</span><h3>Nothing arrives</h3><p>MONO is a portfolio demo, so no parcel is packed or shipped. The demo stock in this browser went down by what you ordered.</p></li>
      </ol>
      <div class="co-order-actions">
        <a class="btn" href="/collections/">Continue shopping</a>
        <a class="btn btn-ghost" href="/admin/orders/">See it in the demo admin</a>
      </div>
    </section>`;
}

if (root) {
  const title = $('[data-order-title]', root);
  const body = $('[data-order-body]', root);
  const missing = $('[data-order-missing]', root);
  const id = new URLSearchParams(window.location.search).get('order')?.trim() ?? '';
  let focused = false;

  const show = (state) => {
    root.dataset.state = state;
    if (!focused) {
      focused = true;
      title.focus({ preventScroll: true });
    }
  };

  function render() {
    const order = id ? getOrder(id) : null;
    if (!order) {
      document.title = 'Order Not Found | MONO';
      title.textContent = 'Order not found';
      $('[data-order-eyebrow]', root).hidden = true;
      $('[data-order-number-wrap]', root).hidden = true;
      $('[data-order-demo]', root).hidden = true;
      $('[data-order-check]', root).hidden = true;
      body.innerHTML = '';
      missing.hidden = false;
      show('missing');
      return;
    }
    $('[data-order-id]', root).textContent = order.id;
    const placed = new Date(order.createdAt);
    const when = Number.isNaN(placed.getTime()) ? '' : `Placed ${placed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${placed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const status = STATUS[order.status] ?? 'Received';
    $('[data-order-date]', root).textContent = [when, `Status: ${status} (demo)`].filter(Boolean).join(' · ');
    body.innerHTML = bodyHTML(order);
    enhance(body);
    missing.hidden = true;
    show('found');
  }

  loadStore().then(() => {
    render();
    // The admin can change the status in another tab.
    window.addEventListener('mono:orders', render);
  }).catch(() => {
    root.dataset.state = 'missing';
    missing.hidden = false;
    $('.co-order-missing-text', root).textContent = 'We could not load the shop data. Check your connection and reload the page.';
  });
}
