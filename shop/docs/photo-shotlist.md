# MONO photo shot list

Owner-facing version with every prompt filled in, reference thumbnails, copy buttons and done ticks: https://claude.ai/artifact/2Vh7M2vsNhRzaGX4zL2c4V (round 3 is at the top as #18 to #27; the first 17 shots, all done, are folded away below it).

The new photos the chosen design needs (see `design-references.md`), in priority order, each with the reference photo to upload and a prompt to paste. The owner generates them in any image tool that accepts reference photos (in Higgsfield, FLUX 3 and GPT Image 2.5 both do; the Gemini and ChatGPT apps do too).

## Rules for every photo

- Upload the reference photo(s) named in each item. They are the owner's own photos; paths below are where they live in this repo.
- Portrait 4:5 unless noted, at the highest resolution the tool offers.
- Check every result before sending it: same face and hair, same garment colour, same buttons and collar, correct product details, no logos, letters or watermarks, natural hands.
- No background removal is needed: Claude cuts the models out and matches the backgrounds at build time.
- Send the results in the chat and say which item each one is.

Already solved without new photos: the six studio photos had mismatched backdrops; they are cut out and now sit on one canvas (`shop/media/cutouts/`).

## Priority 1: needed to start building

### 1. Back views (6 photos)

Used in the hero thumbnails and the product page gallery. One per clothing product. Upload that product's studio photo:

| Product | Upload | `[GARMENT]` |
| --- | --- | --- |
| Ivory Oxford shirt | `studio/ivory-oxford-shirt.png` | ivory button-down Oxford shirt |
| Blue stripe shirt | `studio/blue-stripe-shirt.png` | light blue and white striped shirt |
| Charcoal textured tee | `studio/charcoal-textured-tee.png` | charcoal textured crew-neck T-shirt |
| Ivory heavyweight tee | `studio/ivory-heavy-tee.png` | ivory heavyweight crew-neck T-shirt |
| Olive piqué polo | `studio/olive-pique-polo.png` | olive piqué polo shirt |
| Navy piqué polo | `studio/navy-pique-polo.png` | navy piqué polo shirt |

```
Use the uploaded photo as the exact reference. Same young man, same [GARMENT], same trousers, same plain grey studio background, same soft even light, same framing from head to mid-thigh. He has turned around and stands relaxed with his back to the camera, head turned very slightly to one side, arms loose by his sides, so the whole back of the [GARMENT] is visible. Keep the colour, fabric texture, fit and length of the [GARMENT] exactly as in the reference. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 2. T-shirt category photo (1 photo)

The only category without a photo. Upload `studio/ivory-heavy-tee.png`.

```
Use the uploaded photo as the reference for the man and the T-shirt. The same young man with dark curly hair and light stubble, in the same plain ivory heavyweight crew-neck T-shirt and dark charcoal tailored trousers, leans one shoulder against a wall of raw board-formed concrete in a modern building, hands in his pockets, relaxed, looking slightly away from the camera. Strong late-morning sun throws crisp diagonal shadows across the concrete and across his T-shirt. Natural, muted colour: warm grey concrete, ivory, charcoal. Editorial menswear campaign photo, natural skin texture, 50 mm lens at eye level, framed from head to knees, portrait 4:5. No text, no logos, no lettering, no brand marks on the clothes.
```

### 3. Look 01 (1 photo)

The "Shop the look" photo. Upload three photos in this order: `studio/olive-pique-polo.png`, `still-life/black-rectangular-sunglasses.png`, `still-life/steel-watch-black-dial-brown-strap.png`.

```
Use the first uploaded photo for the man and the olive polo, the second for the sunglasses and the third for the watch; copy all three exactly. Full-length fashion lookbook photo of the same young man, standing relaxed and facing the camera, wearing the same olive piqué polo shirt, light stone-coloured tailored trousers and plain white leather sneakers, the black rectangular sunglasses on his face, and the steel watch with the black dial and brown leather strap on his left wrist, clearly visible. Plain seamless light warm-grey studio background, soft even light, a soft shadow at his feet, the whole body from head to shoes with some space above the head and below the feet. Photorealistic, portrait 4:5. No text, no logos, no lettering anywhere.
```

## Priority 2: soon after

### 4. Close-ups (6 photos)

The detail shot in each gallery. Upload the same studio photo as in item 1.

| Product | `[DETAIL]` |
| --- | --- |
| Ivory Oxford shirt | the button-down collar, its small collar buttons and the Oxford weave of the fabric |
| Blue stripe shirt | the point collar, the top buttons and the fine blue and white stripes |
| Charcoal textured tee | the crew neckline and the tonal texture pattern of the fabric |
| Ivory heavyweight tee | the ribbed crew neckline and the surface of the cotton |
| Olive piqué polo | the collar, the two-button placket and the piqué knit texture |
| Navy piqué polo | the collar, the two-button placket and the piqué knit texture |

```
Use the uploaded photo as the exact reference. A close-up detail photo of the same [GARMENT] on the same young man: crop from just below the nose to the middle of the chest, showing [DETAIL] in sharp focus. Same colour, same buttons, same fabric, same soft studio light, same plain grey background. Photorealistic e-commerce detail photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 5. Look 02 (1 photo)

