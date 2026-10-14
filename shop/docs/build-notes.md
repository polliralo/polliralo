# MONO build notes

Preparation for the shop build in `master-brief.md`. **Nothing is built yet.** The owner is choosing the design and UI direction first and will say when to start.

**Design direction (14 October 2026):** the owner chose five reference designs; the proposed combination, preview images and the points where it differs from the brief are in `design-references.md`. The photos still needed for that design, with prompts, are in `photo-shotlist.md`. In short: the hero becomes a Percival-style product slider using the studio photos (cut out, in `shop/media/cutouts/`), The owner approved this, chose US dollars, and does not want the architecture photos used unless a section needs them (decisions in `design-references.md`), so the two hero photos below are no longer planned.

## How the supplied photos fit the brief

All paths are under `shop/media/originals/`. Sizes are in pixels.

### Heroes

| Slot | Brief asks for | Best match | Notes |
| --- | --- | --- | --- |
| Desktop hero | Urban architecture, late-afternoon sun, wide, about 1920 × 900 | `wide/linen-overshirt-colonnade.png` (1810 × 869) | Right light and setting; empty colonnade on the left leaves room for words. Slightly narrower than 1920, so a wider version would look sharper on big screens. |
| Mobile hero | Separate 4:3 landscape, model beside a quiet area for text, 1080 × 810 | `wide/olive-polo-shadow-wall.png` (1448 × 1086, exactly 4:3) | Model on the right, plain dark wall on the left. A genuinely separate image, as the brief wants. |

### Shop by category (six distinct images)

| Category | Brief asks for | Best match |
| --- | --- | --- |
| Shirts | Indoor, wood, window light, collar visible | `lifestyle/blue-oxford-shirt-library.png` |
| T-Shirts | Concrete architecture, graphic shadows | **Missing.** `lifestyle/charcoal-tee-wardrobe.png` is indoors and is the better fit for the brand story. |
| Polos | Sunlit terrace | `lifestyle/olive-polo-sea-terrace.png` |
| Watches | Dark, dramatic, metal highlights | `lifestyle/black-dial-watch-wrist.png` |
| Sunglasses | Outdoor daylight, worn on a face | `lifestyle/black-sunglasses-grey-linen-shirt.png` |
| Accessories | Leather and wood still life | `lifestyle/leather-wallet-belt-cardholder-flatlay.png` |

### Homepage features

| Section | Best match |
| --- | --- |
| New Arrivals banner | `wide/cream-knit-polo-and-blue-shirt-walk.png` |
| Shirts feature | `wide/blue-linen-shirt-window.png` |
| Watches feature | `wide/black-dial-watch-desk.png` |
| Sunglasses feature | `wide/black-sunglasses-rooftop.png` |
| Accessories feature | `wide/leather-wallet-belt-cardholder-table.png` |
| Brand story | `lifestyle/charcoal-tee-wardrobe.png` |

Near-duplicate pairs: never show both on the same page, or the page repeats itself (the brief asks for photographic diversity).

- `lifestyle/black-sunglasses-chore-jacket.png` and `lifestyle/black-sunglasses-grey-linen-shirt.png`: same model, pose and wall.
- `lifestyle/black-dial-watch-wrist.png` and `wide/black-dial-watch-desk.png`: same scene.
- `lifestyle/leather-wallet-belt-cardholder-flatlay.png` and `wide/leather-wallet-belt-cardholder-table.png`: same set.

### The 12 demo products (two per category)

The supplied clean product photos give exactly two per category.

