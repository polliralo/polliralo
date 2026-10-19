# Project instructions

## Language
- Always reply to the user in Bangla (Bengali script). The user does not read English well.
- Keep code, file names, and commands in English, but explain everything in simple Bangla.
- Client-facing work (website copy, README, docs) is in English: the user builds for English-speaking clients.

## Current project: NIVARA COAST website
- Fictional private-island resort concept. Static site in `site/` (plain HTML, CSS, vanilla JS, no build step). Deploy = upload the contents of `site/` (`npm run zip` makes `dist/nivara-coast-site.zip` with index.html at the top; `dist/` is not in Git). Live on Cloudflare Workers at https://tight-grass-cb84.mohammedabdulazizcxb.workers.dev/ (the sharing tags in index.html use this address).
- Originals live in `media/originals/` (never edit them). `npm run media` rebuilds every optimised image in `site/assets/`; steps: `images`, `lqip` (blurred previews written into main.css), `meta` (`--only <name>` limits it to named images). The hero is a still photo (`hero-desktop.png` wide, `hero-phone.jpg` portrait); the site has no video.
- Art direction: restrained, editorial luxury. Cormorant Garamond (display) + Manrope (text, nav, labels, buttons). Palette tokens at the top of `main.css`: ink #173B3A, ivory #F7F5EF, white, lagoon #69C8C8 (sparingly, never as text on light), sand #E8DED0. Photos stay in full daylight colour: type on photos is ivory over a soft deep-water gradient behind the words only (never a white haze), and only in the hero and arrival; everywhere else words never sit on a photo (a test checks this). No booking widgets, promo banners, icon rows, wave edges or decorations. Brand rules: `docs/brand-guidelines.md`.
- Preview: `npm start` (http://localhost:4173). Checks: `npm run check` (html-validate + Playwright tests, desktop and phone). Run it before every commit.
- Content rules: no invented prices, reviews, ratings, availability, address, contact details or staff; keep the fictional-concept note in the footer; the standard Overwater Villa has no private pool; no long dashes in site copy.
- README.md is the client handoff: keep it current when things change.

## Second project: MONO, menswear e-commerce demo shop
- Built in October 2026 in `shop/`: static pages pre-rendered by `shop/scripts/build.mjs` from `shop/src/templates/` (one template per page type, `layout.mjs` for the frame), vanilla ES modules in `shop/site/assets/js/`, and the browser's localStorage as the demo database (bag, admin edits, orders). Client handoff: `shop/README.md` (keep it current). How the code fits together (APIs, motion, SEO and content rules, checks): `shop/docs/BUILD-SPEC.md`.
- Commands (repo root): `npm run shop:build`, `npm run shop:start` (http://localhost:4174), `npm run shop:check` (build + html-validate + Playwright, desktop and phone; run it before every commit), `npm run shop:media` (optimised images), `npm run shop:og` (share images), `npm run shop:zip` (`dist/mono-shop-site.zip`). Deploy: `npx wrangler deploy --config shop/wrangler.jsonc`, or upload the contents of `shop/site/`. Set the live address in `shop/src/config.mjs` (`LIVE_ADDRESS`) or build with `SITE_URL=...` before launch.
- Brief: `shop/docs/master-brief.md`. Design direction and the owner's decisions: `shop/docs/design-references.md` (latest: the October 2026 refinement round: a three-slide hero with one message per slide and no sizes or specs in it; Jost only, sans-led and bold, no serif; ghost words only in the home hero; motion only for state changes, image transitions and interactions; three products per category only with genuinely different photos, the gap is listed in `shop/docs/photo-shotlist.md`; prices in US dollars). Research: `shop/docs/research/` (motion, SEO, checkout UX).
- Photos live in `shop/media/originals/` (`studio/`, `still-life/`, `lifestyle/`, `looks/`, `wide/`); never edit them. `shop/media/originals/CATALOG.md` lists every product and photo. Clothing is cut out onto one canvas (`shop/media/cutouts/`, rembg `birefnet-portrait`, one image per process or it runs out of memory). New photos: add them to the same folders, update the catalogue, `shop/scripts/media.mjs` and `shop/src/data/catalog.json`.
- MONO is a fictional demo brand: demo prices only when clearly labelled as demo data; never invent reviews, ratings, customer counts, product claims (fabric, origin, certifications) or contact details; no fake scarcity ("only N left"), countdowns or promo banners; keep the fictional-brand note in the footer; no long dashes in site copy; keep `SEO_MODE = 'demo'` while the products are fictional.
- Running the ui-ux-pro-max search script changes tracked `__pycache__` files: restore `.claude/skills/ui-ux-pro-max/scripts/__pycache__/` before committing.
- Use every skill available in the session when it helps (repo skills below plus the account's synced skills).

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
