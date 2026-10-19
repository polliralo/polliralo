# MONO refinement round (October 2026)

The owner asked for a refinement of the finished demo, not a rebuild: a calmer, more modern visual identity, a lighter hero, three products per category only where real photos allow, and motion that never slows shopping down. This file records the audit, the decisions, what changed and how it was checked. The decisions themselves are summarised in `design-references.md` ("Owner decisions, refinement round").

Before screenshots: `shop/.qa/before/` (local only, not in Git). After screenshots: `shop/.qa/after/`.

## 1. Audit of the site before this round

### What already worked

- Every shopping function worked end to end: filters, search, product pages, bag, a validated checkout with a demo payment, demo orders and the admin. 396 browser tests passed on desktop and phone.
- Honest demo labelling: demo price tags, a demo banner, the footer disclosure, no reviews, no scarcity lines.
- One consistent product look: the clothing photos are cut out onto one canvas, so cards and galleries match.
- Fast and accessible: Lighthouse performance 98 to 100 and accessibility 97 to 100 on a phone profile; no sideways scroll at 390 and 1440 px.

### What did not

- The hero did too much at once: a brand line and a product message on the same slide, a size column, angle thumbnails, a price and add panel, a product-coloured bar and a giant serif word, six slides in all. On phones the brand line ran into the giant word.
- Giant ghost words were everywhere (collection heads, behind the product photo on the product page, content pages, the admin, a huge MONO in the footer), so headings competed with decoration and the product.
- Thin categories: two products in a four-column grid left half of every row empty, and the category head was tall enough to push the first products to the bottom of the first screen.
- Too much motion: cards, headings and text blocks rose in on scroll, the product page's buy panel staggered in on load, admin tiles rose one by one, and the base durations ran from 200 to 1100 ms.
- The same photos repeated on the home page (the wrist watch photo three times, the grey linen shirt photo twice), and the thin italic serif read small and dated next to the owner's new "modern, bold" direction.
- Smaller things: uppercase tracked breadcrumbs were hard to read; the phone announcement did not fit on one line at 320 px; "More in Shirts" on the product page was padded with T-shirts; delivery dates in the bag and checkout read like promises; the footer said MONO twice.

### The five highest-impact problems

1. **The hero:** too many elements and two messages per slide, with a text collision on phones.
2. **Ghost words and type:** decorative giant words competing with content everywhere, and a serif-led system that no longer matched the brief.
3. **Thin, tall category pages:** empty grid slots and products starting too low.
4. **Motion that slowed browsing:** entrance animations on everything, with long timings.
5. **Repeated photos:** the same images more than once on the home page.

### Priorities (the brief's order)

Visual identity, then the responsive home and category pages, product cards and the product page, button states, motion, cart and checkout, and finally performance, accessibility and QA.

## 2. Reference audit

The five reference videos, as numbered in the brief:

| Reference | Keep | Borrow | Do not copy |
| --- | --- | --- | --- |
| **Ref 1**, Percival "Vincent Button" (one jacket at several scales) | One product told at more than one scale on a light canvas; generous space; the olive bar | The two-scale cut-out composition for the hero's brand slide | The "Autumn Sale" promo panel, the giant serif name crossing the product, the serif type |
| **Ref 2**, "Tied Green V-Neck Shirt" product view | A clear buying order: name, price, size, angles, add | A bold sans product name at display size; the angle thumbnail strip (on the product page) | The doodles and squiggles, cards floating over the photo, the round red add button, the lime and purple colours |
| **Ref 3**, "Modern Women Cloth" shop | The confident sans headline and a tidy product row | The scale and weight of the sans display type | The lime palette, the "Loved by our customers" review block (no invented reviews), the promo-style community banner |
| **Ref 4**, Marc Jacobs lookbook | A look with its pieces listed beside it; small spaced capitals; white space | "Shop the look" with LOOK 01 / LOOK 02 and the item panel | The blurred crowd of models (no such photos), heart icons (no wishlist in this demo) |
| **Ref 5**, Percival product slider | Cut-out models on one canvas; a counter with Previous and Next | The control bar idea for the hero | Sizes and thumbnails inside the hero (they belong on the product page), the giant serif category word behind the model |

