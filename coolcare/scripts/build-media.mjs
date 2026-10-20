// Builds every web-ready image in site/assets from the untouched originals in
// media/originals. The originals are never modified.
//
//   npm run media                          (everything)
//   npm run media -- images                (only the listed steps: images, lqip, meta)
//   npm run media -- images --only hero-desktop    (only the named images, comma separated)
//
// The images step also writes src/images.json (sizes of every photo), which
// build.mjs reads for srcset. The lqip step writes a tiny blurred preview of
// every photo into main.css (between the lqip markers), shown while the real
// photo loads. Run `npm run build` afterwards so the page matches.
//
// Needs: Node 18.17+ and the `sharp` dev dependency.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { IMAGES, SHARE_IMAGE } from './images.config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_IMG = join(ROOT, 'media/originals');
const OUT_SITE = join(ROOT, 'site');
const OUT_IMG = join(OUT_SITE, 'assets/img');
const CSS_FILE = join(OUT_SITE, 'assets/css/main.css');
const MANIFEST = join(ROOT, 'src/images.json');

// Encoder settings, tuned by eye against the originals.
const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 76, effort: 5 };
const JPEG = { quality: 78, mozjpeg: true, progressive: true };

const source = ({ src, crop }) => {
  const image = sharp(join(SRC_IMG, src));
  return crop ? image.extract(crop) : image;
};

// <name>-<width>.avif and .webp for every width, plus one JPEG fallback.
// Widths larger than the (cropped) source are skipped, and the source width
// itself is always included as the largest size.
async function buildImage(spec) {
  const { width, height } = spec.crop ?? (await sharp(join(SRC_IMG, spec.src)).metadata());
  const widths = [...new Set([...spec.widths.filter((w) => w < width), width])];

  for (const w of widths) {
    for (const [ext, opts] of [['avif', AVIF], ['webp', WEBP]]) {
      await source(spec).resize({ width: w }).toFormat(ext, opts).toFile(join(OUT_IMG, `${spec.name}-${w}.${ext}`));
    }
  }
  // One JPEG for browsers without AVIF or WebP support.
  const fallback = widths.find((w) => w >= 1000) ?? widths.at(-1);
  await source(spec).resize({ width: fallback }).jpeg(JPEG).toFile(join(OUT_IMG, `${spec.name}-${fallback}.jpg`));
  console.log(`image  ${spec.name}: ${widths.join(', ')}w (${width}x${height} source)`);
  return { width, height, widths, fallback };
}

async function buildImages(only) {
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    // First run: no manifest yet.
  }
  for (const spec of IMAGES) {
    if (!only || only.includes(spec.name)) manifest[spec.name] = await buildImage(spec);
  }
  const ordered = Object.fromEntries(IMAGES.filter((s) => manifest[s.name]).map((s) => [s.name, manifest[s.name]]));
  writeFileSync(MANIFEST, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log('image  sizes written to src/images.json');
}

// A 24px-wide WebP of each photo, inlined into main.css as --lqip-<name>.
async function buildLqip() {
  const lines = [];
  for (const spec of IMAGES) {
    const data = await source(spec).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
    lines.push(`  --lqip-${spec.name}: url("data:image/webp;base64,${data.toString('base64')}");`);
  }
  const block = `/* lqip:start (written by scripts/build-media.mjs, do not edit by hand) */\n:root {\n${lines.join('\n')}\n}\n/* lqip:end */`;
  const css = readFileSync(CSS_FILE, 'utf8');
  const pattern = /\/\* lqip:start[\s\S]*?\/\* lqip:end \*\//;
  if (!pattern.test(css)) throw new Error('main.css has no lqip:start / lqip:end markers');
  writeFileSync(CSS_FILE, css.replace(pattern, block));
  console.log(`lqip   ${lines.length} previews written to main.css`);
}

async function buildMeta() {
  // Link-preview image, 1200x630.
  await source(SHARE_IMAGE).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT_IMG, 'og-image.jpg'));

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

  if (want('images')) await buildImages(only);
  if (want('lqip')) await buildLqip();
  if (want('meta')) await buildMeta();
}

await main();
