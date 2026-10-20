# Project instructions

## Language
- Always reply to the user in Bangla (Bengali script). The user does not read English well.
- Keep code, file names, and commands in English, but explain everything in simple Bangla.
- Client-facing work (website copy, README, docs) is in English: the user builds for English-speaking clients.

## Projects in this repo
- `coolcare/`: CoolCare, the current project (below).
- Repository root: NIVARA COAST, the previous project, still live (further below).
- Before every commit run `npm run check:all` in the root: it checks both sites.

## Current project: CoolCare website (`coolcare/`)
- AC & refrigerator service site for a Bangladeshi local market. Concept brand: phone, WhatsApp and service area are placeholders. Self-contained folder with its own package.json, tests and `README.md` (the client handoff: keep it current); it uses the root `node_modules`.
- Built from components: `src/components/*.mjs` (Header, Hero, ServiceGrid, ServiceCard, WhyCoolCare, Process, About, ContactCTA, Footer, Menu), all words in `src/content.mjs`, business details only in `site.config.mjs` (phone, WhatsApp, service area, siteUrl, isConcept). `npm run build` (in `coolcare/`) writes `site/index.html`: never edit that file by hand, a test compares it with a fresh build. Rebuild after any change to `src/`, the config, `main.css` or `main.js` (the page links them with version stamps).
- Photos: originals in `media/originals/` (never edit them). `npm run media` makes the AVIF/WebP/JPEG sizes, writes `src/images.json` and the blurred previews (lqip block) in `main.css`; crops live in `scripts/images.config.mjs`. Run `npm run build` afterwards. The supplied photos show a European-looking technician in European-style rooms, while the brief asks for South Asian technicians in Bangladeshi homes: replacing them is an open item (README, "About the photographs"). The user chose to use the supplied photos for now.
- Art direction: Cool Blue Editorial (premium, light blue; the user asked for this look). Manrope only (400 to 700), titles at 700 in two tones (navy lead words, Ocean Blue #0369A1 accent words via `{ lead, accent }` in content.mjs). Palette tokens at the top of `main.css`: Deep Navy #0B1F33, Cool Cyan #18B7D3 (small doses; never as text on light), Sky #EAF4FA (alternate sections, the footer, the header at the top), Ice White #F4F8FB (card faces), White, Primary Text #142334, Secondary Text #637487 (#586A7D on Sky and Ice White for contrast), Border #DFE7ED. The only large dark area is the navy contact panel. Large photos sit in frames with an offset colour plate that never covers a caption; pill labels with the cyan status dot; white cards on Sky. The desktop hero uses the wide photo (`hero-desktop`, from hero-wide.png), phones a 4:3 crop of it. No gradients, glassmorphism, neon, glows, blobs, heavy shadows, icon rows, counters, sliders or identical template cards. Words never sit on photos; only the hero's white service-area card overlaps the photo's corner (a test checks this). After layout changes, keep the `sizes` of each photo in step with the CSS (a test checks the chosen files). Brand rules: `coolcare/docs/brand-guidelines.md`.
- Content rules: no invented prices, ratings, reviews, years in business, customer numbers, guarantees, certifications, emergency or same-day availability, or statistics (a test checks); no form and nothing that claims a request was sent; keep the concept note while `isConcept` is true; no long dashes in site copy.
- Preview: `npm start` in `coolcare/` (http://localhost:4174), or `npm run coolcare` from the root. Checks: `npm run check` in `coolcare/` (html-validate + Playwright, desktop and phone). Upload zip: `npm run zip` makes `coolcare/dist/coolcare-site.zip` (not in Git).

## Previous project: NIVARA COAST website (repository root)
- Fictional private-island resort concept. Static site in `site/` (plain HTML, CSS, vanilla JS, no build step). Deploy = upload the contents of `site/` (`npm run zip` makes `dist/nivara-coast-site.zip` with index.html at the top; `dist/` is not in Git). Live on Cloudflare Workers at https://tight-grass-cb84.mohammedabdulazizcxb.workers.dev/ (the sharing tags in index.html use this address).
- Originals live in `media/originals/` (never edit them). `npm run media` rebuilds every optimised image in `site/assets/`; steps: `images`, `lqip` (blurred previews written into main.css), `meta` (`--only <name>` limits it to named images). The hero is a still photo (`hero-desktop.png` wide, `hero-phone.jpg` portrait); the site has no video.
- Art direction: restrained, editorial luxury. Cormorant Garamond (display) + Manrope (text, nav, labels, buttons). Palette tokens at the top of `main.css`: ink #173B3A, ivory #F7F5EF, white, lagoon #69C8C8 (sparingly, never as text on light), sand #E8DED0. Photos stay in full daylight colour: type on photos is ivory over a soft deep-water gradient behind the words only (never a white haze), and only in the hero and arrival; everywhere else words never sit on a photo (a test checks this). No booking widgets, promo banners, icon rows, wave edges or decorations. Brand rules: `docs/brand-guidelines.md`.
- Preview: `npm start` (http://localhost:4173). Checks: `npm run check` (html-validate + Playwright tests, desktop and phone).
- Content rules: no invented prices, reviews, ratings, availability, address, contact details or staff; keep the fictional-concept note in the footer; the standard Overwater Villa has no private pool; no long dashes in site copy.
- README.md is the client handoff: keep it current when things change.

## Skills
This repo has these skills in `.claude/skills/`. Use them together for any website, UI, or design work:
- `10k-websites`: overall website build flow (cinematic scroll site, deploy).
- `ui-ux-pro-max`: pick style, colors, fonts, UX rules (run its search script).
- `design-system`: design tokens and component specs.
- `ui-styling`: Tailwind and shadcn/ui implementation.
- `brand`: brand voice and visual identity.
- `design`: logos, icons, social images, CIP.
- `banner-design`: banners for social, ads, hero sections.
- `slides`: HTML presentations.

For a website request, follow `10k-websites` as the main flow, and use `ui-ux-pro-max`, `design-system`, `ui-styling`, and `brand` inside it for design decisions and code quality.
