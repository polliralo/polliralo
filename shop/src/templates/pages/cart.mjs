// /cart/: the bag page. The bag lives in this browser (localStorage), so the
// lines, totals and empty state are rendered by assets/js/pages/cart.js after
// the catalogue loads. The server markup holds the frame, a calm loading
// state that keeps the layout steady, and a message for visitors without JS.

import { SHIPPING_OPTIONS } from '../../../site/assets/js/lib/pricing.js';

export default function render(ctx) {
  const { r } = ctx;
  const standard = SHIPPING_OPTIONS[0];

  const skeleton = Array.from({ length: 2 }, () => `<div class="co-skel-line"><span class="co-skel-img"></span><span class="co-skel-text"><i></i><i></i><i></i></span></div>`).join('');

  const content = `
<div class="co-page co-cart" data-cart-page data-state="loading">
  <div class="wrap">
    <header class="co-head">
      <div class="co-head-main">
        <p class="eyebrow">Shopping bag</p>
        <h1 class="co-title" id="cart-title">Your bag</h1>
        <p class="co-head-count label muted" data-cart-count></p>
      </div>
      <a class="link co-head-link" href="/collections/">Continue shopping ${r.icon('arrow', { size: 14 })}</a>
    </header>

    <noscript>
      <p class="notice co-noscript">Your bag is kept in this browser, so this page needs JavaScript to show it. Turn JavaScript on to see your bag and check out.</p>
    </noscript>

    <div class="co-loading" data-cart-loading>
      <p class="visually-hidden" role="status">Loading your bag</p>
      <div class="co-skel" aria-hidden="true">${skeleton}</div>
    </div>

    <div class="co-cart-grid" data-cart-filled hidden>
      <section class="co-lines" aria-labelledby="co-lines-title">
        <h2 class="visually-hidden" id="co-lines-title">Items in your bag</h2>
        <div class="co-issues notice is-error" data-cart-issues hidden>
          <p data-cart-issues-text></p>
          <div class="co-issues-actions">
            <button class="btn btn-sm" type="button" data-update-qty hidden>Update quantities</button>
            <button class="btn btn-sm btn-ghost" type="button" data-remove-unavailable hidden>Remove unavailable items</button>
          </div>
        </div>
        <ul class="lines co-cart-lines" role="list" data-cart-lines></ul>
        <div class="co-lines-foot">
          <button class="co-text-btn" type="button" data-clear-bag aria-haspopup="dialog">${r.icon('trash', { size: 16 })}<span>Clear bag</span></button>
          <a class="co-text-btn" href="/collections/">Continue shopping</a>
        </div>
      </section>

      <aside class="co-panel co-cart-summary" aria-labelledby="co-cart-sum-title">
        <div class="co-panel-head">
          <h2 class="co-panel-title" id="co-cart-sum-title">Summary</h2>
          <span class="tag">Demo prices</span>
        </div>
        <div class="co-cart-sum" data-cart-summary></div>
        <div class="sum-row total co-total"><span>Estimated total</span><span data-cart-total></span></div>
        <p class="co-eta small muted" data-cart-eta>${r.esc(standard.name)}: ${r.esc(standard.eta)}.</p>
        <p class="visually-hidden" role="status" data-cart-live></p>
        <p class="notice is-error co-blocked" id="co-cart-blocked" data-cart-blocked hidden>Some items have changed since you added them. Update your bag above to continue to checkout.</p>
        <a class="btn btn-block co-checkout-btn" href="/checkout/" data-cart-checkout>Checkout ${r.icon('arrow', { size: 16 })}</a>
        <p class="co-demo small muted">Demo checkout: nothing is charged.</p>
        <p class="co-panel-links small"><a class="text-link" href="/shipping-returns/">Shipping and returns</a><a class="text-link" href="/size-guide/">Size guide</a></p>
      </aside>
    </div>

    <div class="co-cart-bar" data-cart-bar inert>
      <p class="co-cart-bar-total"><span class="label muted">Estimated total</span><span data-cart-bar-total></span></p>
      <a class="btn co-cart-bar-btn" href="/checkout/" data-cart-bar-checkout>Checkout</a>
    </div>

    <div class="co-empty-state" data-cart-empty hidden>
      <div class="co-undo-empty" data-cart-undo-empty hidden></div>
      <h2 class="co-empty-title" id="co-empty-title" tabindex="-1">Your bag is empty</h2>
      <p class="co-empty-text muted">Start with a shirt or a polo, then finish the outfit with a watch or a belt.</p>
      <a class="btn" href="/collections/">Shop all</a>
      <section class="co-empty-new" aria-labelledby="co-new-title" data-cart-new hidden>
        <div class="co-empty-new-head">
          <h2 class="co-empty-new-title" id="co-new-title">New arrivals</h2>
          <a class="link" href="/collections/">See everything</a>
        </div>
        <div class="grid-products co-new-grid" data-cart-new-grid></div>
      </section>
    </div>
  </div>

  <dialog class="co-dialog" id="co-clear-dialog" aria-labelledby="co-clear-title" aria-describedby="co-clear-desc">
    <div class="co-dialog-body">
      <h2 class="co-dialog-title" id="co-clear-title">Clear your bag?</h2>
      <p class="muted" id="co-clear-desc" data-clear-desc>This removes every item from your bag. You cannot undo it.</p>
      <div class="co-dialog-actions">
        <button class="btn" type="button" data-confirm-clear>Clear bag</button>
        <button class="btn btn-ghost" type="button" data-keep-items autofocus>Keep items</button>
      </div>
    </div>
  </dialog>
</div>`;

  return {
    title: 'Your Bag',
    description: 'Your MONO bag: check sizes and quantities, see the demo delivery options, then go to the demo checkout.',
    noindex: true,
    css: ['checkout'],
    js: ['cart'],
    content,
  };
}
