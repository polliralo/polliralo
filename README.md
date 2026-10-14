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

The easiest way is the ready-made zip: run `npm run zip` and upload `dist/nivara-coast-site.zip` (about 10 MB, 117 files). `index.html` sits at the top of the zip with `assets/` beside it, which is the layout hosts expect. On Hostinger, open File Manager, go to `public_html`, upload the zip there and choose Extract; on Netlify, drag the unzipped folder onto the Deploys page. Run `npm run zip` again after any change, so the zip always matches the site.

Once the site has a real domain, open `site/index.html` and find the comment marked `DEPLOY STEP`. Change `og:image` to a full URL and add `og:url` and `<link rel="canonical">` with the new address, so link previews on social apps show the right image. Most hosts compress files automatically; check yours does (gzip or brotli).

## What's in this folder

| Path | What it is |
| --- | --- |
| `site/` | **The website.** This is the folder you deploy. |
| `site/index.html` | The whole page: all text, links and image references. |
| `site/assets/css/main.css` | All styling. Colours, fonts and spacing are tokens at the top of the file. |
| `site/assets/js/main.js` | Header behaviour, phone menu, scroll reveals, photo fade-ins and the island guide. The page still works without it. |
| `site/assets/img/` | Optimised photos in AVIF and WebP, in several widths, plus one JPEG fallback each. |
| `site/assets/fonts/` | Cormorant Garamond and Manrope, trimmed to the Latin characters (both under the SIL Open Font License). |
| `media/originals/` | Your untouched original photos. These are **not** deployed. The earlier hero video is kept in `media/originals/video/` but the site no longer uses it. |
| `scripts/` | Tools: `build-media.mjs` (rebuilds every image and the blurred previews), `build-zip.mjs` (the upload zip), `build-fonts.py`, `serve.mjs` (preview server) and `screenshots.mjs` (review screenshots). |
| `dist/` | The upload zip made by `npm run zip`. Not stored in Git; make it again any time. |
| `tests/` | Automated browser checks. |
| `docs/` | `brand-guidelines.md` (colours, type, logo, voice, photography rules) and the preview screenshots for this README. |

## Design decisions

- **Direction.** Premium, editorial luxury: restrained type, generous space, clear navigation and real depth. Three reference sites were studied for principles only, never copied: the main design language (serif headline with one coloured word, dark pill button with a circled arrow, three-part header, a white card overlapping the hero, ivory canvas), a strong photographic hero, and clear section organisation. Everything that made the references look like booking templates was left out: search bars, icon rows, star ratings, promo banners, partner logos and wave edges.
- **Colour.** Five colours, with the lagoon tone used sparingly. Full details, including contrast ratios, are in `docs/brand-guidelines.md`.

  | Role | Colour |
  | --- | --- |
  | Deep Ocean Ink: text, headings, navigation, main buttons, dining, footer | `#173B3A` |
  | Warm Ivory: main background | `#F7F5EF` |
  | White: cards and panels laid over photos | `#FFFFFF` |
  | Lagoon Accent: thin rules, labels on dark grounds, text selection | `#69C8C8` |
  | Warm Sand: the villas section, image placeholders | `#E8DED0` |

  Lagoon `#69C8C8` is too light for text on pale grounds, so text in the lagoon family uses a deeper shade on light grounds (`#1D6A6C`) and a lighter one on photos and dark grounds (`#A6E1E0`).
