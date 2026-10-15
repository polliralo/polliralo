// Product page: /products/<slug>/. Markup comes from site/assets/js/lib/pdp-view.js,
// the same builders product.js uses to re-render after an admin edit.

import { pdpHTML, collect, trail } from '../../../site/assets/js/lib/pdp-view.js';
import { breadcrumbList, isLive, url } from '../partials/seo.mjs';

/** product.description trimmed at a word boundary to at most `max` characters. */
export function metaDescription(text, max = 155) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return cut.slice(0, at > 40 ? at : cut.length).replace(/[\s,.;:]+$/, '') + '…';
}

/* ----- Live-mode structured data (shop/docs/research/seo.md, section 8a) -----
   Never emitted while SEO_MODE is 'demo': the products cannot really be bought. */

const AVAILABLE = 'https://schema.org/InStock';
const SOLD_OUT = 'https://schema.org/OutOfStock';
const NEW = 'https://schema.org/NewCondition';
const BRAND = { '@type': 'Brand', name: 'MONO' };
const AUDIENCE = { '@type': 'PeopleAudience', suggestedGender: 'male', suggestedMinAge: 13 };

function googleCategory(p) {
  if (['shirts', 't-shirts', 'polos'].includes(p.category)) return 'Apparel & Accessories > Clothing > Shirts & Tops';
  if (p.category === 'watches') return 'Apparel & Accessories > Jewelry > Watches';
  if (p.category === 'sunglasses') return 'Apparel & Accessories > Clothing Accessories > Sunglasses';
  if (/belt/.test(p.slug)) return 'Apparel & Accessories > Clothing Accessories > Belts';
  if (/wallet/.test(p.slug)) return 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips';
  return 'Apparel & Accessories';
}

const price = (p) => Number((Number(p.price) || 0).toFixed(2));

/**
 * productJsonLd(ctx, product) -> the live-mode Product / ProductGroup object.
 * Grouped colours (the two piqué polos): one multi-page ProductGroup varying by
 * colour and size. Other sized items: a single-page ProductGroup varying by size.
 * One-size items: a plain Product with one Offer.
 */
export function productJsonLd(ctx, p) {
  const { r } = ctx;
  const category = ctx.getCategory(p.category);
  const images = (x) => (x.images ?? []).filter((img) => img.view !== 'Styled').map((img) => url(r.imageUrl(img.key))).filter(Boolean);
  const pageUrl = (x, v) => url(`/products/${x.slug}/${v ? `?size=${encodeURIComponent(v.id)}` : ''}`);
  const offer = (x, v, u) => ({
    '@type': 'Offer',
    url: u,
    price: price(x),
    priceCurrency: 'USD',
    availability: Number(v?.stock) > 0 ? AVAILABLE : SOLD_OUT,
    itemCondition: NEW,
  });
  const variant = (x) => (v) => {
    const word = x.option?.type === 'waist' ? 'waist' : 'size';
    const u = pageUrl(x, v);
    return {
      '@type': 'Product',
      sku: `${x.sku}-${v.id}`,
      name: `${x.name}, ${word} ${v.label}`,
      url: u,
      image: images(x),
      color: x.colour?.name,
      size: v.label,
      offers: offer(x, v, u),
    };
  };

  if (!r.needsChoice(p)) {
    const u = pageUrl(p);
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description,
      url: u,
      image: images(p),
      sku: p.sku,
      brand: BRAND,
      color: p.colour?.name,
      category: googleCategory(p),
      audience: AUDIENCE,
      offers: offer(p, p.variants?.[0], u),
    };
  }

  const siblings = p.group ? ctx.products.filter((x) => x.group === p.group && !x.hidden) : [];
  if (siblings.length > 1) {
    const colour = siblings[0].colour?.name ?? '';
    return {
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': url(`/#group-${p.group}`),
      name: siblings[0].name.replace(new RegExp(`^${colour.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), ''),
      description: category?.description ?? p.description,
      brand: BRAND,
      productGroupID: siblings[0].sku.split('-').slice(0, -1).join('-'),
      variesBy: ['https://schema.org/color', 'https://schema.org/size'],
      category: googleCategory(p),
      audience: AUDIENCE,
      hasVariant: siblings.flatMap((x) => x.variants.map(variant(x))),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': url(`/products/${p.slug}/#group`),
    name: p.name,
    description: p.description,
    url: pageUrl(p),
    brand: BRAND,
    productGroupID: p.sku,
    variesBy: ['https://schema.org/size'],
    category: googleCategory(p),
    audience: AUDIENCE,
    hasVariant: p.variants.map(variant(p)),
  };
}

export default function render(ctx, route) {
  const product = ctx.getProduct(route.params.slug);
  if (!product) throw new Error(`Unknown product: ${route.params.slug}`);
  const data = collect(product, {
    getProduct: ctx.getProduct,
    getCategory: ctx.getCategory,
    products: ctx.products,
    sizeGuide: ctx.sizeGuide,
  });
  const { category } = data;
  const items = trail(product, category);
  const first = product.images?.[0];

  return {
    title: product.name,
    fullTitle: `${product.name} | ${category?.title ?? 'Shop'} | MONO`,
    description: metaDescription(product.description ?? product.summary),
    content: pdpHTML(product, data, { crumbs: ctx.r.breadcrumbs(items) }),
    css: ['product'],
    js: ['product'],
    jsonld: [breadcrumbList(items), ...(isLive() ? [productJsonLd(ctx, product)] : [])],
    ogImage: `/assets/img/og/product-${product.slug}.jpg`,
    ogImageAlt: first?.alt ? `${product.name}: ${first.alt}` : product.name,
    // rel="expect" + blocking="render" holds the first render until #pdp-media is
    // parsed, so the card-to-page morph has its target. html-validate 9 only
    // knows blocking on stylesheet/preload links, hence the one-line directive.
    preload: [
      '<!-- [html-validate-disable-next attribute-misuse -- render-blocking expect link is valid HTML] -->',
      '<link rel="expect" href="#pdp-media" blocking="render">',
    ],
    activeCategory: product.category,
    bodyClass: 'page-product',
  };
}
