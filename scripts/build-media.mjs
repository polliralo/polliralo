// Builds every web-ready image in site/assets from the untouched originals in
// media/originals. The originals are never modified.
//
//   npm run media                          (everything)
//   npm run media -- images                (only the listed steps: images, meta)
//   npm run media -- images --only hero    (only the named images, comma separated)
//
// Needs: Node 18.17+ and the `sharp` dev dependency.
//
// To swap a photo: replace the file in media/originals/images (keep the
// name), run `npm run media`, and the site picks it up with no HTML edits.
// Crops below are in source pixels, so re-check them if a replacement photo
// has a different composition.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_IMG = join(ROOT, 'media/originals/images');
const OUT_IMG = join(ROOT, 'site/assets/img');
const OUT_SITE = join(ROOT, 'site');

// Encoder settings, tuned by eye against the originals.
const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 76, effort: 5 };
const JPEG = { quality: 78, mozjpeg: true, progressive: true };

// Each entry produces <out>-<width>.avif and .webp for every width, plus one
// JPEG fallback. Widths larger than the (cropped) source are skipped, and the
// source width itself is included as the largest size unless `maxWidth` caps
// it (for photos that are never shown large).
const IMAGES = [
  // Hero: a wide aerial for desktops and tablets, a portrait one for phones.
  { src: 'hero-desktop.png', out: 'hero', widths: [960, 1280] },
  { src: 'hero-phone.jpg', out: 'hero-phone', widths: [] },
  // The Island: annotated aerial overview, shown uncropped.
  { src: 'aerial-overview.png', out: 'island-aerial', widths: [640, 960, 1280] },
  // Villa chapters: one main image and one inset each.
  { src: 'bathroom.png', out: 'villa-overwater-bath', widths: [640, 960, 1280] },
  {
    // The villa at the end of the boardwalk, cropped from the jetty photo.
    src: 'jetty-sunset.png', out: 'villa-overwater-boardwalk',
    crop: { left: 520, top: 230, width: 690, height: 460 }, widths: [480],
  },
  { src: 'overwater-pool-villa.png', out: 'villa-overwater-pool', widths: [640, 960, 1280] },
  { src: 'overwater-bedroom.png', out: 'villa-overwater-pool-bedroom', widths: [480, 800, 1200], maxWidth: 1200 },
  { src: 'beach-pool-villa.png', out: 'villa-beach-pool', widths: [640, 960, 1280] },
  { src: 'beach-bedroom.png', out: 'villa-beach-pool-bedroom', widths: [480, 800, 1200], maxWidth: 1200 },
  // Full-bleed and feature sections.
  { src: 'lagoon-pool.png', out: 'lagoon-pool', widths: [640, 960, 1280] },
  { src: 'dining-terrace.png', out: 'dining-terrace', widths: [640, 960, 1280] },
  { src: 'jetty-sunset.png', out: 'arrival-jetty', widths: [640, 960, 1280] },
];

async function buildImage({ src, out, crop, widths, maxWidth }) {
  const input = join(SRC_IMG, src);
  const base = () => (crop ? sharp(input).extract(crop) : sharp(input));
  const { width: srcWidth, height: srcHeight } = crop ?? (await sharp(input).metadata());
  const top = Math.min(srcWidth, maxWidth ?? srcWidth);
  const sizes = [...new Set([...widths.filter((w) => w < top), top])];

  for (const w of sizes) {
    for (const [ext, opts] of [['avif', AVIF], ['webp', WEBP]]) {
      const file = join(OUT_IMG, `${out}-${w}.${ext}`);
      await base().resize({ width: w }).toFormat(ext, opts).toFile(file);
    }
  }
  // One JPEG for browsers without AVIF or WebP support.
  const fallback = sizes.find((w) => w >= 1200) ?? sizes.at(-1);
  const jpg = join(OUT_IMG, `${out}-${fallback}.jpg`);
  await base().resize({ width: fallback }).jpeg(JPEG).toFile(jpg);
  console.log(`image  ${out}: ${sizes.join(', ')}w (${srcWidth}x${srcHeight} source)`);
}

async function buildMeta() {
  // Social sharing image, 1200x630, from the desktop hero.
  await sharp(join(SRC_IMG, 'hero-desktop.png'))
    .extract({ left: 0, top: 31, width: 1672, height: 878 })
    .resize(1200, 630)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT_IMG, 'og-image.jpg'));

  // Raster icons rendered from the SVG brand mark.
  const svg = join(OUT_SITE, 'favicon.svg');
  await sharp(svg, { density: 600 }).resize(180, 180).png().toFile(join(OUT_SITE, 'apple-touch-icon.png'));
  await sharp(svg, { density: 300 }).resize(32, 32).png().toFile(join(OUT_SITE, 'favicon-32.png'));
  console.log('meta   og-image.jpg, apple-touch-icon.png, favicon-32.png');
}

async function main() {
  mkdirSync(OUT_IMG, { recursive: true });
  const args = process.argv.slice(2);
  const steps = [];
  let only = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--only') only = (args[++i] ?? '').split(',');
    else steps.push(args[i]);
  }
  const want = (step) => steps.length === 0 || steps.includes(step);

  if (want('images')) {
    for (const spec of IMAGES) if (!only || only.includes(spec.out)) await buildImage(spec);
  }
  if (want('meta')) await buildMeta();
}

await main();
