// One place that adds to the bag and gives the feedback for it, so the product
// page, quick add, "shop the look" and the hero all behave the same way.

import * as cart from './cart.js';
import { getProduct, getVariant } from './store.js';
import { toast, announce, flyToBag, bumpBag } from './ui.js';

/**
 * addToBag(slug, variantId, { qty, sourceImg, openDrawer })
 * Returns the cart result ({ ok, qty, reason }).
 */
export function addToBag(slug, variantId, { qty = 1, sourceImg = null, quiet = false } = {}) {
  const product = getProduct(slug);
  const variant = getVariant(product, variantId);
  const result = cart.add(slug, variantId, qty);
  const label = product ? `${product.name}${product.variants.length > 1 ? `, ${variant?.label}` : ''}` : 'Item';

  if (result.ok) {
    if (!quiet) {
      flyToBag(sourceImg);
      const extra = result.reason === 'limit' ? ` (only ${result.qty} available)` : '';
      toast({
        message: `Added to bag: ${label}${extra}`,
        imageKey: product?.images?.[0]?.key,
        action: { label: 'View bag', onClick: () => document.dispatchEvent(new CustomEvent('mono:open-cart')) },
      });
    } else {
      bumpBag();
    }
    announce(`${label} added to your bag. ${cart.count()} items in bag.`);
  } else {
    const msg = result.reason === 'sold-out' ? `${label} is sold out.`
      : result.reason === 'limit' ? `You already have the most we can sell of ${label}.`
      : 'Sorry, that item is no longer available.';
    toast({ message: msg });
    announce(msg);
  }
  return result;
}
