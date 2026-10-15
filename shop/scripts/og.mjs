// Share cards (Open Graph / X) for MONO: 1200 x 630 JPEGs in
// shop/site/assets/img/og/, drawn in Chromium with the site's own fonts and
// images, then compressed with sharp (mozjpeg).
//
//   npm run shop:og                              every card
//   node shop/scripts/og.mjs --only default,product-olive-pique-polo
//
// Cards: default.jpg (the two looks), collection-<slug>.jpg for each
// category and product-<slug>.jpg for each product. No prices: a link
// preview cannot carry the "demo price" label. Words never sit on a photo:
// cut-outs stand on the plain canvas with the faint word behind them, and
// photos get their own panel beside the words.

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const SITE = join(SHOP, 'site');
const OUT = join(SITE, 'assets/img/og');
const W = 1200;
const H = 630;
const MAX_BYTES = 150 * 1024;

const catalog = JSON.parse(readFileSync(join(SHOP, 'src/data/catalog.json'), 'utf8'));
const media = JSON.parse(readFileSync(join(SHOP, 'src/data/media.json'), 'utf8'));

const onlyArg = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';
const only = onlyArg.split(',').map((s) => s.trim()).filter(Boolean);

/* ----- Inline assets (data URIs keep the page self-contained) ----- */

const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const font = (name) => dataUri(join(SITE, 'assets/fonts', `${name}.woff2`), 'font/woff2');