## 3. What changed

### Visual identity

- **Type:** Jost only, sans-led and bold. Hero headings 700, section headings and the product page title 600, product names 500, body 400. Bodoni Moda was retired and its files removed; an `em` in a heading is set in olive instead of italics. Breadcrumbs, accordion titles and text links are in sentence case. Share cards (`npm run shop:og`) were redrawn in Jost.
- **Ghost words:** removed from collection heads, the product page, content pages, the 404 page, search, the admin and the footer. The only one left is the faint, widely spaced "MONO" behind the clothing on the hero's brand slide.
- **Buttons:** one system. Charcoal primary at 48 px (52 px on phones), outlined secondary, text links, size chips and pills, with hover, focus, pressed, disabled, busy (spinner), done and error states.

### Home

- **Hero:**
  - Three slides, each with one message:
    - "Less noise. Better essentials." with the navy polo front and back at two sizes;
    - "The everyday uniform." for T-shirts;
    - "Made for daylight." for sunglasses.
  - No sizes, thumbnails, prices or add buttons in the hero, and the call to action never moves.
  - A 600 ms cross-fade. Autoplay every 8 s only on wide screens with a mouse, with Pause; never on phones or with reduced motion.
  - Phone hero 352 px tall at 390 px wide and 324 px at 320 px.
- **No photo appears twice on the page:**
  - The watch feature now shows the White Dial Watch.
  - The sunglasses and accessories strip was removed, because both of its photos repeated scenes already on the page.
  - New arrivals cards no longer swap to lifestyle photos on hover.
- **Phone page:** about 5,500 px long instead of about 8,000. New arrivals is a swipe row.

### Collections and search

- **Short heads:** breadcrumb, title, one line and the count. The first products now start on the first screen: the top of the first card is at 375 px on a category page and 447 px on Shop all at 1440 × 900, and at about 380 to 400 px on phones.
- **Grid:** three columns from 1000 px, two below.
- **Editorial tile:** an incomplete last row ends with a tile that spans exactly the empty slots. It is recomputed after every filter and hidden when the row is full. Its photo appears nowhere else on that page, and it links to Shop the Look, the size guide or a related category. It never shows a price or an add button.
- **Motion:** the sort and filter glide is 280 ms at most and is off with reduced motion.

### Product page

- **Order:** gallery, category, name (now 600), price with the demo tag, description, colour, size with the size guide, quantity, Add to bag, notes, details.
- **No entrance motion:** the buy panel no longer staggers in, and the faint word behind the photo is gone.
- **Honest heading:** "More in Shirts" appears only when every card in the row is a shirt; otherwise the heading is "You may also like".
- **Buttons:** Add to bag is 50 px on desktop and 52 px on phones, as is the phone sticky bar's button.

### Catalogue

- **Light Blue Oxford Shirt added**, cut out of the only photo of it, so Shirts has three products.
- **No other category had a genuinely different third product in the photos.** They stayed at two, and `photo-shotlist.md` (round 3) listed the photos needed, with file names and prompts.
- **Update, 19 October 2026:** the owner generated the round 3 photos, so every category now has three products: the Navy Crew Tee, the Cream Knit Polo, the Navy Dial Watch, the Tortoiseshell Round Sunglasses and the Black Card Holder. New arrivals are now the six newest products. With three per category, the editorial tile is hidden on desktop (the row is full) and fills the last slot on phones.

### Motion

- **Timings:** buttons 160 ms, small changes 240 ms, drawers 300 ms, reveals 450 ms, hero 600 ms.
- **What still moves:** editorial photos reveal once. Product cards, headings, text blocks and buttons do not animate in, and the admin tiles and order page no longer stagger. The order page keeps only the drawn tick.

