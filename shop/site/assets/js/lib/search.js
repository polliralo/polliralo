// Product search used by the search dialog and the /search/ page.

import { getProducts, getCategories } from './store.js';

/** Every product whose text contains all the words of the query. */
export function searchProducts(query) {
  const terms = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const cats = Object.fromEntries(getCategories().map((c) => [c.slug, `${c.name} ${c.title}`.toLowerCase()]));
  return getProducts().filter((p) => {
    const hay = [p.name, p.summary, p.description, p.colour?.name, cats[p.category], p.category, p.sku, ...(p.details ?? [])]
      .join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t) || (t.length > 3 && hay.includes(t.replace(/(es|s)$/, ''))));
  });
}
