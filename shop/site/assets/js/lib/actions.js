// One place that adds to the bag and gives the feedback for it, so the product
// page, quick add, "shop the look" and the hero all behave the same way.
// Feedback (shop/docs/research/motion.md, "Add to bag"): the header count
// updates at once, a polite announcement reads the item and bag size, and the
// bag drawer opens with the new line highlighted. No fake delay.

import * as cart from './cart.js';
import { getProduct, getVariant } from './store.js';
import { toast, announce, bumpBag } from './ui.js';

/**
 * addToBag(slug, variantId, { qty, openDrawer = true })
 * Returns the cart result ({ ok, qty, reason }).
 */
export function addToBag(slug, variantId, { qty = 1, openDrawer = true } = {}) {
  const product = getProduct(slug);
  const variant = getVariant(product, variantId);
  const result = cart.add(slug, variantId, qty);
  const option = product && product.variants.length > 1 ? `, ${(product.option?.label ?? 'size').toLowerCase()} ${variant?.label}` : '';
  const label = product ? `${product.name}${option}` : 'Item';

  if (result.ok) {
    bumpBag();
    const extra = result.reason === 'limit' ? ` Only ${result.qty} available, so that is the most in your bag.` : '';
    announce(`Added ${label}. Bag: ${cart.count()} ${cart.count() === 1 ? 'item' : 'items'}.${extra}`);
    if (openDrawer) {
      document.dispatchEvent(new CustomEvent('mono:open-cart', { detail: { highlight: { slug, variant: variantId } } }));
    }
    if (extra) toast({ message: extra.trim() });
  } else {
    const msg = result.reason === 'sold-out' ? `${label} is sold out.`
      : result.reason === 'limit' ? `You already have all we can sell of ${label} in your bag.`
      : 'Sorry, that item is no longer available.';
    toast({ message: msg });
    announce(msg);
  }
  return result;
}