The second look, so "Look 01 / Look 02" can switch. Upload four photos in this order: `studio/ivory-oxford-shirt.png`, `still-life/black-leather-belt.png`, `still-life/steel-watch-white-dial-bracelet.png`, `still-life/silver-aviator-sunglasses.png`.

```
Use the first uploaded photo for the man and the ivory Oxford shirt, the second for the belt, the third for the watch and the fourth for the sunglasses; copy each exactly. Full-length fashion lookbook photo of the same young man, standing relaxed, wearing the same ivory button-down Oxford shirt tucked into dark charcoal tailored trousers with the black leather belt and its brushed steel buckle, plain dark brown leather shoes, the steel watch with the white dial and steel bracelet on his left wrist, and the silver aviator sunglasses held in his right hand. Plain seamless light warm-grey studio background, soft even light, a soft shadow at his feet, whole body visible from head to shoes. Photorealistic, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 6. Matching surfaces for accessories (2 edits)

So the two products in each accessory category look alike side by side.

Aviator: upload `still-life/silver-aviator-sunglasses.png` (the photo to edit), then `still-life/black-rectangular-sunglasses.png` (the background to copy).

```
Edit the first uploaded photo. Keep the silver aviator sunglasses exactly as they are: same shape, metal frame, dark lenses, reflections, size, angle and position. Replace only the sandy surface and background with the matte charcoal-grey surface and soft dark gradient background of the second photo, with the same soft overhead light and a gentle reflection under the frame. Portrait 4:5. No text, no logos, no lettering anywhere.
```

Belt: upload `still-life/black-leather-belt.png` (to edit), then `still-life/brown-bifold-wallet.png` (the surface to copy).

```
Edit the first uploaded photo. Keep the black leather belt exactly as it is: same leather grain, stitching, brushed steel buckle, coil shape, size, angle and position. Replace only the grey stone surface with the warm dark walnut wood surface of the second photo, lit by the same soft diagonal window light with a gentle shadow. Portrait 4:5. No text, no logos, no lettering anywhere.
```

## Priority 3: optional

- **Side views** (up to 6): same as item 1, but "He turns 45 degrees to his left, showing the side seam, the sleeve and the collar from the side."
- **Navy polo on the main model.** The navy polo is worn by a different man from the other five. Upload `studio/navy-pique-polo.png`, then `studio/olive-pique-polo.png`: "Keep the first photo exactly: the navy polo, trousers, pose, background and light. Replace only the man with the man from the second photo, same face, hair and skin tone. No text, no logos."
- **Lifestyle photos** for products that have only one photo (ivory Oxford, blue stripe, ivory tee, navy polo, white-dial watch, aviators), in the same world as the existing lifestyle photos: daylight, real places, warm neutral colour.
- **Card holder still life**, only if the card holder becomes a product (it appears only in group shots now).

## Round 3: a third product in every category (October 2026)

**Status (19 October 2026): done.** The owner generated all ten photos. #18 to #26 are on the site, so every category now has three products: the Navy Crew Tee, the Cream Knit Polo, the Navy Dial Watch, the Tortoiseshell Round Sunglasses and the Black Card Holder. The sunglasses use a retouched copy (tiny pseudo-letters on the temple plate removed; see `media/originals/CATALOG.md`). #27, the light blue Oxford back view, is stored but not used: the model's hair is black and tightly curled, while the man in the library photo has dark brown hair in loose waves. To use it, generate it again with "dark brown hair worn in loose waves, swept back, exactly like the first reference" added to the prompt.

The owner asked for three distinct products per category, but only with photos that really show a different product: no duplicate or recoloured copies of an existing photo. The photos in `media/originals/` were checked one by one:

- **Shirts** has its third product: the Light Blue Oxford Shirt, cut out of `lifestyle/blue-oxford-shirt-library.png`, the only photo of it (so it has a front view and the library photo, no back view yet).
- **Every other category** has no third product in the photos. The cream knitted polo, the linen overshirt, the chore jacket and the card holder only appear in wide or group shots, too small or shared with other pieces to make a clean product photo. So those categories stay at two products, and the collection pages fill the last row with an editorial tile instead of a fake product.

Higgsfield note (19 October 2026): on the free Higgsfield plan no image model runs from the MCP connection ("Requires basic plan or higher"), so these photos need a paid plan there, or any other tool that accepts reference photos. The reference photos can be imported straight from this public repository's raw GitHub links.

When the photos below arrive, Claude adds them to `media/originals/` and `CATALOG.md`, then to `scripts/media.mjs` and `src/data/catalog.json` (with a demo price), and runs `npm run shop:media`, `npm run shop:og` and `npm run shop:check`. The same rules as above apply: upload the reference photos named, portrait 4:5, check every result, send them in the chat and say which item each one is.

| # | Category | Photo | Save as | Upload as reference, in this order |
| --- | --- | --- | --- | --- |
| 18 | T-shirts | Navy crew-neck T-shirt, front | `studio/navy-crew-tee.png` | `studio/ivory-heavy-tee.png` |
| 19 | T-shirts | Navy crew-neck T-shirt, back | `studio/navy-crew-tee-back.png` | your #18 photo, then `studio/ivory-heavy-tee-back.png` |
| 20 | T-shirts | Navy crew-neck T-shirt, close-up | `studio/navy-crew-tee-closeup.png` | your #18 photo, then `studio/ivory-heavy-tee-closeup.png` |
| 21 | Polos | Cream knitted polo, front | `studio/cream-knit-polo.png` | `studio/olive-pique-polo.png`, then `wide/cream-knit-polo-and-blue-shirt-walk.png` |
| 22 | Polos | Cream knitted polo, back | `studio/cream-knit-polo-back.png` | your #21 photo, then `studio/olive-pique-polo-back.png` |
| 23 | Polos | Cream knitted polo, close-up | `studio/cream-knit-polo-closeup.png` | your #21 photo, then `studio/olive-pique-polo-closeup.png` |
| 24 | Watches | Steel watch, navy dial, black leather strap | `still-life/steel-watch-navy-dial-black-strap.png` | `still-life/steel-watch-black-dial-brown-strap.png` |
| 25 | Sunglasses | Tortoiseshell round sunglasses | `still-life/tortoiseshell-round-sunglasses.png` | `still-life/black-rectangular-sunglasses.png` |
| 26 | Accessories | Black leather card holder (already in the group shots) | `still-life/black-card-holder.png` | `lifestyle/leather-wallet-belt-cardholder-flatlay.png`, then `still-life/brown-bifold-wallet.png` |
| 27 | Shirts (optional) | Light Blue Oxford Shirt, back | `studio/blue-oxford-shirt-back.png` | `lifestyle/blue-oxford-shirt-library.png`, then `studio/ivory-oxford-shirt-back.png` |

Make the front views first: #19 and #20 use your #18 as the first reference, #22 and #23 use your #21.

### 18. Navy crew-neck T-shirt, front

Upload: `studio/ivory-heavy-tee.png`.

```
Use the uploaded photo as the exact reference for the man, his face, hair and skin, the dark charcoal trousers, the pose with his left hand in his pocket, the plain grey studio background, the soft even light and the framing from head to mid-thigh. Change only the T-shirt: he now wears a plain navy blue crew-neck T-shirt in a smooth mid-weight jersey, with the same relaxed straight fit and length as the T-shirt in the reference, short sleeves ending above the elbow and a neat ribbed crew neckline. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering, no prints on the T-shirt.
```

### 19. Navy crew-neck T-shirt, back

Upload: your #18 photo, then `studio/ivory-heavy-tee-back.png`.

```
Use the first uploaded photo for the man and the navy T-shirt, and the second photo for the pose, the camera angle, the plain grey studio background, the light and the framing. Show the same young man from behind, standing relaxed with his back to the camera, head turned very slightly to one side, arms loose by his sides, exactly like the pose in the second photo, so the whole back of the navy crew-neck T-shirt is visible. Keep the navy colour, fabric, fit and length of the T-shirt from the first photo, and the same dark charcoal trousers. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering, no prints.
```

### 20. Navy crew-neck T-shirt, close-up

Upload: your #18 photo, then `studio/ivory-heavy-tee-closeup.png`.

```
Use the first uploaded photo for the man and the navy T-shirt, and the second photo for the crop, the camera angle and the light. A close-up detail photo of the same navy crew-neck T-shirt on the same young man, cropped like the second photo from just below the nose to the middle of the chest, showing the ribbed crew neckline and the smooth jersey in sharp focus. Same navy colour, same soft studio light, same plain grey background. Photorealistic e-commerce detail photo, portrait 4:5. No text, no logos, no lettering, no prints.
```

### 21. Cream knitted polo, front

Upload: `studio/olive-pique-polo.png`, then `wide/cream-knit-polo-and-blue-shirt-walk.png`.

```
Use the first uploaded photo as the exact reference for the man, his face, hair and skin, the pose, the plain grey studio background, the soft even light and the framing from head to mid-thigh. Change only his clothes: he now wears the cream knitted polo from the second photo (worn there by the man on the right with navy trousers), copied exactly: the same cream colour, the same fine open-textured knit, the same soft knitted collar and short three-button placket, short sleeves and a straight hem, with the same relaxed fit as the polo in the first photo. He also wears dark navy tailored trousers instead of the light trousers. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 22. Cream knitted polo, back