/** Largest WebP of an image key (cut-outs keep their transparency). */
function img(key) {
  const m = media[key];
  if (!m) throw new Error(`Unknown image key: ${key}`);
  return dataUri(join(SITE, 'assets/img', `${key}-${m.widths.at(-1)}.webp`), 'image/webp');
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const CSS = `
@font-face { font-family: "Jost"; src: url("${font('jost-400')}") format("woff2"); font-weight: 400; }
@font-face { font-family: "Jost"; src: url("${font('jost-500')}") format("woff2"); font-weight: 500; }
@font-face { font-family: "Jost"; src: url("${font('jost-700')}") format("woff2"); font-weight: 700; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: "Jost", sans-serif; color: #1C1C1A; -webkit-font-smoothing: antialiased; }
.card { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #F5F2EC; }
.card.on-canvas { background: #E9E4DD; }
.text { position: absolute; z-index: 2; left: 72px; top: 64px; bottom: 60px; width: 500px; display: flex; flex-direction: column; justify-content: space-between; }
.mark { font-weight: 500; font-size: 22px; letter-spacing: .46em; text-transform: uppercase; line-height: 1; }
.eyebrow { display: flex; align-items: center; gap: 16px; font-weight: 500; font-size: 15px; letter-spacing: .24em; text-transform: uppercase; color: #5F5A52; }
.eyebrow::before { content: ""; width: 32px; height: 1px; background: currentColor; }
.name { font-family: "Jost", sans-serif; font-weight: 700; font-size: 66px; line-height: 1.02; letter-spacing: -0.03em; margin-top: 22px; }
.name em { font-style: normal; color: #5C5F45; }
.line { margin-top: 22px; font-size: 22px; line-height: 1.5; color: #5F5A52; max-width: 30ch; }
.foot { display: flex; align-items: center; gap: 16px; font-weight: 500; font-size: 13px; letter-spacing: .22em; text-transform: uppercase; color: #5F5A52; }
.foot i { display: block; width: 44px; height: 6px; background: var(--accent, #5C5F45); }
.ghost { position: absolute; z-index: 0; font-family: "Jost", sans-serif; font-weight: 500; font-size: 230px; line-height: .8; letter-spacing: .3em; text-transform: uppercase; color: #DDD5C9; white-space: nowrap; }
.cut { position: absolute; z-index: 1; bottom: 0; height: 600px; width: auto; }
.panel { position: absolute; top: 0; right: 0; bottom: 0; width: 504px; overflow: hidden; background: var(--tone, #E9E4DD); }
.panel img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

function textBlock({ eyebrow, name, line, accent, foot = 'A fictional demo store' }) {
  return `<div class="text">
    <p class="mark">Mono</p>
    <div class="mid">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1 class="name" data-fit>${name}</h1>
      ${line ? `<p class="line">${esc(line)}</p>` : ''}
    </div>
    <p class="foot" style="--accent:${esc(accent ?? '#5C5F45')}"><i></i>${esc(foot)}</p>
  </div>`;
}

/** Cut-outs standing on the canvas with the faint word behind them. */
function canvasCard({ text, word, cuts }) {
  // cuts: [{ key, left }] positions in px from the card's left edge.
  return `<div class="card on-canvas">
    <span class="ghost" style="left:${cuts.length > 1 ? 470 : 590}px; top:150px">${esc(word)}</span>
    ${cuts.map((c) => `<img class="cut" src="${img(c.key)}" style="left:${c.left}px${c.height ? `;height:${c.height}px` : ''}" alt="">`).join('')}
    ${textBlock(text)}
  </div>`;
}

/** A photo in its own panel on the right, words on the ivory to the left. */
function photoCard({ text, key }) {
  const tone = media[key]?.color ?? '#E9E4DD';
  return `<div class="card">
    <div class="panel" style="--tone:${esc(tone)}"><img src="${img(key)}" alt=""></div>
    ${textBlock(text)}
  </div>`;
}

const frontCut = (p) => p.images.find((i) => i.kind === 'cutout' && i.view === 'Front')?.key ?? null;
const firstPhoto = (p) => p.images.find((i) => i.kind === 'photo')?.key ?? p.images[0]?.key;
const categoryOf = (slug) => catalog.categories.find((c) => c.slug === slug);

/* ----- The list of cards ----- */
const cards = [];

cards.push({
  name: 'default',
  html: canvasCard({
    word: 'Mono',
    cuts: [{ key: 'cut-look-02', left: 560 }, { key: 'cut-look-01', left: 760 }],
    text: {
      eyebrow: 'Menswear',
      name: 'Modern menswear <em>essentials</em>',
      line: 'Shirts, tees, polos and the few accessories that finish them.',
      accent: '#5C5F45',
    },
  }),
});

for (const c of catalog.categories) {
  const products = catalog.products.filter((p) => p.category === c.slug);
  const cutKeys = products.map(frontCut).filter(Boolean);
  const text = { eyebrow: 'Collection', name: esc(c.name), line: c.description, accent: products[0]?.accent };
  cards.push({
    name: `collection-${c.slug}`,
    html: cutKeys.length >= 2
      ? canvasCard({ word: c.name, cuts: [{ key: cutKeys[0], left: 560 }, { key: cutKeys[1], left: 790 }], text })
      : photoCard({ key: c.image.key, text }),
  });
}

for (const p of catalog.products) {
  const cat = categoryOf(p.category);
  const cut = frontCut(p);
  const text = { eyebrow: cat?.name ?? '', name: esc(p.name), line: p.summary, accent: p.accent };
  cards.push({
    name: `product-${p.slug}`,
    html: cut
      ? canvasCard({ word: cat?.name ?? '', cuts: [{ key: cut, left: 640 }], text })
      : photoCard({ key: firstPhoto(p), text }),
  });
}

const selected = only.length ? cards.filter((c) => only.some((o) => c.name === o || c.name.includes(o))) : cards;
if (!selected.length) {
  console.error(`No cards match --only ${onlyArg}`);
  process.exit(1);
}

/* ----- Render ----- */
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const results = [];
try {
  for (const card of selected) {
    await page.setContent(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${card.html}</body></html>`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = r; i.onerror = r; }))));
      // Long names step down in size until they fit on two lines.
      const name = document.querySelector('[data-fit]');
      const lh = () => parseFloat(getComputedStyle(name).lineHeight);
      let size = parseFloat(getComputedStyle(name).fontSize);
      while (name.getBoundingClientRect().height > lh() * 2.05 && size > 50) {
        size -= 2;
        name.style.fontSize = `${size}px`;
      }
    });
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
    let quality = 86;
    let jpg;
    do {
      jpg = await sharp(png).flatten({ background: '#F5F2EC' }).jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
      quality -= 4;
    } while (jpg.length > MAX_BYTES && quality >= 50);
    const file = join(OUT, `${card.name}.jpg`);
    writeFileSync(file, jpg);
    results.push({ card: card.name, kb: Math.round(statSync(file).size / 1024), quality: quality + 4 });
  }
} finally {
  await browser.close();
}

for (const r of results) console.log(`${r.card.padEnd(44)} ${String(r.kb).padStart(4)} KB  (q${r.quality})`);
const over = results.filter((r) => r.kb * 1024 > MAX_BYTES);
console.log(`\n${results.length} share cards written to ${OUT}${over.length ? `, ${over.length} over 150 KB` : ''}.`);
process.exit(over.length ? 1 : 0);
