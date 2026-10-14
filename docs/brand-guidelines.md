# Nivara Coast Brand Guidelines v1.0

> Last updated: 14 October 2026
> Status: Concept brand (Nivara Coast is fictional; see "Honesty" below)

## Quick reference

| Element | Value |
| --- | --- |
| Primary colour | Deep Ocean Ink `#173B3A` |
| Background | Warm Ivory `#F7F5EF` |
| Accent | Lagoon `#69C8C8`, used sparingly |
| Display font | Cormorant Garamond (500, italic for emphasis) |
| Text font | Manrope (400 to 600) |
| Voice | Quiet, plain, sensory, honest |

---

## 1. Colour

### Core palette

| Name | Hex | Usage |
| --- | --- | --- |
| Deep Ocean Ink | `#173B3A` | Text, headings, navigation, main buttons, the dining section |
| Ocean Ink Deep | `#0F2C2B` | Footer, button hover |
| Abyss | `#0C2625` | Shading under type on photos (as a soft gradient, never a flat block) |
| Warm Ivory | `#F7F5EF` | Main background, the phone menu |
| Ivory Bright | `#FBFAF6` | Type and buttons on photos |
| White | `#FFFFFF` | Cards and panels that sit on top of photos |
| Lagoon | `#69C8C8` | Thin rules before labels, labels on dark grounds, text selection |
| Warm Sand | `#E8DED0` | The villas section, image placeholders |

### Accent shades (for text)

The lagoon tone is too light for text on pale grounds, so text in the lagoon family uses one of two shades:

| Name | Hex | Where |
| --- | --- | --- |
| Lagoon Deep | `#1D6A6C` | Labels, italic emphasis and numerals on ivory, white or sand |
| Lagoon Light | `#A6E1E0` | Italic emphasis on photos and dark grounds |

### Contrast (WCAG 2.2)

| Pair | Ratio |
| --- | --- |
| Ink on ivory | 11.2 : 1 |
| Ink on sand | 9.2 : 1 |
| Lagoon Deep on ivory | 5.8 : 1 |
| Lagoon Deep on sand | 4.7 : 1 |
| Ivory on ink | 11.2 : 1 |
| Lagoon on ink | 6.2 : 1 |
| Lagoon Light on Ocean Ink Deep | 10.2 : 1 |

Type over photographs is measured on the rendered page (the lightest pixels behind light type), at 17 screen and window sizes for the hero and 12 for the arrival section. Every text element passes AA: 4.5 : 1 for body text, 3 : 1 for large headings.

---

## 2. Typography

```css
--font-display: "Cormorant Garamond", Georgia, "Times New Roman", serif;
--font-text: "Manrope", "Helvetica Neue", Arial, sans-serif;
```

Both are under the SIL Open Font License and self-hosted, trimmed to Latin characters.

Sizes scale smoothly with the screen width between these limits:

| Element | Largest | Smallest (phones) | Font and weight |
| --- | --- | --- | --- |
| Hero headline | 112px | 54px | Cormorant 500, line height 0.95 |
| Section title | 68px | 40px | Cormorant 500 |
| Villa name | 46px | 34px | Cormorant 500 |
| Body large | 20px | 17px | Manrope 400, line height 1.6 |
| Body | 17px | 16px | Manrope 400, line height 1.65 |
| Label | 12px, uppercase, 0.2em tracking | 12px | Manrope 600 |

Italics carry the emphasis: one italic phrase per headline at most ("A quieter kind of *paradise.*").

Numerals in Cormorant use lining figures (`font-variant-numeric: lining-nums`), so 01, 02, 03 never read as "o1". Running text uses `text-wrap: pretty`, so no paragraph ends on a single word.

---

## 3. Logo

- **Mark:** a half-risen sun on the horizon, above two lines of water, drawn in a single line weight. It works at 24px and up.
- **Wordmark:** NIVARA in Cormorant 600 and COAST in Cormorant 400, uppercase, 0.2em tracking.
- **Colour:** ink on light grounds, ivory on photos and dark grounds. Never lagoon, never on a busy part of a photo without shading.
- **Favicon:** the mark in ivory and lagoon on an ink tile (`site/favicon.svg`).

---

## 4. Voice and tone

| Trait | We are | We are not |
| --- | --- | --- |
| Quiet | Calm, unhurried, confident | Loud, superlative, salesy |
| Plain | Short sentences, everyday words | Jargon, "curated", "unparalleled" |
| Sensory | Light, water, timber, linen, breeze | Vague promises |
| Honest | Only what the photos show | Invented facts, prices or reviews |

Examples from the site: "Arrive slowly." "Long lunches above the water." "Where the pool ends, the lagoon begins."

Copy rules: no long dashes (use commas and full stops), no stock marketing words, British English spelling.

---

## 5. Photography

- Natural daylight colour is the brand. Photos are never washed out with white haze or darkened all over.
- Where type sits on a photo, a soft gradient of deep water (Abyss) sits only behind the words.
- Each photo appears once. Exteriors and interiors are paired for each villa.
- No added people, logos or text in images.

---

## 6. Layout and components

- **Corners:** 10px for photos, cards and panels; 6px for thumbnails; full pill only for buttons.
- **Depth:** one soft, warm shadow, used only for the villa card, the framed inside views and the phone villa panels. Nothing else casts a shadow.
- **Words and photos:** words never sit on top of a photo, except the hero and arrival lines, which have their own deep-water shading. A card or frame may rest on a photo's edge, but only its empty margin overlaps; the words start beyond the photo.
- **Rules:** thin ink lines at 14 percent (dividers) or 50 percent (section tops).
- **Signature details:** a short horizon line before every label; italic numerals (01, 02, 03); the island guide, where a ring glides across the aerial photo to each place as you read.
- **Buttons:** ink pill with an ivory circle and arrow on light grounds; ivory pill with an ink circle on photos.

---

## 7. Motion

Slow, soft and purposeful. Words rise into place, photos fade in over a blurred preview, the island ring glides between places. No looping decoration. Everything respects "reduce motion".

---

## 8. Honesty

Nivara Coast is a design concept, not an operating hotel. Every page states this. Never add prices, availability, reviews, ratings, awards, partner logos, an address, contact details or staff names unless they become real and verified.