Upload: your #21 photo, then `studio/olive-pique-polo-back.png`.

```
Use the first uploaded photo for the man, the cream knitted polo and the navy trousers, and the second photo for the pose, the camera angle, the plain grey studio background, the light and the framing. Show the same young man from behind, standing relaxed with his back to the camera, head turned very slightly to one side, arms loose by his sides, exactly like the pose in the second photo, so the whole back of the cream knitted polo is visible. Keep the cream colour, the open-textured knit, the collar and the fit from the first photo, and the same navy trousers. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 23. Cream knitted polo, close-up

Upload: your #21 photo, then `studio/olive-pique-polo-closeup.png`.

```
Use the first uploaded photo for the man and the cream knitted polo, and the second photo for the crop, the camera angle and the light. A close-up detail photo of the same cream knitted polo on the same young man, cropped like the second photo from just below the nose to the middle of the chest, showing the soft knitted collar, the three-button placket and the open-textured knit in sharp focus. Same cream colour, same soft studio light, same plain grey background. Photorealistic e-commerce detail photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 24. Steel watch, navy dial, black leather strap

Upload: `still-life/steel-watch-black-dial-brown-strap.png`.

```
Use the uploaded photo as the exact reference for the dark stone surface, the background, the light, the camera angle and the size and position of the watch in the frame. Replace the watch with a different dress watch: a polished round steel case of the same size, a deep navy sunburst dial with thin silver baton hour markers and two slim silver hands, no seconds hand and no date, on a plain black leather strap with a steel pin buckle. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering and no brand name on the dial.
```

