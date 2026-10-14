# Nivara Coast

The homepage for **NIVARA COAST**, a fictional private-island resort concept. It's built with plain HTML, CSS and one small JavaScript file. There's no framework and no build step, so it runs on any web host as-is.

![The Nivara Coast homepage on desktop](docs/preview-desktop.jpg)

## Preview it on your computer

1. Install [Node.js](https://nodejs.org) 18.17 or newer (20 or 22 recommended).
2. In this folder, run `npm install` once.
3. Run `npm start` and open <http://localhost:4173>.

Use `npm start` rather than double-clicking `site/index.html`. Some browsers block web fonts on pages opened straight from a folder.

## Put it online

Upload **the contents of the `site/` folder** to any static web host (Hostinger, Netlify, Cloudflare Pages, GitHub Pages and so on). Nothing else is needed on the server.

Once the site has a real domain, open `site/index.html` and find the comment marked `DEPLOY STEP`. Change `og:image` to a full URL and add `og:url` and `<link rel="canonical">` with the new address, so link previews on social apps show the right image. Most hosts compress files automatically; check yours does (gzip or brotli).

## What's in this folder

| Path | What it is |
| --- | --- |
| `site/` | **The website.** This is the folder you deploy. |
| `site/index.html` | The whole page: all text, links and image references. |
| `site/assets/css/main.css` | All styling. Colours, fonts and spacing are tokens at the top of the file. |
| `site/assets/js/main.js` | Header behaviour, phone menu, scroll reveals, section highlighting and the island map. The page still works without it. |
| `site/assets/img/` | Optimised photos in AVIF and WebP, in several widths, plus one JPEG fallback each. |
| `site/assets/fonts/` | Cormorant Garamond and Manrope, trimmed to the Latin characters (both under the SIL Open Font License). |
| `media/originals/` | Your untouched original photos. These are **not** deployed. The earlier hero video is kept in `media/originals/video/` but the site no longer uses it. |
| `scripts/` | Tools: `build-media.mjs` (rebuilds every image), `build-fonts.py`, `serve.mjs` (preview server) and `screenshots.mjs` (review screenshots). |
| `tests/` | Automated browser checks. |
| `docs/` | Preview screenshots for this README. |

## Design decisions

- **Direction.** Quiet, editorial luxury: restrained type, generous space, clear navigation and a calm hierarchy. Three reference sites were used for principles only, never copied: the main design language (typography, negative space, navigation), a strong photographic hero, and clear section organisation. There are no booking widgets, promo banners, icon rows, wave edges or decorations.
- **Colour.** Five colours, with the lagoon tone used sparingly:

  | Role | Colour |
  | --- | --- |
  | Deep Ocean Ink: text, headings, navigation, main buttons, the dining section | `#173B3A` |
  | Warm Ivory: main background, the haze behind hero text | `#F7F5EF` |
  | White: the villa strip and the villas section | `#FFFFFF` |
  | Lagoon Accent: the thin rule before section labels, the dining label on dark ink, text selection | `#69C8C8` |
  | Warm Sand: the island section, image placeholders | `#E8DED0` |

  Lagoon `#69C8C8` is too light for text on a pale background, so text in the lagoon family uses a deeper shade, `#1D6A6C` (5.8:1 on ivory). Every text colour meets WCAG AA contrast (4.5:1, or 3:1 for large headings).
- **Type.** *Cormorant Garamond* for headlines, with italics for emphasis. *Manrope* for body text, navigation, labels and buttons. One fluid type scale is used throughout.
- **Hero.** A still photograph: the wide aerial on desktops and tablets, the portrait aerial on portrait phones. A soft ivory haze, like sea mist, sits only where there is text: behind the words and in a light band under the header. Everywhere else the lagoon keeps its natural daylight colour. The header's "Explore the Villas" button appears only after the hero has scrolled away, so the first screen never shows the same button twice.
- **Villa strip.** Right under the hero, three links go straight to each villa type.
- **Villas.** Each villa type has an outside view and an inside view:
  - *Overwater Villa*: the stone bath facing the sea, and the villas at the end of the boardwalk (a crop of the jetty photo). It is never described as having a pool.
  - *Overwater Pool Villa*: the villa with its plunge pool, and the bedroom that opens onto the pool deck.
  - *Beach Pool Villa*: the villa on the sand, and the bedroom looking over the garden, pool and beach.

  On wide screens the photo and the text sit side by side. On mid-size screens (900 to 1199px) the photo runs full width above the text, so no photo is cropped into a narrow strip.
- **Signature details.** A short horizon line sits before every section label. "The island at a glance" turns the original aerial photo into a guide, with six numbered points and a matching legend; pointing at a legend entry highlights its marker. The island section uses a different aerial from the hero, so no photo appears twice.
- **Order of the page.** Hero, villa strip, The idea, The Villas, The Island, The Lagoon, Dining, Arrival (the closing call to action), then the footer. "Explore the Villas" goes to the villas. "Discover the Island" goes to the island guide.
- **Honesty.** There are no prices, reviews, ratings, availability, address or contact details, and no structured data claiming a real hotel. The footer and the phone menu say the resort is a fictional concept.

## Changing things

- **Text.** Edit `site/index.html`. Keep sentences short and plain. Avoid long dashes; the site uses commas and full stops.
- **Colours, fonts, spacing.** Change the tokens at the top of `site/assets/css/main.css`.
- **A photo.** Replace the file in `media/originals/images/`, keeping the same name, then run `npm run media -- images`. The page picks it up with no HTML changes. If the new photo is composed differently, check the crops in `scripts/build-media.mjs` and the map marker positions in `index.html`.
- **The hero photos.** `hero-desktop.png` (wide) and `hero-phone.jpg` (portrait) in `media/originals/images/`. Replace either and run `npm run media -- images meta`; `meta` also rebuilds the social sharing image from the wide photo.
- **Fonts.** `python3 scripts/build-fonts.py` downloads and trims them again (needs `pip install fonttools brotli`).

## Checks

```bash
npm run lint   # HTML validation
npm test       # browser tests on a desktop and a phone screen
npm run check  # both
```

The first time you run the tests on a new computer, run `npx playwright install chromium`.

The tests cover:
- the page loads with no errors and no failed files, and the brand fonts load
- the copy uses no long dashes, and the footer states that the brand is fictional
- the hero is a still photograph with no video on the page; portrait phones get the portrait photo and every other screen the wide one
- no sideways scrolling from 360px to 1920px wide
- every in-page link has a real target; the hero buttons, the villa strip and the phone menu scroll to the right section, clear of the header
- the header turns solid after the hero, and its button appears only then
- the phone menu keeps keyboard focus inside, closes with Esc and returns focus
- the skip link, focus outlines, link names, and 44px touch targets on phones and touch tablets
- heading order, alt text and modern image formats
- each photo loads a file that fits the size it is shown at: never noticeably enlarged, and never larger than needed (checked at 10 screen sizes and pixel densities)
- with reduced motion everything shows at once; printing shows every section; without JavaScript the navigation stays visible
- text contrast over the photos, measured on the real rendered pixels: the hero and header at 15 screen and browser-window sizes, and the lagoon and arrival text at 12 sizes

**Results at handoff:** lint clean and all 56 browser checks pass (a further 16 run only on the desktop or only on the phone setup, so each is skipped on the other). Lighthouse (lab test on the local preview server):
- Mobile (simulated slow 4G): Performance 98, Accessibility 100, Best Practices 100, SEO 100. Largest Contentful Paint 2.3 s, Cumulative Layout Shift 0, Total Blocking Time 10 ms.
- Desktop: 100 in all four categories. Largest Contentful Paint 0.6 s, Cumulative Layout Shift 0.

## Limitations and what was not verified

- **Browsers.** The automated checks ran in Chromium only. Safari (iPhone, Mac) and Firefox were not tested on real devices. The site uses widely supported features, but check it on a real iPhone before launch.
- **Phone hero photo.** The supplied portrait photo is 528 × 940 pixels. Phone screens show it at two to three times that density, so it looks slightly soft. A 1080 × 1920 (or larger) version with the same framing would fix this: save it over `media/originals/images/hero-phone.jpg` and run `npm run media -- images`.
- **Other photos.** Most supplied photos are about 1,500px wide, so full-width photos are slightly enlarged on very large or high-density screens.
- **Performance numbers.** These are lab measurements from a local server without compression. Real numbers depend on the host and the visitor's connection.
- **Contrast.** Text over photos was measured at the listed screen sizes. Other sizes were not measured, though the layout and the haze scale smoothly between them.

## What a real business would still need

- A booking engine (link or embedded widget) or an enquiry form connected to a form service or backend. Right now the calls to action scroll to page sections.
- Real contact details and address. Only then add Hotel or LocalBusiness structured data.
- Privacy and cookie pages, plus a consent banner if analytics are added.
- The domain, social sharing tags (see "Put it online") and, if non-developers will edit the content, a CMS.
- Confirmed usage rights for all photography.