- **Type.** *Cormorant Garamond* for headlines, with one italic word or phrase for emphasis. *Manrope* for body text, navigation, labels and buttons.
- **Hero.** The photographs stay in full daylight colour. Ivory type sits on a soft pool of deep-water shading that covers only the area behind the words (plus a slightly darker sky at the very top, like a photographer's graduated filter, so the menu reads clearly). On desktops and tablets the wide aerial fills the screen; on portrait phones the portrait aerial sits above the words and sinks into deep teal, so no word ever sits on the busy villa roofs. A phone browser asking for the desktop site still gets the landscape layout, never a stretched portrait crop.
- **Villa card.** A white card with a small photo of each villa overlaps the bottom of the hero (the floating-card idea from the main reference, used for real navigation instead of a fake search bar). The header's "Explore the Villas" button appears once the hero has scrolled away, so the first screen never shows the same button twice.
- **Villas.** Each villa is laid out like a magazine spread: a large photo, the inside view tucked against it in a white frame, and a white panel with the story, the facts and a numeral (01, 02, 03) overlapping the photo.
  - *Overwater Villa*: the stone bath facing the sea, and the villas at the end of the boardwalk (a crop of the jetty photo). It is never described as having a pool.
  - *Overwater Pool Villa*: the villa with its plunge pool, and the bedroom that opens onto the pool deck.
  - *Beach Pool Villa*: the villa on the sand, and the bedroom looking over the garden, pool and beach.
- **Island guide (the signature).** The aerial photo stays in view while the list of places scrolls past. As each place reaches the reading line, a soft ring and label glide across the photo to it. Pointing at a place, or tapping it, lights it straight away. No numbered markers sit on the photo. The island section uses a different aerial from the hero, so no photo appears twice.
- **Lagoon, dining, arrival.** The lagoon photo stays untouched with its words on a white panel laid over its edge. Dining is the one dark section. Arrival closes the page at sunset with ivory type, and a dark footer grounds the page.
- **Loading.** Every photo shows a tiny blurred preview straight away, then fades in when it arrives, so a slow connection never shows empty boxes.
- **Order of the page.** Hero, villa card, The idea, The Villas, The Island, The Lagoon, Dining, Arrival (the closing call to action), then the footer. "Explore the Villas" goes to the villas. "Discover the Island" goes to the island guide.
- **Honesty.** There are no prices, reviews, ratings, availability, address or contact details, and no structured data claiming a real hotel. The footer and the phone menu say the resort is a fictional concept.

## Changing things

- **Text.** Edit `site/index.html`. Keep sentences short and plain. Avoid long dashes; the site uses commas and full stops.
- **Colours, fonts, spacing.** Change the tokens at the top of `site/assets/css/main.css`.
- **A photo.** Replace the file in `media/originals/images/`, keeping the same name, then run `npm run media -- images lqip`. The page picks it up with no HTML changes. If the new photo is composed differently, check the crops in `scripts/build-media.mjs` and the island guide's place positions (`--x` and `--y`) in `index.html`.
- **The hero photos.** `hero-desktop.png` (wide) and `hero-phone.jpg` (portrait) in `media/originals/images/`. Replace either and run `npm run media -- images lqip meta`; `meta` also rebuilds the social sharing image from the wide photo.
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
- the hero is a still photograph with no video; portrait phones get the portrait photo; a tall window at desktop width keeps the landscape hero
- no sideways scrolling from 320px to 1920px wide
- every in-page link has a real target; the hero buttons, the villa card and the phone menu scroll to the right section, clear of the header
- the header turns solid after the hero, and its button appears only then
- the island guide follows the scroll and the mouse, and the page still shows every place without JavaScript
- the phone menu keeps keyboard focus inside, closes with Esc and returns focus
- the skip link, focus outlines, link names, and 44px touch targets on phones and touch tablets
- heading order, alt text (the small villa thumbnails are marked decorative), modern image formats, and every photo visible after loading
- each photo loads a file that fits the size it is shown at: never noticeably enlarged, and never larger than needed (checked at 10 screen sizes and pixel densities)
- with reduced motion everything shows at once; printing shows every section; without JavaScript the navigation and all photos stay visible
- text contrast over the photos, measured on the real rendered pixels: the hero and header at 17 screen and window sizes, and the arrival section at 12 sizes

**Results at handoff:** lint clean and all 62 browser checks pass (a further 18 run only on the desktop or only on the phone setup, so each is skipped on the other). Lighthouse (lab test on the local preview server):
- Mobile (simulated slow 4G): Performance 98, Accessibility 100, Best Practices 100, SEO 100. Largest Contentful Paint 2.3 s, Cumulative Layout Shift 0, Total Blocking Time 10 ms.
- Desktop: 100 in all four categories. Largest Contentful Paint 0.7 s, Cumulative Layout Shift 0.

## Limitations and what was not verified

- **Browsers.** The automated checks ran in Chromium only. Safari (iPhone, Mac) and Firefox were not tested on real devices. The site uses widely supported features, but check it on a real iPhone before launch. In browsers without registered CSS properties the island guide's ring jumps between places instead of gliding.
- **Phone hero photo.** The supplied portrait photo is 528 × 940 pixels. Phone screens show it at two to three times that density, so it looks slightly soft. A 1080 × 1920 (or larger) version with the same framing would fix this: save it over `media/originals/images/hero-phone.jpg` and run `npm run media -- images lqip`.
- **Other photos.** Most supplied photos are about 1,500px wide, so full-width photos are slightly enlarged on very large or high-density screens.
- **Performance numbers.** These are lab measurements from a local server without compression. Real numbers depend on the host and the visitor's connection.
- **Contrast.** Text over photos was measured at the listed screen sizes. Other sizes were not measured, though the layout and the shading scale smoothly between them.

## What a real business would still need

- A booking engine (link or embedded widget) or an enquiry form connected to a form service or backend. Right now the calls to action scroll to page sections.
- Real contact details and address. Only then add Hotel or LocalBusiness structured data.
- Privacy and cookie pages, plus a consent banner if analytics are added.
- The domain, social sharing tags (see "Put it online") and, if non-developers will edit the content, a CMS.
- Confirmed usage rights for all photography.