### Phones, the bag and checkout

- **Announcement:** one sentence-case line on phones that fits at 320 px with "How it works". The short line is used below 900 px.
- **Header:** 44 px icon buttons, and the bag count is a badge, hidden when the bag is empty.
- **Breadcrumbs:** stay on one line, with the current page shortened by an ellipsis.
- **Delivery dates:** in the bag and checkout they read "Demo estimate". Product page delivery times are labelled as demo. Nothing is filled in for the shopper.
- **Layout shift:** the bag, checkout, search and admin no longer shift. `main` is at least one screen tall, so the footer never jumps when JavaScript draws those pages.
- **First images:** the first row of a product grid loads at once, with one high-priority image per page.

## 4. How it was checked

- **Tests:** `npx playwright test -c playwright.shop.config.mjs` passed 465 tests on desktop (1440 × 900) and a phone (Pixel 7). 3 were skipped by design: they are phone-only or desktop-only. New tests cover:
  - the hero's slide count, the call to action keeping its place, autoplay rules and phone height;
  - no repeated photos on the home page;
  - the collection tile at each column count, after filters, and with no repeated photos;
  - the first products on the first screen;
  - catalogue-driven counts everywhere.
- **HTML:** `html-validate` is clean on every built page.
- **Accessibility:** axe on the home page, Shop all, a category, a product, search, the bag and checkout, on desktop and phone. No findings.
  - Two earlier findings were false: `content-visibility` hid the dark footer and the dark watch section from the contrast check. Both sections now render normally.
- **Lighthouse** (local build, 19 October 2026). SEO is 92 on indexable pages only because canonical links are paths until `SITE_URL` is set. Utility pages score 63 for SEO by design, because they are `noindex`.

  | Page | Phone: perf / a11y / best practices | Phone LCP, CLS | Desktop perf | Desktop LCP |
  | --- | --- | --- | --- | --- |
  | Home | 99 / 100 / 100 | 1.8 s, 0 | 100 | 0.5 s |
  | Shop all | 99 / 100 / 100 | 2.0 s, 0 | 100 | 0.5 s |
  | Polos | 99 / 100 / 100 | 1.8 s, 0 | 100 | 0.4 s |
  | Olive Piqué Polo | 99 / 100 / 100 | 1.9 s, 0 | 100 | 0.5 s |
  | Search "olive" | 100 / 100 / 100 | 1.7 s, 0.009 | 100 | 0.4 s |
  | Bag | 99 / 100 / 100 | 1.9 s, 0 | 100 | 0.5 s |
  | Checkout | 100 / 100 / 100 | 1.7 s, 0 | 100 | 0.4 s |
  | About | 100 / 100 / 100 | 1.8 s, 0 | 100 | 0.4 s |

  Total blocking time was 0 ms everywhere, and desktop layout shift was 0 on every page.
- **Widths:** screenshots of the home page, Shop all, Polos, a product, the bag, checkout and the admin at 320, 360, 390, 430, 768, 1024, 1280 and 1440 px. None had sideways scroll, console errors or failed requests.
- **Before and after sheets** for the same pages at 1440 and 390 px are in `shop/.qa/compare/` (local only).

## 5. What is left

- **Light Blue Oxford Shirt:** it has a front view and the library photo only. The generated back view (#27) was not used because the model's hair does not match; `photo-shotlist.md` says how to generate it again.
- **Page-to-page photo morph:** the morph from a card into the product page works in Chrome, Edge and Safari 18.2 and newer. In automated headless Chrome it does not always run when going forward, so the page simply loads. That is a fallback, not an error.
- **Before launch with real products:** set `LIVE_ADDRESS` or `SITE_URL`. A real store also needs a server: sign-in for the admin, a database, server-side checks of prices and stock, and a payment provider. This demo keeps everything in the visitor's browser.
