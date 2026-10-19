# MONO

**MONO** is a fictional premium menswear shop, built as a portfolio demo. It has 18 products, three in each of its six categories (shirts, T-shirts, polos, watches, sunglasses and accessories), and every part of a real shop works: browsing, filters, search, product pages, a bag, a validated checkout with a demo payment, order confirmation and a store admin. All prices, stock and orders are demo data. No payment is ever taken and nothing ships.

![MONO home page on a desktop screen](docs/screens/home-desktop.jpg)

More screens: [home on a phone](docs/screens/home-phone.jpg), [category page](docs/screens/collection-desktop.jpg), [product page](docs/screens/product-desktop.jpg), [checkout](docs/screens/checkout-desktop.jpg), [admin](docs/screens/admin-desktop.jpg).

The site is plain HTML, CSS and JavaScript (no framework). A small Node script turns the product data into a real HTML page for every address, which is good for search engines and fast to load. In the browser, a few JavaScript modules add the bag, checkout and admin, using the browser's own storage as the demo database.

## Preview it on your computer

1. Install [Node.js](https://nodejs.org) 18.17 or newer (20 or 22 recommended).
2. In the repository folder (one level above `shop/`), run `npm install` once.
3. Run `npm run shop:build`, then `npm run shop:start`, and open <http://localhost:4174>.

Use the preview server rather than opening the HTML files directly: the pages load the product data with `fetch`, which browsers block for files opened from a folder.

## What the shop does

| Area | What works |
| --- | --- |
| **Home** | A hero of five slides, best first, each with one message and one large picture on a light cream stage: "Less noise. Better essentials." (the owner's chosen model from the Look 02 photo), "Weekends, with a collar." (a walking model cut from the owner's terrace polo photo), "Made for daylight." (the Look 01 model in black sunglasses), "Oxfords and a fine stripe." (shirts) and "Finish the outfit." (a belt and wallet still life). Each picture stands in front of a large soft circle with two small ones beside it, and a two-word phrase in a brush script sits behind the model's head ("Modern classics", "Off duty", "Golden hour", "Sharp lines", "Fine details"); there is no box, wall or large MONO word. The call to action is a black pill that stays in the same place on every slide. On wide screens with a mouse it moves on every 8 seconds, with Previous, Pause and Next; on phones it never moves by itself, and the picture sits large above the words. Swipe and arrow keys work. Below it: shop by category, new arrivals (a swipe row on phones), Shop the Look (two looks, each item addable), the White Dial Watch in a dark rounded panel, a short brand note and a demo newsletter. Apart from the two look photos, which the owner chose for both the hero and Shop the Look, no photo appears twice on the home page. |
| **Collections** | Shop all and six category pages, each with a short heading, so the first products are on the first screen. Three columns on wide screens, two on phones. When the last row is not full, an editorial photo tile fills the gap (Shop the Look, the size guide or a related category), never a fake product. Filters for size, colour, price and stock, five sort orders, removable filter chips, "Clear all", an empty state, and the choices kept in the address so a filtered page can be shared. Cards glide to their new places when the order changes. On phones the filters open in a drawer. |
| **Search** | Instant search from the header on every page, plus a full search page (`/search/?q=olive`). |
| **Product pages** | Angle thumbnails, a full-screen photo viewer, size choice with sold-out sizes marked, a size guide, colour links between the two polos, quantity, add to bag (it will not add clothing without a size), "Complete the look", "More in" this category (called "You may also like" when other categories fill the row), details and delivery information. On phones the photos swipe and an Add to bag bar stays at the bottom. A link such as `/products/olive-pique-polo/?size=l` opens with size L chosen. |
| **Bag** | A side drawer on every page and a full bag page: change quantity, remove with Undo, clear the bag, a free-delivery meter, and clear messages when an item has sold out or changed. |
| **Checkout** | One page: contact, delivery address (labels and postcode rules follow the chosen country), delivery method and payment. The payment choices are **Test card** (nothing is charged and no card details are asked for) and **Cash on delivery**. Every field is checked, with a summary of problems at the top. Nothing is filled in for you, and delivery dates are shown as demo estimates. Placing the order saves it, lowers the stock and empties the bag. |
| **Order confirmation** | The order number, items, totals, address and next steps, clearly marked as a demo order. |
| **Admin** (`/admin/`) | A dashboard of the demo data, a product editor (add, edit, hide, delete; prices, words, sizes and stock, photos), a restock list, the list of demo orders with their status, a data download and "Reset demo data". Changes show up in the shop straight away. |
| **Content** | About (with "How this demo works"), Contact (a demo form), Size guide, Privacy, Shipping and returns, and a designed 404 page. |

## How the demo data works

The 18 products live in `src/data/catalog.json`. The build copies them, with the image list, into `site/assets/data/store.json`, which every page reads. Anything a visitor changes is kept only in **their own browser** (localStorage), so it survives a reload but nobody else sees it:

| Browser storage key | What it holds |
| --- | --- |
| `mono.cart.v1` | The bag |
| `mono.catalog.v1` | Admin changes to products, prices and stock (only used while the shipped catalogue is unchanged) |
| `mono.orders.v1` | Demo orders placed at checkout |
| `mono.checkout.draft.v1` (session only) | Checkout form values, so Back does not lose them |

To start again: "Reset this demo in my browser" on the About page (`/about/#demo`), or "Reset demo data" in the admin.

**This is not a real shop.** The admin has no sign-in, and anyone who opens `/admin/` can use it, but the changes only affect their own browser. A real store needs a server with sign-in and permissions, a database, server-side checks of prices and stock, and a payment provider. The shop's data layer (`site/assets/js/lib/store.js` and `cart.js`) is the one place that would change to talk to such a server.

## Put it online

The folder to publish is **`shop/site/`**. It needs no server code.

- **Cloudflare (recommended, already configured).** `shop/wrangler.jsonc` sets up a static Worker with the 404 page and trailing-slash handling. From the repository folder run `npx wrangler deploy --config shop/wrangler.jsonc` (the first time, `npx wrangler login` connects your Cloudflare account). You can also upload the contents of `shop/site/` in the Cloudflare dashboard. The `_headers` file adds caching and keeps the admin pages out of search engines.
- **Any static host.** Run `npm run shop:zip` and upload `dist/mono-shop-site.zip`. `index.html` sits at the top of the zip with `assets/` beside it. Tell the host to use `404.html` for unknown addresses.

**Before launch, set the address.** Open `shop/src/config.mjs` and put the live address in `LIVE_ADDRESS` (for example `https://mono.example.com`), or build once with `SITE_URL=https://mono.example.com npm run shop:build`. The build then writes full canonical and sharing addresses, a `sitemap.xml` and the sitemap line in `robots.txt`. Upload the site again after every build.

## Search engines (SEO)

The research behind these choices is in `docs/research/seo.md`.

- Every page has its own title and description (the build reports an error if two pages share one), a single main heading, a canonical address and sharing tags. Each product and category has its own share image (1200 x 630, made by `npm run shop:og`).
- Breadcrumbs on category and product pages, with matching structured data. The home page describes the site and the brand.
- The bag, checkout, search, admin and 404 pages are kept out of search results with `noindex`. They are not blocked in `robots.txt`, so search engines can read that instruction.
- Because the products and prices are fictional, `SEO_MODE` in `config.mjs` is `'demo'`: no product price markup is published (Google shows such prices without the "demo" label). The full product markup is built in and switches on with `SEO_MODE = 'live'`, which is only right for real products, prices and checkout.
- Photos are AVIF and WebP in four widths, with a fallback; only the first, largest image of a page loads early.

## Motion

Motion is used only where it explains something: a change of state, a change of image, or the answer to a click. It never slows shopping down. Transform and opacity only, short timings (buttons 160 ms, small changes 240 ms, drawers 300 ms, image reveals 450 ms), no parallax and no bounce, except in the home hero, where the owner asked for premium motion (below). The research behind it is in `docs/research/motion.md`.

- The home hero opens each new slide in a widening circle from the middle of the big circle, covering the old one. Inside it the picture rises into place, the brush phrase writes itself in from the left, the two small circles settle with a soft spring and the headline arrives in two beats. On a computer the picture, the phrase and the circles drift a few pixels apart as the pointer moves. On first load the main picture is never faded; it only settles. The hero moves by itself only on wide screens with a mouse, every 8 seconds, with a visible Pause button. With reduced motion switched on, none of this happens.
- Opening a product from a card grows its photo into the product page photo. This uses the browser's page-to-page transitions, in Chrome, Edge and Safari 18.2 and newer; other browsers simply load the page.
- Editorial photos fade in once as they come into view. Product cards, headings, text and buttons do not animate in.
- The bag opens with the new item highlighted, and the bag count gives a small pulse. Buttons show a short pressed, busy and done state.

With the operating system's "reduce motion" setting on, everything appears at once and nothing moves by itself.

## Change the shop

| To change | Edit | Then run |
| --- | --- | --- |
| Products, prices, sizes, stock, descriptions, categories, looks | `src/data/catalog.json` | `npm run shop:build` |
| Delivery prices, the free-delivery threshold, payment choices | `site/assets/js/lib/pricing.js` | `npm run shop:build` |
| Size guide measurements (demo figures) | `src/data/size-guide.json` | `npm run shop:build` |
| Photos | Add the original to `media/originals/` and its entry to `scripts/media.mjs` | `npm run shop:media`, `npm run shop:og`, `npm run shop:build` |
| Page layout and words | `src/templates/pages/<page>.mjs`, `site/assets/css/pages/<page>.css` | `npm run shop:build` |
| Colours, fonts, spacing, buttons | The tokens at the top of `site/assets/css/base.css` | (no build needed) |

Never edit the files in `media/originals/`; they are the untouched originals. The clothing photos are cut out of their backgrounds (in `media/cutouts/`) so every product stands on the same canvas.

## Checks

`npm run shop:check` builds the site, validates every page's HTML and runs the browser tests at desktop size (1440 x 900) and on a phone (Pixel 7). The tests cover every page and the journeys between them, from first visit to placed order and the admin.

Last full run (19 October 2026): 495 tests passed and 5 were skipped by design (phone-only and desktop-only checks), and every page's HTML validates. Lighthouse on a local build of the home page, Shop all, a category, a product, search, the bag, checkout and About: on the phone profile performance 99 to 100, accessibility 100 and best practices 100; on the desktop profile performance 100 everywhere, with the largest image drawn in 0.4 to 0.5 s, no layout shift (0.009 on search on the phone) and no blocking time. SEO scores 92 only because the canonical links are written as paths until the live address is set; with `SITE_URL` set they become full addresses, which is what that check asks for. The axe accessibility scan finds no problems on these pages on desktop or phone.

## What's in this folder

| Path | What it is |
| --- | --- |
| `site/` | **The website.** This is the folder you publish. Most of it is made by the build. |
| `site/assets/css/base.css` | Design tokens and every shared component (header, footer, buttons, cards, drawers, forms, motion). |
| `site/assets/css/pages/` | Styles for each page. |
| `site/assets/js/app.js` | Runs on every page: header, menu, search, bag drawer, quick add. |
| `site/assets/js/lib/` | Shared modules: product data and demo database (`store.js`), bag (`cart.js`), prices (`pricing.js`), page builders used by both the build and the browser. |
| `site/assets/js/pages/` | Scripts for each page. |
| `src/data/` | Product catalogue, size guide and the image list. |
| `src/templates/` | The page frame (`layout.mjs`) and one template per page type. |
| `scripts/` | `build.mjs` (writes every page), `media.mjs` (optimises photos), `og.mjs` (share images), `serve.mjs` (preview server), `shots.mjs` (screenshots), `zip.mjs` (upload zip). |
| `tests/` | Browser tests. |
| `media/` | Original photos and cut-outs. Not published. |
| `docs/` | The owner's brief, design references and research notes. `docs/BUILD-SPEC.md` describes how the code fits together. |

## Limits

- Everything a visitor does stays in their browser: no accounts, no emails, no real orders, no shared stock.
- The admin is a demonstration of the screens, not a secure back office.
- Prices, stock, delivery rates and the size guide figures are demo data.
- Every category has three products, each with its own photos (the third T-shirt, polo, watch, pair of sunglasses and accessory arrived with round 3 of `docs/photo-shotlist.md` in October 2026). Products are only added with genuinely different photos, never with a copied or recoloured one. New arrivals (the home page row, the New flag and the "New arrivals first" sort) are the six newest: the Light Blue Oxford Shirt and the round 3 products.
- The Light Blue Oxford Shirt has a front view and the library photo only. Its generated back view was not used because the model's hair does not match; `docs/photo-shotlist.md` says how to generate it again.
- Page-to-page photo transitions need a recent Chrome, Edge or Safari; elsewhere pages load normally.

## Credits

- Typefaces: [Jost](https://fonts.google.com/specimen/Jost) (400, 500, 600 and 700) everywhere, and [Alex Brush](https://fonts.google.com/specimen/Alex+Brush) for the hero's brush phrases only, both under the SIL Open Font License and served from this site.
- Photography: supplied by the owner for this demo. Clothing cut-outs made with [rembg](https://github.com/danielgatis/rembg).