### 25. Tortoiseshell round sunglasses

Upload: `still-life/black-rectangular-sunglasses.png`.

```
Use the uploaded photo as the exact reference for the matte charcoal surface, the dark gradient background, the soft overhead light, the camera angle and the size and position of the sunglasses in the frame. Replace the sunglasses with round acetate sunglasses in a warm brown tortoiseshell pattern, with dark green-grey lenses and slim silver hinges, placed the same way with the arms open. A gentle reflection under the frame. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 26. Black leather card holder (already in the group shots)

Upload: `lifestyle/leather-wallet-belt-cardholder-flatlay.png`, then `still-life/brown-bifold-wallet.png`.

```
Use the black leather card holder from the first uploaded photo as the exact reference for the product: the same smooth black leather, the same edge stitching and the same slim shape with card slots. Show it alone, lying slightly angled on the warm dark walnut wood surface of the second photo, lit by the same soft diagonal window light with a gentle shadow, at the same scale and camera angle as the wallet in the second photo. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering, no cards with writing.
```

### 27. Light Blue Oxford Shirt, back

Upload: `lifestyle/blue-oxford-shirt-library.png`, then `studio/ivory-oxford-shirt-back.png`.

```
Use the first uploaded photo for the man, the light blue button-down Oxford shirt and the navy trousers, and the second photo for the pose, the camera angle, the plain grey studio background, the light and the framing. Show the same man from behind, standing relaxed with his back to the camera, head turned very slightly to one side, arms loose by his sides, exactly like the pose in the second photo, so the whole back of the light blue Oxford shirt is visible. Keep the shirt's colour, Oxford weave and fit, and the same navy trousers. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```
