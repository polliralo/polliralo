// Demo delivery options and totals. These are illustrative numbers for the
// portfolio demo, labelled as such wherever they appear.

export const FREE_SHIPPING_OVER = 150;

/** Most of one item (one size) a bag may hold. Lives here, not in cart.js, so the Node build can import it. */
export const MAX_QTY = 10;

export const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard delivery', eta: '3 to 5 working days', price: 6, freeOver: FREE_SHIPPING_OVER },
  { id: 'express', name: 'Express delivery', eta: '1 to 2 working days', price: 14, freeOver: null },
];

export const PAYMENT_OPTIONS = [
  { id: 'test-card', name: 'Test card', note: 'A built-in test card. Nothing is charged and no card details are collected.' },
  { id: 'cod', name: 'Cash on delivery', note: 'Pay when the parcel arrives. In this demo nothing is delivered.' },
];

export function shippingOption(id) {
  return SHIPPING_OPTIONS.find((o) => o.id === id) ?? SHIPPING_OPTIONS[0];
}

export function shippingCost(id, subtotal) {
  const option = shippingOption(id);
  if (subtotal <= 0) return 0;
  if (option.freeOver != null && subtotal >= option.freeOver) return 0;
  return option.price;
}

export function totals(subtotal, shippingId = 'standard') {
  const shipping = shippingCost(shippingId, subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

/** How far the bag is from free standard delivery, 0..1 and the gap in dollars. */
export function freeShippingProgress(subtotal) {
  const gap = Math.max(0, FREE_SHIPPING_OVER - subtotal);
  return { progress: Math.min(1, subtotal / FREE_SHIPPING_OVER), gap, reached: gap === 0 };
}
