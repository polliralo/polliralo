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
