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

## Next project: MONO, menswear e-commerce shop
- **Do not start building until the user explicitly says so.** They are choosing the design and UI direction first. Until then, only collect and organise what they send.
- Brief: `shop/docs/master-brief.md` (the user's master instruction). Photo-to-brief mapping, gaps and open decisions: `shop/docs/build-notes.md`.
- Photos live in `shop/media/originals/` (`studio/`, `still-life/`, `lifestyle/`, `wide/`); never edit them. `shop/media/originals/CATALOG.md` lists every product and photo. The user sends photos in batches: add new ones to the same folders and update the catalogue and build notes.
- MONO is a fictional demo brand: demo prices are allowed only if clearly labelled as demo data; never invent reviews, ratings, customer counts or product claims.
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
