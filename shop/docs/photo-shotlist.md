# MONO photo shot list

Owner-facing version with every prompt filled in, reference thumbnails, copy buttons and done ticks: https://claude.ai/artifact/2Vh7M2vsNhRzaGX4zL2c4V (shots are numbered #1 to #17 in the order below).

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

The owner asked for three distinct products per category, but only with photos that really show a different product: no duplicate or recoloured copies of an existing photo. The photos in `media/originals/` were checked one by one:

- **Shirts** has its third product: the Light Blue Oxford Shirt, cut out of `lifestyle/blue-oxford-shirt-library.png`, the only photo of it (so it has a front view and the library photo, no back view yet).
- **Every other category** has no third product in the photos. The cream knitted polo, the linen overshirt, the chore jacket and the card holder only appear in wide or group shots, too small or shared with other pieces to make a clean product photo. So those categories stay at two products, and the collection pages fill the last row with an editorial tile instead of a fake product.

When the photos below arrive, Claude adds them to `media/originals/` and `CATALOG.md`, then to `scripts/media.mjs` and `src/data/catalog.json` (with a demo price), and runs `npm run shop:media`, `npm run shop:og` and `npm run shop:check`. The same rules as above apply: upload the reference photos named, portrait 4:5, check every result, send them in the chat and say which item each one is.

| # | Category | New product | Files to send (save under these names) | Upload as reference |
| --- | --- | --- | --- | --- |
| 18 | T-shirts | Navy crew-neck T-shirt | `studio/navy-crew-tee.png`, `studio/navy-crew-tee-back.png`, `studio/navy-crew-tee-closeup.png` | `studio/ivory-heavy-tee.png` |
| 19 | Polos | Cream knitted polo | `studio/cream-knit-polo.png`, `studio/cream-knit-polo-back.png`, `studio/cream-knit-polo-closeup.png` | `studio/olive-pique-polo.png`, then `wide/cream-knit-polo-and-blue-shirt-walk.png` |
| 20 | Watches | Steel watch, navy dial, black leather strap | `still-life/steel-watch-navy-dial-black-strap.png` | `still-life/steel-watch-black-dial-brown-strap.png` |
| 21 | Sunglasses | Tortoiseshell round sunglasses | `still-life/tortoiseshell-round-sunglasses.png` | `still-life/black-rectangular-sunglasses.png` |
| 22 | Accessories | Black leather card holder (already in the group shots) | `still-life/black-card-holder.png` | `lifestyle/leather-wallet-belt-cardholder-flatlay.png`, then `still-life/brown-bifold-wallet.png` |
| 23 | Shirts (optional) | Back view of the Light Blue Oxford Shirt | `studio/blue-oxford-shirt-back.png` | `lifestyle/blue-oxford-shirt-library.png` |

### 18. Navy crew-neck T-shirt (3 photos)

Front:

```
Use the uploaded photo as the exact reference for the man, the trousers, the pose, the plain grey studio background, the soft even light and the framing from head to mid-thigh. Change only the T-shirt: he now wears a plain navy crew-neck T-shirt in a smooth mid-weight jersey, the same relaxed straight fit and length as the T-shirt in the reference, short sleeves ending above the elbow, a neat ribbed crew neckline. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering, no prints on the T-shirt.
```

Back view: upload the new front photo and use the prompt of item 1 with `[GARMENT]` = navy crew-neck T-shirt. Close-up: upload the new front photo and use the prompt of item 4 with `[DETAIL]` = the ribbed crew neckline and the smooth jersey.

### 19. Cream knitted polo (3 photos)

Front:

```
Use the first uploaded photo as the exact reference for the man, the trousers, the pose, the plain grey studio background, the soft even light and the framing from head to mid-thigh. Change only the polo: he now wears the cream knitted polo from the second photo, copied exactly: the same cream colour, the same fine knit texture, the same open knitted collar with no buttons, short sleeves with ribbed cuffs and a ribbed hem. Same relaxed fit as the polo in the first photo. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```

Back view and close-up: as item 18, with `[GARMENT]` = cream knitted polo and `[DETAIL]` = the open knitted collar and the fine knit texture.

### 20. Steel watch, navy dial (1 photo)

```
Use the uploaded photo as the exact reference for the surface, the background, the light, the camera angle and the size of the watch in the frame. Replace the watch with a different dress watch: a polished round steel case of the same size, a deep navy sunburst dial with thin silver baton hour markers and two slim silver hands, no seconds hand and no date, on a plain black leather strap with a steel pin buckle. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering and no brand name on the dial.
```

### 21. Tortoiseshell round sunglasses (1 photo)

```
Use the uploaded photo as the exact reference for the matte charcoal surface, the dark gradient background, the soft overhead light, the camera angle and the size of the sunglasses in the frame. Replace the sunglasses with round acetate sunglasses in a warm brown tortoiseshell pattern, dark green-grey lenses and slim silver hinges, placed the same way with the arms open. A gentle reflection under the frame. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering anywhere.
```

### 22. Black leather card holder (1 photo)

```
Use the black leather card holder from the first uploaded photo as the exact reference for the product: same black smooth leather, same edge stitching, same slim shape with card slots. Show it alone, lying slightly angled on the warm dark walnut wood surface of the second photo, lit by the same soft diagonal window light with a gentle shadow, at the same scale and camera angle as the wallet in the second photo. Photorealistic product still life, portrait 4:5. No text, no logos, no lettering, no cards with writing.
```

### 23. Light Blue Oxford Shirt, back view (optional, 1 photo)

```
Use the uploaded photo as the exact reference for the man, the light blue button-down Oxford shirt and the navy trousers. Show him in a plain grey studio, soft even light, framed from head to mid-thigh, standing relaxed with his back to the camera, head turned very slightly to one side, arms loose by his sides, so the whole back of the shirt is visible. Same shirt colour, Oxford weave and fit. Photorealistic e-commerce studio photo, portrait 4:5. No text, no logos, no lettering anywhere.
```
