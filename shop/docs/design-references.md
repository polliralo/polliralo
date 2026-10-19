# MONO design references and direction

UI and UX references the owner likes, what each one brings, and the combination MONO is built on. **The shop is now built** (see `../README.md`); the notes below record how the design was chosen.

## Sources

Pinterest pins sent on 14 October 2026 (the cloud session cannot open Pinterest, so the owner sent the pin videos instead):

1. https://pin.it/6ZjOWsoG3
2. https://pin.it/58FNJeb02
3. https://pin.it/4RrvjQNKB
4. https://pin.it/1MOU9JCmE
5. https://pin.it/5BlHsEIea
6. https://pin.it/2G32XC62K
7. https://pin.it/4dG454U0M

Five videos arrived. Each is studied below; the numbering here follows the videos, not the links. If two of the links were different designs, they still need screenshots.

## What each reference brings

### A. Percival product slider (menswear jackets)

A light grey canvas, one model cut out on it, a huge faint serif category word ("Over Jackets") behind him, sizes stacked vertically on the left with the chosen one circled, four angle thumbnails on the right, a short details block (eyebrow, name, two lines, price), and a bar at the bottom in the product's own colour showing "01 — 03" and the next product's name. Arrows move to the next product; the model slides out and the next slides in.

- **Keep:** the whole product-led hero, the faint giant word, the vertical size picker, the angle thumbnails, the product-coloured bar.
- **Leave:** nothing; it needs a phone version (see "Phone").

### B. "Fashion." pastel women's landing page

Lime canvas, a rounded headline, two cut-out models, a floating mini product card, a "Hottest picks" product row, a three-column product spotlight (name and story | big photo | price, size chips, colour swatches, add to cart) with "complete the look" mini cards, customer reviews, newsletter and footer.

- **Keep:** the three-column spotlight, "complete the look", size chips and colour swatches, the product row rhythm, newsletter plus footer structure.
- **Leave:** lime and lilac colours, doodles and sparkles, playful rounded type, the customer reviews (MONO has no real reviews, and fake ones are not allowed).

### C. "Tied green V-neck shirt" product view

Condensed uppercase product name, a "+" on the hero product that opens its details, size chips with a "Size guide" link beside them, four angle thumbnails that swap the big photo, a round "Add" button, a vertical "01 / 05" counter, the next collection peeking in from the right.

- **Keep:** thumbnails that swap the main photo, size chips with the guide link, the quick "+" to open details, the counter.
- **Leave:** the red round button, the "Sale" link, squiggles, the dated "Summer 2020" vertical label.

### D. Marc Jacobs runway lookbook

A line-up of models with the front one sharp and the rest softly blurred, "LOOK 16" with a "Shop the look" link, and a side panel listing every item in that look (photo, name, price, wishlist heart, quick add). Pointing at another model brings that look into focus and swaps the panel. Two-row header with wide-spaced small capitals.

- **Keep:** "Shop the look" with the item panel, "LOOK 01" numbering, switching between looks, the calm wide-spaced capitals.
- **Leave:** the long blurred line-up (it needs many full-length cut-outs and is heavy on phones); two looks with a simple switch give the same idea.

### E. Percival editorial carousel (bronze jacket)

One product told through several photos of it at different sizes (full length, a big close crop from behind, a back view), a giant serif name layered behind and in front of the photos, a details block, an olive bar with the count, and an "Autumn Sale" panel.

- **Keep:** one product through several angles, the layered serif name, the olive accent.
- **Leave:** the sale panel (no invented promotions).

## The combination (proposed)

**Percival is the base (A + E):** a light warm canvas, models cut out and standing on it, a giant faint Bodoni word behind them, clean sans product names, and an accent bar in each product's own colour. **Marc Jacobs (D)** sets the header and the small wide-spaced capitals and gives the "Shop the look" section. **B and C** give the shopping controls: thumbnails that swap the photo, size chips with a size guide link, colour swatches and "complete the look".

Preview images (built from the real photos, not the website; prices in dollars): `preview/1-home-first-screen.jpg`, `preview/2-home-categories-and-new-arrivals.jpg`, `preview/3-shop-the-look.jpg`, `preview/4-product-page.jpg`, `preview/5-home-phone.jpg`.

