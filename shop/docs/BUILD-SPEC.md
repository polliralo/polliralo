# MONO build spec (for everyone building pages)

Read this whole file before writing code. It is the contract between the
shared foundation and the page templates. Paths are relative to `shop/`.

## 1. What MONO is

A fictional premium menswear shop, built as a portfolio demo: 13 products in
6 categories, a working bag, a validated demo checkout (no real payment), demo
order history and a demo admin, all in the visitor's browser (localStorage).
Static HTML pre-rendered by Node, enhanced by vanilla ES modules. No
frameworks, no libraries, no build step in the browser.

Design direction: `docs/design-references.md` (read "The combination",
"Homepage", "Product page", "Phone" and "Owner decisions"). Look at the
approved previews in `docs/preview/*.jpg`. Research to follow:
`docs/research/motion.md`, `docs/research/seo.md`,
`docs/research/checkout-ux.md`. The owner's brief: `docs/master-brief.md`.

## 2. Content rules (hard, checked in review)

- Site copy is English. Short, calm, specific. No exclamation marks.
- **No long dashes** (the em dash or en dash characters) anywhere in site copy, alt text or
  titles. Use commas, colons, "to" for ranges and "/" for counters ("01 / 06").
- Banned words: leverage, seamless, empower, unlock, robust, actionable,
  data-driven, solutions, elevate, curated, game-changer, world-class,
  luxury (as a claim), premium quality (as a claim).
- Never invent: reviews, ratings, customer counts, sales numbers, fabric
  composition (no "100% cotton"), country of origin, certifications, water or
  UV ratings, warranty terms, real contact details, addresses, phone
  numbers, staff names, press quotes. Only use facts in `src/data/catalog.json`
  (name, summary, description, details) and what the photos plainly show.
- Prices are demo data. Wherever a price is the main focus (hero, product
  page, checkout, order confirmation, cart summary) show the
  `<span class="tag">Demo price</span>` label or a nearby "Demo prices" note.
  Cards may show the bare price (the announcement bar and footer cover them).
