// /order-confirmation/?order=<id>: the receipt for a demo order. Orders live
// in this browser (localStorage), so assets/js/pages/order.js reads the id
// from the address, finds the order and fills this frame. An unknown or
// missing id shows a calm "not found" state with links onward.

export default function render(ctx) {
  const { r } = ctx;

  const content = `
<div class="co-page co-order" data-order-page data-state="loading">
  <div class="wrap">
    <noscript>
      <p class="notice co-noscript">Demo orders are kept in this browser, so this page needs JavaScript to show your order. Turn JavaScript on, or open the demo admin to see your orders.</p>
    </noscript>

    <header class="co-order-head">
      <div class="co-check" aria-hidden="true" data-order-check>
        <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <circle class="co-check-ring" cx="32" cy="32" r="30" pathLength="1"/>
          <path class="co-check-tick" d="m20 33 8 8 16-17" pathLength="1"/>
        </svg>
      </div>
      <p class="eyebrow plain co-order-eyebrow" data-order-eyebrow>Thank you</p>
      <h1 class="co-title co-order-title" id="co-order-title" tabindex="-1" data-order-title>Order confirmed</h1>
      <div class="co-order-number" data-order-number-wrap>
        <p class="label muted">Order number</p>
        <p class="co-order-id" data-order-id></p>
        <p class="small muted" data-order-date></p>
      </div>
      <p class="co-order-demo" data-order-demo>${r.icon('check', { size: 16 })}<span>This is a demo order: nothing was charged and nothing will be shipped.</span></p>
    </header>

    <div class="co-order-body" data-order-body></div>

    <div class="co-order-missing" data-order-missing hidden>
      <p class="co-order-missing-text">We could not find that order in this browser. Demo orders are saved only in the browser that placed them, and clearing site data removes them.</p>
      <div class="co-order-actions">
        <a class="btn" href="/collections/">Continue shopping</a>
        <a class="btn btn-ghost" href="/admin/orders/">Demo admin orders</a>
        <a class="link" href="/cart/">Your bag</a>
      </div>
    </div>
  </div>
</div>`;

  return {
    title: 'Order Confirmed',
    description: 'Your MONO demo order: order number, items, totals and delivery details. Nothing was charged and nothing ships.',
    noindex: true,
    css: ['checkout'],
    js: ['order'],
    content,
  };
}