### Homepage, top to bottom

1. Thin announcement bar: "Demo store · prices are for illustration only".
2. Header: MONO wordmark left, the six categories centre, Search and Bag right.
3. **Hero: featured product slider (A).** One slide per clothing product (six). Canvas, giant category word, cut-out model, vertical sizes with a size guide link, details block (eyebrow, name, one line, price with a demo tag, Add to bag, View details), angle thumbnails on the right, the product-coloured bar with "01 / 06" and the next product's name, arrows. As built: it moves on every 7 seconds with a visible Pause button (the owner asked for the most premium motion), stops for good once someone uses it, pauses on hover, focus and a hidden tab, and never moves by itself with reduced motion. Swipe and arrow keys work.
4. Shop by category: six lifestyle photos, labels under the photos (never on them).
5. New arrivals: product cards. Clothing is shown as cut-outs on the canvas, so every card matches; accessories use their still lifes.
6. **Shop the look (D):** a full-length look photo, "LOOK 01 / LOOK 02" switch, and the item panel. Needs new photos.
7. Watches spotlight (B's three columns on a dark ground): story | wrist photo | buy panel with "complete the look" (wallet, belt).
8. Short, honest brand note.
9. Demo newsletter and footer.

### Product page

Angle thumbnails on the left (A, C), the big cut-out on the canvas with the faint serif word behind (A, E), and the buy panel on the right (B, C): eyebrow, name, price with a demo tag, one-line description, colour swatches, size chips with "Size guide", quantity, Add to bag, "Demo checkout. No payment is taken.", "Complete the look", then "Details & care" and "Delivery & returns". Related products below.

### Phone

- Hero about 336 px tall: the cut-out stands on the right, the giant word behind him, name, price and "Shop now" on the left, and the count bar. Swipe between products. This meets the brief's compact mobile hero rule.
- Shop by category comes straight after, as a sideways row.
- Two-column product grid.
- Product page: swipeable photos with dots and a sticky Add to bag bar.

### Design tokens

- **Type:** Bodoni Moda (display: the giant words and section titles) with Jost (everything else: navigation, product names, prices, labels, buttons). This is the "Luxury Minimalist" pairing from the ui-ux-pro-max typography data, and it matches the references: a Didone serif like Percival's and a geometric sans for Marc Jacobs-style capitals.
- **Colour:** page ivory `#F5F2EC`, canvas `#E9E4DD`, giant word `#DDD5C9`, ink `#1C1C1A`, muted text `#5F5A52`, border `#DDD7CE`, brand accent muted olive `#5C5F45`. Each product also has its own accent for the slider bar (olive `#5C5F45`, navy `#1F2A3F`, charcoal `#3A3A38`, and so on).
- **Style:** minimal grid, square corners, no shadows, no decorations.
- **Motion:** as built, slides cross-fade over about 0.9 s with the cut-out settling into place; the slider is the only thing that moves on its own (with a Pause button); small hover changes; reduced motion respected. Details in `research/motion.md`.

## Photo handling

The six studio photos had different backdrops, from light cool grey (`#C8C9CB`) to darker warm grey (`#96908B`), so they could not sit side by side or on one canvas. They have been cut out (background removed) with rembg's `birefnet-portrait` model, run locally and free; the edges, hair included, are clean. The cut-outs are in `shop/media/cutouts/`; the originals are untouched.

## Owner decisions (14 October 2026)

These replace the master brief where they differ.

1. **Hero: approved as proposed.** The hero is the product slider, not the brief's urban-architecture photo hero. The architecture photos (`wide/linen-overshirt-colonnade.png`, `wide/black-sunglasses-rooftop.png`, `wide/cream-knit-polo-and-blue-shirt-walk.png`) are not used unless a section genuinely needs them; the editorial strip that used them is dropped.
2. **Fonts: approved.** Bodoni Moda and Jost (Nivara keeps Cormorant Garamond and Manrope).
3. **Currency: US dollars.** Demo prices in the previews: polos $48, Oxford and striped shirts $64, tees $32, black-dial watch $180, black sunglasses $58. All prices stay labelled as demo prices.

## Owner decisions, refinement round (October 2026)

The owner's refinement brief, its "Final design decision addendum" and the "Final typography direction" replace the decisions above where they differ. What was audited, changed and verified is in `refinement-2026-10.md`.

1. **Hero: three art-directed slides, one message each.** A brand slide on the canvas ("Less noise. Better essentials.", clothing cut-outs at two scales, the only ghost word on the site), then "The everyday uniform." (T-shirts) and "Made for daylight." (sunglasses). No sizes, thumbnails, price panel or spec block in the hero; the call to action stays in the same place on every slide. It moves on every 8 seconds on wide screens with a pointer, with Pause, Previous and Next; never on phones and never with reduced motion. The phone hero has its own compact layout. The sunglasses slide uses `wide/black-sunglasses-rooftop.png`: the home page needed a sunglasses photo that appears nowhere else on it (the photo variety rule); the other architecture photos stay unused.
2. **Typography: Jost only, sans-led.** Modern, bold and contemporary: hero 700, headings 600, product names 500 to 600, body 400, small spaced capitals for labels only. Bodoni Moda is retired; an `em` in a heading is set in olive instead of italics. The existing font was kept because it fits; no new family was added.
3. **Ghost words only in the home hero.** Not on the product page, collections, content pages, the admin or the footer, and never over a product. (Since the hero refinement below there are none at all.)
4. **Motion only where it explains something:** a state change, an image transition or an interaction. Transform and opacity only, short timings (buttons 160 ms, small changes 240 ms, drawers 300 ms, reveals 450 ms, hero 600 ms), no parallax or bounce, nothing that delays a click or a page load. Product cards, headings, text and buttons do not animate in.
5. **Three products per category only with genuinely different photos.** Shirts got its third first (the Light Blue Oxford Shirt, cut out of the library photo); the other five categories got theirs when the owner generated the round 3 photos in `photo-shotlist.md` (19 October 2026). No duplicated or recoloured photos. Collection pages fill an incomplete last row with an editorial photo tile, never with a fake product.
6. **One button system.** Charcoal primary (48 px, 52 px on phones), outlined secondary, text links; every state designed (hover, focus, pressed, disabled, busy, done, error). No colour changes between pages. (Superseded by the white refresh below: every button is now a black pill in sentence case.)
7. **Cart and checkout stay plain.** No art direction, no prefilled realistic details, delivery dates labelled as demo estimates.

## Owner decisions, hero refinement and white refresh (19 October 2026)

The owner asked first to refine only the home hero, from two interface references (a product page with a black pill "Add to cart", filled pill size boxes and rounded photo frames, and a grid of rounded product cards) and four photos of the shop's own models. After seeing it, they asked for no green in the hero, the character on white, white everywhere on the site, every picture rounded, and the reference's button and size box style.

1. **The owner's character.** Both supplied PNGs are the look photos already in `media/originals/looks/` (pixel for pixel), and neither is transparent, so the hero uses the transparent cut-out of the same file, whole and at its own proportions. It is Look 02 (ivory Oxford, charcoal trousers, aviators in hand): Shop the Look opens on Look 01, so this keeps any photo from showing twice, and the dark trousers anchor the figure on white. Look 01 is a one-line swap (`HERO_SLIDES` in `assets/js/pages/home-view.js`).
2. **White everywhere.** The page, the header, the panels and the hero are white. One soft warm surface (`--canvas`, #F3F2EE) sits behind product pictures so ivory and cream clothes still read, and the newsletter band uses it too. The dark watch feature and the dark footer stay as the one deep contrast: black and white with the olive accent. The first proposal's lime glow behind the character was removed at the owner's request; he stands on plain white with only a faint shadow at his feet.
3. **Every picture rounded:** 20 px for large pictures and panels (hero photos, product gallery, Shop the Look, the watch photo, content pages), 16 px for product cards, category tiles and boxes, 12 px for thumbnails, inputs and notices, 8 px for the smallest pictures (16, 14 and 10 px on phones). On phones the product gallery keeps the page margins so its corners show.
4. **Buttons and size boxes from the product page reference.** Every button is a black pill in sentence case (outlined pills for secondary actions, filter triggers, the look switch and small add buttons). Size boxes are soft filled pills, the chosen one black, sold-out ones pale with a fine strike. Product details sit in rounded boxes. Inputs have 12 px corners and the search field is a pill.
5. **Nothing behind or over the character.** The faint MONO word was removed, so the site has no ghost words now (the share cards still draw one).
6. **Kept:** the three hero messages, Jost bold headings with the olive second line, the uppercase navigation and small labels, the layouts, the timings and the autoplay rules.

## Owner decisions, fuller hero (19 October 2026)

After the white refresh the owner found the hero character too small and the hero too empty. They asked for five or six hero images with the best first, larger characters, everything matching, and Claude's own judgement throughout. They then asked to keep their two polo photos and the Look 01 photo in the hero, and for a stylish background behind the characters instead of a plain box.

1. **Six slides, best first:**
   - the brand message with the owner's Look 02 model;
   - polos, with the owner's two full-length polo photos (olive by a green wall, cream on a sunlit terrace) side by side;
   - sunglasses, with the Look 01 model in black rectangular sunglasses;
   - shirts (blue stripe shirt);
   - T-shirts (charcoal textured tee);
   - accessories (the wallet, belt and card holder on a wood table).

   One message per slide, as before.
2. **Large characters on a studio wall.** Every model fills the height of the hero's rounded panel and stands in front of a warm sand wall, lighter behind him, with MONO set large across it in white. The word is decoration, always behind him (drawn from `data-word`, hidden from screen readers); nothing is drawn over him. It is the hero's only large word, as in the first refinement round. The studio views are framed from the head to mid-thigh; the full-length look photos are shown from the head to just above the knee, with the hands and the aviators inside the frame. Proportions never change.
3. **The look photos may repeat.** Both look photos now appear in the hero and in Shop the Look (where their pieces are bought), by the owner's choice. No other photo appears twice on the home page.
4. **Phones:** the picture sits large above the words (about 400 px tall at 390 px wide), the call to action is a full-width pill below it, and the control bar closes the hero. The categories still start on the first screen.
5. **Matching blocks:** the dark watch feature, the newsletter and the About page's dark section are now rounded panels inside the page margins, like every other picture block. The footer stays full width.

## Owner decisions, cream hero (19 October 2026)

After the site preview the owner asked to drop the T-shirt slide, to show one character on the polo slide on the same background as the others, and to make the backgrounds lighter and more beautiful in cream. They pointed to a "Stay Foolish" fashion reference: no MONO word and no boxed background, stylish script writing behind the character, and circles. They also asked for the best, most premium animation.

1. **Five slides, best first:**
   - the brand message with the owner's Look 02 model;
   - polos, with one walking model cut from the owner's terrace photo (`cutouts/cream-polo-walk.png`, full length at the looks' scale);
   - sunglasses, with the Look 01 model;
   - shirts (blue stripe shirt);
   - accessories, a belt and wallet still life cut from their product photos.

   The T-shirt slide is gone, and the olive wall photo is no longer shown.
2. **Cream stage, no box.** The hero is light cream (#F7F1E8) from edge to edge. Each picture stands in front of a large, soft sand circle (#ECDDC7, lighter at its top left), with two small circles beside it as in the reference. There is no rounded panel, no studio wall and no MONO word. The hero's bottom edge cuts the full-length figures at the knee. On phones the stage is a full-width cream band above the words, which sit on white.
3. **Brush phrase.** A two-word phrase in Alex Brush, warm caramel (#B98C5B) and tilted slightly, sits behind the model at head height. His head falls in the gap between the two words, so both stay readable:
   - "Modern classics"
   - "Off duty"
   - "Golden hour"
   - "Sharp lines"
   - "Fine details" (above the still life)

   Alex Brush is the one exception to Jost on the site. The phrase is decoration only: it is drawn from data attributes and hidden from screen readers. Nothing is drawn over a picture.
4. **Premium motion.**
   - A new slide opens in a widening circle from the middle of the big circle and covers the old one.
   - Inside it, the picture rises into place, the phrase writes itself in from the left, the small circles settle with a soft spring, and the headline arrives in two beats with a short blur.
   - On a computer, the picture, the phrase and the circles drift a few pixels apart with the pointer.
   - The first screen never fades the main picture; it only settles.
   - None of this runs under reduced motion.