- No fake scarcity, countdowns, "X people are viewing", sale banners or promo
  codes. Stock is shown as "In stock" or "Sold out" only, never "only N left"
  (the stock is demo data and the owner's research rules such lines out); the
  quantity stepper still stops at what is in stock.
- The footer disclosure stays (it is in `layout.mjs`).
- Words never sit on top of photos. Labels go under or beside images. A giant
  ghost word may sit *behind* cut-outs on the plain canvas, and only in the
  home hero's brand slide: never on the product page, never over a product,
  never repeating a word that is already set large nearby.
- Decorative giant words are written as
  `<span class="ghost-word" data-word="Polo" aria-hidden="true"></span>`: the
  text comes from a CSS pseudo-element, so screen readers and contrast checks
  skip it (axe and Lighthouse otherwise flag the faint colour).

## 3. Architecture

```
src/data/catalog.json      products, categories, looks (seed data; do not edit)
src/data/media.json        image manifest (generated; do not edit)
src/data/size-guide.json   demo measurements (tops, belts, how to measure)
src/config.mjs             SITE_URL, SEO_MODE ('demo'), names, default OG image
src/templates/layout.mjs   <head>, header, footer, menu/search/bag dialogs
src/templates/partials/seo.mjs   JSON-LD builders: breadcrumbList, website, organization, isLive
src/templates/pages/<name>.mjs   one per page type (see ownership)
scripts/build.mjs          renders routes -> site/**/index.html, writes assets/data/store.json
site/assets/css/base.css   tokens + every shared component (do not edit)
site/assets/css/pages/<name>.css   page styles
site/assets/js/app.js      runs on every page (do not edit)
site/assets/js/lib/*.js    shared modules (do not edit)
site/assets/js/pages/<name>.js     page scripts (ES modules)
```

### Template API

```js
// src/templates/pages/<name>.mjs
export default function render(ctx, route) {
  return {
    title, fullTitle,        // <title> = fullTitle ?? `${title} | MONO`
    description,             // unique per indexable page, <= 155 chars
    content,                 // HTML inside <main id="main">
    css: ['name'],           // -> /assets/css/pages/name.css
    js: ['name'],            // -> /assets/js/pages/name.js (module)
    jsonld: [obj, ...],      // from partials/seo.mjs
    noindex: true, robots: 'noindex, nofollow',   // utility pages only
    ogImage: '/assets/img/og/<file>.jpg', ogImageAlt, ogType,
    preload: ['<link ...>'], // extra <head> tags
    bodyClass, activeCategory, // activeCategory = category slug -> nav aria-current
  };
}
```

`ctx` = `{ catalog, media, sizeGuide, version, config, r, absolute,
categories, products, looks, getProduct(slug), getCategory(slug),
productsIn(categorySlug) }`. `ctx.r` is `site/assets/js/lib/render.js`. Route
params: `route.params` (`{ category }`, `{ slug }`, `{ view }`).

Templates may import browser modules from `site/assets/js/lib/` or from your
own files under `site/assets/js/` when they are pure (no `window` or
`document` at import time). This is how markup stays identical between the
build and the browser: write a pure `xxxHTML(data)` builder once, use it in
the template and in the page script.

### Shared browser modules (read them; they are short)

- `lib/render.js`: `esc`, `money(n, {cents})` (USD), `productUrl(p)`,
  `categoryUrl(slug)`, `picture(key, {alt, sizes, loading, priority,
  className, imgClass, attrs})`, `imageUrl(key)`, `mediaInfo(key)`,
  `productCard(p, {eager, sizes, headingLevel, showNew})`, `stockInfo(p)`,
  `needsChoice(p)`, `breadcrumbs(items)`, `icon(name, {size, label})`
  (search bag menu close plus minus left right arrow check trash user edit filter).
- `lib/store.js`: `loadStore()`, `onStore(fn)` (runs now and after every
  catalogue change), `getProducts({category})` (skips hidden),
  `getAllProducts()`, `getProduct(slug)`, `getVariant(p, id)`,
  `getCategories()`, `getCategory(slug)`, `getLooks()`, `getSizeGuide()`,
  `isEdited()`, `seedProduct(slug)`, `saveProduct(p, {previousSlug})`,
  `deleteProduct(slug)`, `resetCatalog()`, `adjustStock(slug, variantId, delta)`,
  `listOrders()`, `getOrder(id)`, `addOrder(o)`, `updateOrder(id, patch)`,
  `clearOrders()`, `newOrderId()`, `storage`. Events on `window`:
  `mono:catalog`, `mono:orders`.
- `lib/cart.js`: `getItems()`, `count()`, `add(slug, variantId, qty)` ->
  `{ok, qty, reason}`, `setQty`, `remove`, `restore`, `clear`, `lines()`
  (each line: product, variantData, stock, issue
  `missing|sold-out|limited|null`, unitPrice, lineTotal), `subtotal()`,
  `hasIssues()`, `MAX_QTY`. Event on `window`: `mono:cart`.
- `lib/actions.js`: `addToBag(slug, variantId, {qty, openDrawer})`. Always add
  through this: it updates the badge, announces, and opens the bag drawer with
  the new line highlighted.
- `lib/pricing.js`: `SHIPPING_OPTIONS`, `PAYMENT_OPTIONS`, `shippingCost`,
  `totals(subtotal, shippingId)`, `freeShippingProgress`, `FREE_SHIPPING_OVER`.
- `lib/cart-view.js`: `lineHTML`, `renderLines(ul, opts)`,
  `bindLineControls(ul)`, `summaryHTML({shippingId, showShippingNote})`.
- `lib/ui.js`: `$`, `$$`, `reducedMotion()`, `openDialog(d, {opener})`,
  `closeDialog(d)`, `announce(msg)`, `toast({message, imageKey, action})`,
  `enhance(root)` (image fade-in + reveals for injected markup),
  `observeReveals`, `withTransition(update)` (same-page view transition).
- `lib/rail.js`: `initRails(root)` for `.rail-wrap[data-rail]`.
- `lib/search.js`: `searchProducts(query)`.

`app.js` already handles on every page: header scroll state, menu, search
dialog, bag drawer, bag counts, quick add on `.card` (`[data-quick-add]`),
demo forms (`form[data-demo-form]` with `[data-form-message]`), `enhance(document)`.
Do not re-implement these.

### Data hydration (important)

Pages are pre-rendered from the seed catalogue, but the admin can change
products in this browser. Every page that shows products must call
`onStore(...)` and bring its product markup in line with the store when
`isEdited()` is true (prices, names, stock, hidden or deleted products, new
custom products). Re-render with the same pure builders. When not edited,
leave the server markup alone (no flash). A product that no longer exists or
is hidden shows a calm "no longer available" state with links onward.

### Order record (written by checkout, read by confirmation and admin)

```js
{
  id: 'MONO-7KQ4-2M', createdAt: ISOString, status: 'received',   // received | packed | shipped | cancelled (demo)
  items: [{ slug, variant, name, variantLabel, optionLabel, qty, unitPrice, lineTotal, imageKey }],
  subtotal, shippingId, shippingName, shipping, total,               // numbers in USD
  paymentId, paymentName,                                            // 'test-card' | 'cod'
  contact: { email, phone },
  delivery: { name, address1, address2, city, region, postcode, country },
  demo: true
}
```

Checkout reduces stock with `adjustStock` for each line, then `cart.clear()`,
then goes to `/order-confirmation/?order=<id>` (no personal data in the URL).

## 4. Visual system

Tokens are at the top of `base.css` (ivory page, canvas behind cut-outs,
ghost word colour, ink, muted, line, olive accent, night sections). Use the
tokens; do not introduce new colours except a product's own `accent`/`colour.hex`
from the data (set as `--accent` / `--dot` / `--sw` inline custom properties,
which the validator allows).

Type: Jost only, sans-led (refinement round, October 2026; Bodoni Moda was
retired). `--display` is the family for display roles and `--serif` survives
only as an alias of it. Weights: hero 700 (`--w-hero`), headings and the
product page title 600 (`--w-heading`), product names on cards 500
(`--w-medium`), body 400 (`--w-text`); display sizes use
`--tracking-display`. An `em` inside a heading is set in the olive accent
(`--accent-ink`), never italic. Small capitals labels: `.eyebrow`, `.label`.
Square corners. No shadows except toasts. No icon rows, no decorative
doodles.

Buttons: `.btn` is the charcoal primary, 48px tall (52px on phones), with
hover, focus-visible, pressed (1px down), disabled, busy
(`aria-busy="true"` shows a spinner) and done states; `.btn-ghost` is the
outlined secondary, `.link` / `.text-link` are text links. One style per
role on every page.

Shared components in `base.css` (use them, do not restyle them globally):
`.wrap .section .section-tight .display .eyebrow .label .lede .muted .small
.section-head .btn .btn-ghost .btn-light .btn-block .btn-sm .link .text-link
.icon-btn .tag .chips .chip (aria-checked / aria-pressed / .is-on,
aria-disabled / .is-out) .swatches .swatch (aria-current) .dot .stepper .field
.input .select .textarea .field-error .check .notice .pic .pic-cut .card
.grid-products .crumbs .drawer .line .sum-row .ship-meter .empty .page-head
.ghost-word .price .rail-wrap .rail .rail-nav .acc .acc-body .prose
.table-wrap .table .on-night .visually-hidden`.

Page CSS must be scoped: prefix every selector with your page's root class
(for example `.home-hero`, `.pdp-…`, `.coll-…`, `.co-…`, `.adm-…`). Keep
`@media` breakpoints at 760px (phone), 1040px (header switches to menu) and
1180px (wide). Test at 390px, 820px, 1280px and 1440px wide; no sideways
scroll ever.

Images: always `r.picture(key, {...})` with correct `sizes`. Cut-outs (keys
`cut-*`) have alpha and sit on `--canvas`; give their frame `aspect-ratio: 4 / 5`
(the media is 1122x1402). Photos are 4:5 except `wide-*` (16:9). Every image
below the first screen is lazy. The LCP image of a page uses
`priority: true` and is never faded or hidden at first paint.

## 5. Motion (from docs/research/motion.md)

- Motion is there only when it explains a state change, an image transition
  or an interaction. Product cards, headings, text blocks and buttons do not
  animate in. Shopping is never slowed down: nothing delays navigation or
  input.
- Curves and durations: use the tokens (`--ease-out`, `--ease-expo`,
  `--ease-in-out`, `--ease-curtain`, `--ease-in`, `--ease-standard`,
  `--ease-settle`; `--d-fast` 160 for buttons and small hovers, `--d-base`
  240 for minor changes, `--d-drawer` 300 for drawers and dialogs,
  `--d-slow` 450 for reveals, `--d-slower` 600 for the home hero cross-fade,
  `--stagger` 50ms). No parallax, no bounce.
- Animate only `transform`, `opacity` (and `clip-path` for one-shot reveals).
  Never `transition: all`. Never animate width, height, top, left or margins.
- Scroll reveals are for editorial images only: `data-reveal` (rise and
  fade) or `data-reveal="clip"` (curtain wipe, at most once per page). Put
  `data-stagger` on a parent to stagger its children (capped at 4).
  `enhance(root)` wires injected markup.
- Cross-page morph: the product card image (`[data-vt-media]`) morphs into the
  product page's `#pdp-media` and back. Only the product page owns
  `#pdp-media`. Do not set `view-transition-name` anywhere else except inside
  a `withTransition()` same-page update, and remove it after.
- Same-page changes (sorting the grid, switching a look, swapping the
  gallery image) go through `withTransition()`.
- Add to bag: no fly-to-cart, no shake. Button label swaps to "Added" for
  2 seconds with a fixed min-width; `addToBag` does the rest.
- Reduced motion: everything is visible and usable with
  `prefers-reduced-motion: reduce`, with JS off, and before the store loads.
  Check `reducedMotion()` at call time. The home hero is the only thing
  that moves by itself: on wide screens with a pointer only, never on
  phones and never under reduced motion, always with a Pause button.
- Nothing blocks input. No scroll listeners for effects (use
  IntersectionObserver). `content-visibility: auto` only below the fold.

## 6. SEO (from docs/research/seo.md)

- One `<h1>` per page. Its text matches the main part of the title.
- Titles: home `MONO | Modern Menswear Essentials` (fullTitle);
  `/collections/` `Shop All Menswear`; category `{category.title}`; product
  fullTitle `{name} | {category.title} | MONO`; `About MONO` (fullTitle);
  `Contact`; `Size Guide`; `Shipping and Returns`; `Privacy Policy`; utility
  pages `Search`, `Your Bag`, `Checkout`, `Order Confirmed`, `Admin (Demo)`,
  `Page Not Found`.
- Descriptions: unique, at most 155 characters, no prices. The build fails on
  duplicate titles or descriptions among indexable pages.
- noindex: search, cart, checkout, order-confirmation, product-dynamic, 404
  (`noindex: true`); admin (`noindex: true, robots: 'noindex, nofollow'`).
- JSON-LD: home gets `website()` and `organization()`; category and product
  pages get `breadcrumbList(items)` built from the same items as the visible
  `r.breadcrumbs(items)` trail (Home / Shop / Category / Product, with Shop =
  `/collections/`). `SEO_MODE` is 'demo', so no Product, Offer, review or
  rating markup. The product template also implements live mode
  (`isLive()`) per seo.md section 8a, but it stays off.
- Crawlable links: product names and images link with `<a href>`; filters and
  sorts are buttons/inputs (not links); the URL query mirrors state with
  `history.replaceState`.
- OG images: `/assets/img/og/default.jpg`, `/assets/img/og/product-<slug>.jpg`,
  `/assets/img/og/collection-<slug>.jpg` (1200x630, made by
  `scripts/og.mjs`). Pass `ogImage` and `ogImageAlt` from templates using
  these exact paths.

## 7. Accessibility

- Landmarks come from the layout. Sections get headings in order (h1, h2, h3).
- Every control is a real `<button>`, `<a href>` or form control, at least
  44x44px on touch. Visible focus (the base focus ring).
- Option pickers (sizes, looks, shipping, payment) are radio groups: native
  `<input type="radio">` with styled labels is preferred. Sold-out options
  are disabled and say so to screen readers.
- Dynamic results (filters, search, totals) update a polite live region or
  use `announce()`.
- Forms: visible labels, `autocomplete` tokens, `inputmode`, errors linked
  with `aria-describedby`, `aria-invalid`, an error summary that receives
  focus on submit.
- Colour contrast: body text ink or muted on ivory/canvas; never olive text on
  night; lagoon-style bright accents do not exist here.

## 8. Ownership (who edits what)

Only edit files you own. If you need a change in a shared file (base.css,
app.js, lib/*, layout.mjs, build.mjs, config.mjs, catalog.json), do not make
it: describe the exact change in your final report and work around it in your
own files meanwhile. You may add new files under your own names.

| Area | Templates | CSS / JS | Test file |
|---|---|---|---|
| home | `pages/home.mjs` | `css/pages/home.css`, `js/pages/home.js` | `tests/home.spec.mjs` |
| collections | `pages/collections.mjs`, `pages/collection.mjs`, `pages/search.mjs` | `css/pages/collection.css`, `js/pages/collection.js`, `js/pages/search.js` (+ `js/lib/catalog-view.js` if useful) | `tests/collections.spec.mjs` |
| product | `pages/product.mjs`, `pages/product-dynamic.mjs` | `css/pages/product.css`, `js/pages/product.js` (+ `js/lib/pdp-view.js`) | `tests/product.spec.mjs` |
| checkout | `pages/cart.mjs`, `pages/checkout.mjs`, `pages/order-confirmation.mjs` | `css/pages/checkout.css`, `js/pages/cart.js`, `js/pages/checkout.js`, `js/pages/order.js` | `tests/checkout.spec.mjs` |
| admin | `pages/admin.mjs` | `css/pages/admin.css`, `js/pages/admin.js` (+ `js/lib/admin-*.js`) | `tests/admin.spec.mjs` |
| content + SEO | `pages/about.mjs`, `contact.mjs`, `size-guide.mjs`, `privacy.mjs`, `shipping-returns.mjs`, `not-found.mjs` | `css/pages/content.css`, `js/pages/content.js`, `scripts/og.mjs`, `site/assets/img/og/*` | `tests/content.spec.mjs`, `tests/seo.spec.mjs` |

Never touch `media/originals/`, `site/assets/img/` (except `og/`),
`site/assets/fonts/`, or another area's files.

## 9. Checking your work

Run from `shop/` unless noted. Use only your own ports.

```bash
node scripts/build.mjs --only home            # comma list allowed: --only cart,checkout
npx html-validate --config .htmlvalidate.json "site/index.html"
node scripts/shots.mjs --port <your shots port> --paths /,/x/ --out .qa/<area> [--full] [--viewports desktop,mobile,tablet,laptop] [--reduced]
# Tests (from the repo root):
SHOP_TEST_PORT=<your test port> npx playwright test --config playwright.shop.config.mjs shop/tests/<area>.spec.mjs
```

`shots.mjs` prints console errors, failed requests, broken images and
sideways overflow; all must be empty. Look at the screenshots yourself
(Read the PNGs) at desktop and phone size and compare with
`docs/preview/*.jpg`. Tests run in two projects (desktop 1440x900 and Pixel 7);
write tests that pass in both. Clear localStorage between tests
(`page.addInitScript` or a fresh context).

Ports: home 4201 / tests 4301; collections 4202 / 4302; product 4203 / 4303;
checkout 4204 / 4304; admin 4205 / 4305; content 4206 / 4306.

Before you finish: the build of your templates passes, html-validate is
clean on your pages, shots show no errors or overflow, your test file passes
in both projects, `grep -nP '[\x{2013}\x{2014}]'` finds nothing in your
files, and nothing in section 2 is broken.