| Category | Product | Catalogue image | Extra gallery images |
| --- | --- | --- | --- |
| Shirts | Ivory Oxford shirt | `studio/ivory-oxford-shirt.png` | none |
| Shirts | Blue stripe shirt | `studio/blue-stripe-shirt.png` | none |
| T-Shirts | Charcoal textured tee | `studio/charcoal-textured-tee.png` | `lifestyle/charcoal-tee-wardrobe.png` |
| T-Shirts | Ivory heavyweight tee | `studio/ivory-heavy-tee.png` | none |
| Polos | Olive piqué polo | `studio/olive-pique-polo.png` | `lifestyle/olive-polo-sea-terrace.png` |
| Polos | Navy piqué polo | `studio/navy-pique-polo.png` | none |
| Watches | Steel watch, black dial, brown leather strap | `still-life/steel-watch-black-dial-brown-strap.png` | `lifestyle/black-dial-watch-wrist.png` |
| Watches | Steel watch, white dial, steel bracelet | `still-life/steel-watch-white-dial-bracelet.png` | none |
| Sunglasses | Black rectangular sunglasses | `still-life/black-rectangular-sunglasses.png` | `lifestyle/black-sunglasses-chore-jacket.png` |
| Sunglasses | Silver aviator sunglasses | `still-life/silver-aviator-sunglasses.png` | none |
| Accessories | Brown bifold wallet | `still-life/brown-bifold-wallet.png` | `lifestyle/leather-wallet-belt-cardholder-flatlay.png` |
| Accessories | Black leather belt | `still-life/black-leather-belt.png` | `lifestyle/leather-wallet-belt-cardholder-flatlay.png` |

The black card holder appears only in group shots, so it is left out of the first 12.

## Gaps and consistency issues

1. **T-Shirts category image** in concrete architecture with graphic shadows.
2. **Product gallery depth.** Clothing has no back view, fabric close-up or collar/cuff detail; six products have a single photo. The brief wants gallery images that "show meaningful additional information".
3. **Catalogue consistency within a category** (brief section 4). The clothing is solved: all six studio photos are cut out onto one canvas. Accessories still need the two edits in `photo-shotlist.md`:
   - Sunglasses: aviator on warm sand, rectangular on dark charcoal. They should share one surface.
   - Accessories: belt on grey stone, wallet on dark wood. Same problem.
   - Watches: steel grey and dark slate are close enough.
   - Clothing: the backdrops differed in tone, now solved by the cut-outs. The navy polo has a different model from the other five studio shots; acceptable, optional fix in `photo-shotlist.md`.
4. **Desktop hero width.** 1810 px is a little under the 1920 px the brief suggests. Only matters if the brief's photo hero is kept.
5. **Shop the look photos.** Two full-length looks of one model wearing MONO products (`photo-shotlist.md` items 3 and 5).

## Decisions to make at build time

- **Stack.** This repo's convention is plain HTML, CSS and vanilla JavaScript with no build step, checked by html-validate and Playwright. The brief needs about 20 routes, product slugs, a cart, a demo checkout and a demo admin. One option that keeps the convention: a single `products` data file plus a small script that writes a real HTML page per product and collection (good for SEO), with vanilla JS for the cart, filters and admin. Confirm with the owner before choosing.
- **Currency and demo prices.** Decided: US dollars, always labelled as demo prices.
- **Design and UI direction.** Decided: see `design-references.md`. Still waiting for the owner's go-ahead and the new photos before building.

## UX principles from the owner's research notes

The owner shared research on customer psychology, conversion and e-commerce UX. The parts that should shape this build:

- **Premium look, effortless shopping.** Animation must never stand between the customer and a product: no intro screens, no waiting for a transition before a button works, nothing important hidden behind hover (phones have no hover). Respect reduced-motion settings.
- **Answer the buyer's real questions on the product page:** what it looks like in real photos, fabric and fit, the model's height and the size they wear, the size guide, the total cost including delivery, delivery time, payment options and returns. Show only what is actually configured, and label demo information as demo.
- **Bangladesh context.** Research from Bangladesh points to product-quality worries, cash on delivery, delivery time and refund policy as the main purchase concerns, with visual flair mattering less. Shoppers also discover products through social media, so product pages must work well as landing pages from a shared link.
- **Checkout.** Show the full total and the delivery charge early; allow checkout without an account; ask only for the fields that are needed; make phone number entry easy; show a clear confirmation.
- **Speed targets (Core Web Vitals, measured on phones):** LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less.
- **No dark patterns:** no fake reviews, ratings or customer counts, no fake countdowns or "only 2 left", no hidden fees, no pre-ticked extras.
- **Later, measure:** product views, add-to-cart rate, checkout completion and finished orders. Judge design changes on this evidence, not on taste.
