# CoolCare Brand Guidelines v2.0

> Last updated: 20 October 2026
> Status: Concept brand. The phone number, WhatsApp number and service area on the site are placeholders (see "Honesty" below).

## Quick reference

| Element | Value |
| --- | --- |
| Direction | Cool Blue Editorial: a calm, light-blue page with framed photography and one dark moment |
| Primary colour | Deep Navy `#0B1F33` |
| Backgrounds | White `#FFFFFF` and Sky `#EAF4FA`, alternating by section; Ice White `#F4F8FB` for card faces |
| Accent words | Ocean Blue `#0369A1`, one accent per title |
| Accent | Cool Cyan `#18B7D3`, in small doses and never as text on light grounds |
| Font | Manrope, weights 400 to 700 |
| Voice | Plain, calm, specific, honest |
| Personality | Professional, dependable, calm, technically capable, clear, approachable, modern |

---

## 1. Colour

### Core palette

| Name | Hex | Usage |
| --- | --- | --- |
| Deep Navy | `#0B1F33` | Headings, the logo tile, primary buttons, the round arrows on service cards, the contact panel, the plate behind the About portrait |
| Ocean Blue | `#0369A1` | The accent words of each title ("done properly."), step numbers, line icons on light grounds, the hovered and current navigation link |
| Cool Cyan | `#18B7D3` | The status dot in each label, link underlines, the active navigation line, the caption line, the hovered card arrow, the one cyan button on navy, focus on navy |
| Sky | `#EAF4FA` | Alternate sections (the hero, Why CoolCare, About, the footer) and the header at the top of the page |
| Ice White | `#F4F8FB` | The faces of the service cards and the steps panel |
| White | `#FFFFFF` | Main background, cards on Sky (principles, facts, the hero's service-area card), the scrolled header, the phone menu |
| Primary Text | `#142334` | Body text |
| Secondary Text | `#637487` | Supporting text on white |
| Border | `#DFE7ED` | Hairlines between list items and under the header once the page scrolls |

### Supporting shades

| Name | Hex | Where and why |
| --- | --- | --- |
| Navy hover | `#15324F` | Primary button hover |
| Navy card | `#112A42` | The contact card on the navy panel. It is solid, so the faint rings pass behind it, never through its words |
| Label blue | `#0B4F75` | Words in the pill labels on light grounds |
| Plate blue | `#BFE0F0` | The plate behind the hero photo, the step rings and their dashed line |
| Plate on Sky | `#C6E5F2` | The plate behind the Why CoolCare photo, a touch lighter on the Sky section |
| Placeholder | `#D9ECF6` | Behind each photo until it has loaded (under its blurred preview) |
| Card edge | `#D5E5EF` | The 1px edge of the service cards and the steps panel, the footer rule |
| Slate on sky | `#586A7D` | Secondary text on Sky and Ice White. The brief's `#637487` measures 4.3 : 1 on Sky and 4.49 : 1 on Ice White, just under the 4.5 : 1 that small text needs |
| Slate on navy | `#A9BCCD` | Secondary text on Deep Navy |
| Cyan soft | `#7FD8EA` | The accent words of the closing title, on navy |
| Cyan light | `#A8E3EE` | The pill label on navy |
| Cyan hover | `#4CCBE1` | The cyan button's hover |
| Outline | `#7A8EA1` | Border of white buttons: 3 : 1 on white and on Sky, so they stay visible in bright light |

### Contrast (WCAG 2.2)

| Pair | Ratio |
| --- | --- |
| Primary Text on White | 15.9 : 1 |
| Primary Text on Sky | 14.3 : 1 |
| Deep Navy on White | 16.7 : 1 |
| Deep Navy on Sky | 15.0 : 1 |
| Ocean Blue on White | 5.9 : 1 |
| Ocean Blue on Sky | 5.3 : 1 |
| Ocean Blue on Ice White | 5.6 : 1 |
| Label blue on Sky | 7.9 : 1 |
| Secondary Text on White | 4.8 : 1 |
| Slate on sky on Sky | 5.0 : 1 |
| Slate on sky on Ice White | 5.2 : 1 |
| White on Deep Navy | 16.7 : 1 |
| Slate on navy on Deep Navy | 8.6 : 1 |
| Slate on navy on Navy card | 7.5 : 1 |
| Cyan soft on Deep Navy | 10.3 : 1 |
| Deep Navy on Cool Cyan (button) | 7.0 : 1 |
| Outline on White | 3.4 : 1 (button edge) |
| Cool Cyan on White | 2.4 : 1 (decoration only, never text) |

A browser test measures every piece of text on the page against what is behind it.

### Rules

- **Rhythm.** Sky hero, White services, Sky Why CoolCare, White How it works, Sky About, White contact, Sky footer. Deep Navy appears as one large area only: the contact panel, the page's one dark moment.
- **Blue in three strengths.** Sky for grounds, Ocean Blue for accent words and small icons, Deep Navy for weight. Cyan is the spark, so it stays small: dots, lines, underlines and the closing button. Never large cyan areas, gradients or glows.
- **Depth stays soft.** No decorative gradients, glassmorphism, neon, blobs or heavy shadows. Shadows are low and blue-grey: framed photos, white cards on Sky, the hero's service-area card, the scrolled header and the navy buttons. Buttons in the header are flat and the cyan button has no glow.

---

## 2. Typography

```css
--font-sans: "Manrope", "Manrope Fallback", "Helvetica Neue", Arial, sans-serif;
```

Manrope (SIL Open Font License) is self-hosted as one variable file, trimmed to Latin characters and weights 400 to 700 (23 KB). A resized Arial fallback keeps text from jumping while it loads.

| Element | Largest | Smallest (phones) | Weight and tracking |
| --- | --- | --- | --- |
| Hero headline | 68px | 34px | 700, -0.035em, line height 1.03 |
| Closing headline | 60px | 36px | 700, -0.035em, line height 1.05 |
| Section title | 52px | 32px | 700, -0.03em, line height 1.08 |
| Card title | 24px | 20px | 700, -0.02em |
| Lead text | 20px | 17px | 400, line height 1.55 |
| Body | 17px | 16px | 400, line height 1.6 |
| Label (in a pill) | 12px, uppercase | 12px | 700, 0.14em |
| Step numbers | 22px in a 72px ring | 18px in a 56px ring | 700, tabular figures |

- **Two-tone titles.** Each section title sets its lead words in Deep Navy and its last words in Ocean Blue: "Four services, *done properly.*", "Careful work, *clearly explained.*" The hero does the same with "Can Rely On". One accent per title, always the end of the line of thought.
- The hero headline always keeps its three lines ("AC & Refrigerator / Service You / Can Rely On"); its size follows the width of its column so the longest line always fits.
- Headlines are set in sentence case and never in all capitals. Only labels use capitals.
- Phone numbers never break across lines and use tabular figures where they line up.

---

## 3. Logo

- **Mark:** the C of CoolCare with a small cyan dot in its opening: the status light every AC carries. White on a Deep Navy rounded tile (radius 9 on a 32 grid).
- **Wordmark:** "CoolCare" in Manrope 700, -0.03em, Deep Navy, one word with two capitals.
- **Inverse:** on Deep Navy the tile is dropped: a white C and the cyan dot.
- **Clear space:** at least the width of the dot all round. **Minimum size:** 16px for the mark (favicon), 24px with the wordmark.
- **Don't:** recolour the dot, add a snowflake or other symbol, stretch the mark or put it on a photo.

Files: `site/favicon.svg` (the mark), plus PNG versions made by `npm run media -- meta`.

---

## 4. Motif and details

- **The status dot.** A small cyan dot with a soft halo leads every pill label, the same dot as in the logo. It is the one recurring brand detail.
- **Pill labels.** Section labels and the service numbers (01 to 04) sit in small rounded tags: Sky on white sections, white on Sky sections, faint white on navy.
- **Frames and plates.** Every large photo sits in a frame: 24px corners, a soft shadow and a flat colour plate (32px corners) offset behind it, each in its own direction: the hero's light-blue plate down and to the right, Why CoolCare's up and to the left, the About portrait's Deep Navy plate up and to the right. A plate never sits under a caption or words.
- **Cards.** White cards on Sky hold the principles, the About facts and the hero's service-area card; Ice White cards with a 1px edge hold the services and the steps. Hairlines separate the items inside a card.
- **Numbers.** Services are numbered 01 to 04 in tags, steps 01 to 03 in white rings joined by a dashed line. Numbers carry the order; there are no icon rows.
- **Icons.** Small line icons only (24px grid, 1.75 stroke): inside buttons (phone, message, arrow), in round discs beside the facts and contact details, and a check beside each principle.
- **Captions.** A technical photo can carry a short caption below it, led by a short cyan line, never on it ("Measuring airflow at the indoor unit.").
- **Rings.** On wide screens the contact panel shows two faint rings, the logo's C drawn large, passing behind the contact card. They never cross words.

---

## 5. Layout

- 12-column grid, content up to 1320px wide, outer margins from 20px (phones) to 56px.
- Photos stay inside the content width, each in its frame; only the plates reach a little into the margin.
- **Corners:** 12px on buttons, 18px on photos inside cards and on the small service-area card, 24px on framed photos and white cards, 28px on service cards, 32px on plates, the steps panel and the contact panel. Labels are fully rounded pills.
- **Shadows:** the faintest under white buttons; a soft one under framed photos, white cards and navy buttons; a stronger, still blurred one under the hero's service-area card and a hovered service card.
- Touch targets are at least 44px tall on phones.

---

## 6. Voice and copy

- **Plain and specific.** "Not cooling, leaking water or tripping the power? We find the cause first, then fix it." Name the real problem in the customer's words.
- **Calm, never pushy.** No urgency, no exclamation marks, no "best", "number one" or "cheapest".
- **Honest.** Say how CoolCare works, not what it has achieved. The core promise is a way of working: find the cause, explain it plainly, then do the work properly.
- **Short.** One idea per sentence. Commas and full stops, never long dashes.
- **Words to avoid:** solutions, seamless, leverage, empower, unlock, robust, elevate, world-class, cutting-edge.

The site copy is English for this concept. A Bangla version would follow the same rules.

---

## 7. Photography

- Real work in progress: hands on the unit, tools in use, the appliance open. Not posed portraits, except the one About portrait.
- Natural daylight, true colour, tidy rooms, shallow depth of field. No filters, no tinting and no dramatic grading: the page's blue comes from the grounds, the frames and the uniform, not from the photos.
- Uniform: a deep navy polo with thin cyan tipping on collar and sleeves, dark navy work trousers. No logos or lettering on clothing or appliances.
- **Words never sit on a photo.** The only thing that overlaps a photo is the hero's small white service-area card, and its words sit on its own white ground. A browser test checks this at eight screen sizes.
- **Authenticity:** CoolCare serves a Bangladeshi market, so its photos should show South Asian technicians in recognisable local homes (tiled floors, window grilles, the neighbouring buildings outside). The current illustrative photos show a European-looking technician in European-style rooms and should be replaced before a real launch.

---

## 8. Components

| Component | Rule |
| --- | --- |
| Primary button | Deep Navy, white text, 12px corners, a low shadow; phone icon for calls |
| Secondary button | White, Deep Navy text, outline `#7A8EA1`, message icon for WhatsApp |
| Closing button | Cool Cyan with Deep Navy text, only on Deep Navy, no glow |
| Pill label | 12px uppercase with the status dot; its ground changes with the section |
| Framed photo | 24px corners, soft shadow, an offset plate behind it |
| Service card | An Ice White mount holding its photo, a number tag, the name, one sentence and "Ask on WhatsApp" with a round navy arrow. The whole card is the link, and it opens WhatsApp with that service already written into the message. On hover it rises onto white, the photo zooms very slightly and the arrow turns cyan |
| Steps | Numbers in white rings with a light-blue halo, joined by a dashed line, on one Ice White panel |
| Info card | White, 18px to 24px corners, soft shadow: the hero's service area, the principles, the About facts |
| Contact panel | Deep Navy, 32px corners, with the contact details on a solid Navy card |
| Text link | Deep Navy, cyan underline that darkens to navy on hover |
| Focus | 2px Deep Navy outline on light grounds, Cool Cyan on navy; whole cards get the outline |

---

## 9. Honesty

- No invented prices, ratings, reviews, years in business, customer numbers, guarantees, warranties, certifications, emergency or same-day availability, or statistics. A test fails if any appear.
- There is no form. The buttons open the visitor's own phone or WhatsApp, and nothing on the page claims that a request was sent.
- While the details are placeholders (`isConcept: true` in `site.config.mjs`) the footer says so, and no business structured data is published.
