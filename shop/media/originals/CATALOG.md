# Shop photo catalogue

Original photos for the MONO menswear e-commerce site. How they map to the brief: `shop/docs/build-notes.md`. These are the untouched masters: never edit them; optimised copies for the site will be generated from them.

Four kinds of photo:

- `studio/`: clothing worn by a model on a plain grey backdrop, portrait 1122 × 1402 (4:5). Use on product cards and product pages.
- `still-life/`: accessories on their own on a surface (stone, wood, steel), portrait 1122 × 1402 (4:5). Use on product cards and product pages.
- `lifestyle/`: the product worn or styled in a real setting, portrait 1122 × 1402 (4:5). Use as a second image on product pages and in editorial blocks.
- `wide/`: landscape scenes, about 16:9 (two are wider or squarer, noted below). Use for the homepage hero, collection banners and campaign strips.

Cut-outs: the studio photos (front and back views), the two looks and the library photo of the light blue Oxford also exist with the background removed (transparent PNG, same size) in `shop/media/cutouts/`, made with rembg's `birefnet-portrait` model so every model can stand on one canvas. They are derived files; the originals here stay untouched.

Refined cut-out: `cutouts/look-02.png` (the home hero's character) was rebuilt from its original in October 2026. rembg had stored the edge colours multiplied by the mask, which drew a dark outline on light grounds, and it had dropped the thin wire frame of the aviators in his hand. The edge colours now come from the original with the grey backdrop's share removed, and the frame was restored from the original where it differs from the backdrop. Nothing else changed.

Retouched copies: `shop/media/retouched/` holds cleaned copies of generated photos where something had to go. So far only `tortoiseshell-round-sunglasses.png`: the generator drew tiny pseudo-letters on the left temple plate and a few light specks on the left lens. The plate was softened to plain metal and the specks were filled in; nothing else changed. The original stays here untouched.

Prices, sizes, fabric content and stock are not known yet and must come from the client. Nothing here should be invented on the site.

## Products seen in the photos

| Product | Colour | Studio or still life | Lifestyle | Wide |
| --- | --- | --- | --- | --- |
| Oxford shirt, button-down collar | Ivory | `studio/ivory-oxford-shirt.png` | | |
| Oxford shirt, button-down collar | Light blue | | `lifestyle/blue-oxford-shirt-library.png` | |
| Striped shirt, point collar | Blue and white | `studio/blue-stripe-shirt.png` | | |
| Linen shirt, sleeves rolled | Light blue | | | `wide/blue-linen-shirt-window.png` |
| Linen shirt | Grey | | `lifestyle/black-sunglasses-grey-linen-shirt.png` | |
| Linen overshirt, chest pocket | Stone | | | `wide/linen-overshirt-colonnade.png` (1810 × 869), `wide/black-sunglasses-rooftop.png` |
| Chore jacket | Charcoal black | | `lifestyle/black-sunglasses-chore-jacket.png` | |
| Piqué polo | Olive | `studio/olive-pique-polo.png` | `lifestyle/olive-polo-sea-terrace.png` | `wide/olive-polo-shadow-wall.png` (1448 × 1086) |
| Piqué polo | Navy | `studio/navy-pique-polo.png` | | |
| Knitted polo | Cream | `studio/cream-knit-polo.png`, `studio/cream-knit-polo-back.png`, `studio/cream-knit-polo-closeup.png` | | `wide/cream-knit-polo-and-blue-shirt-walk.png` |
| Textured crew-neck T-shirt | Charcoal | `studio/charcoal-textured-tee.png` | `lifestyle/charcoal-tee-wardrobe.png` | |
| Heavyweight crew-neck T-shirt | Ivory | `studio/ivory-heavy-tee.png` | | |
| Plain crew-neck T-shirt | Navy | `studio/navy-crew-tee.png`, `studio/navy-crew-tee-back.png`, `studio/navy-crew-tee-closeup.png` | | |
| Tailored trousers | Charcoal, navy, black, stone | worn in most photos | | |
| Rectangular sunglasses | Black | `still-life/black-rectangular-sunglasses.png` | `lifestyle/black-sunglasses-chore-jacket.png`, `lifestyle/black-sunglasses-grey-linen-shirt.png` | `wide/black-sunglasses-rooftop.png` |
| Aviator sunglasses | Silver frame, dark lenses | `still-life/silver-aviator-sunglasses.png` | | |
| Round sunglasses | Tortoiseshell, dark green lenses | `still-life/tortoiseshell-round-sunglasses.png` (the site uses the retouched copy) | | |
| Dress watch, steel case, leather strap | Black dial, brown strap | `still-life/steel-watch-black-dial-brown-strap.png` | `lifestyle/black-dial-watch-wrist.png` | `wide/black-dial-watch-desk.png` |
| Dress watch, steel bracelet | White dial | `still-life/steel-watch-white-dial-bracelet.png` | | |
| Dress watch, steel case, leather strap | Navy dial, black strap | `still-life/steel-watch-navy-dial-black-strap.png` | | |
| Bifold wallet | Dark brown | `still-life/brown-bifold-wallet.png` | `lifestyle/leather-wallet-belt-cardholder-flatlay.png` | `wide/leather-wallet-belt-cardholder-table.png` |
| Leather belt, brushed steel buckle | Black | `still-life/black-leather-belt.png` | same two photos | |
| Card holder | Black | `still-life/black-card-holder.png` | same two photos | |

### The owner's polo photos (October 2026)

Two full-length lifestyle photos the owner supplied for the home hero, kept exactly as sent: `lifestyle/olive-polo-green-wall.jpg` (olive polo and charcoal trousers by an olive-green wall, 525 × 1086) and `lifestyle/cream-knit-polo-terrace-walk.jpg` (cream knit polo and navy trousers on a sunlit terrace, 474 × 1086). They are small, so the site never shows them wider than that; a larger copy of each would sharpen the hero on big screens.

### Round 3 (October 2026)

The owner generated ten photos from the shot list (`shop/docs/photo-shotlist.md`, #18 to #27): the navy crew tee and the cream knit polo (front, back and close-up each, on the same grey backdrop and model as the other studio shots), the navy-dial watch, the round tortoiseshell sunglasses and the black card holder (still lifes), and a back view of the light blue Oxford (`studio/blue-oxford-shirt-back.png`). Nine are on the site. The Oxford back view is kept here but not used: the model's hair is black and tightly curled, while the man in the library photo (the shirt's front view) has dark brown hair worn in loose waves, so the two views would not read as the same person.

## Gaps to fill

- No studio shots yet for: linen shirts, overshirt, chore jacket, trousers. The blue Oxford has a front view cut from the library photo only (its generated back view does not match that model).
- The aviator sunglasses and the white-dial watch have a still life only, with no lifestyle photo.
- Ivory Oxford, blue stripe shirt, navy polo and ivory tee have a studio shot only, with no lifestyle photo.
- The models change between photos, which is fine for a shop but worth keeping in mind for the homepage, where one face across the hero and banners reads as a stronger brand.
