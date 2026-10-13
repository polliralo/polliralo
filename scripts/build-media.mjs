// Builds every web-ready image and video in site/assets from the untouched
// originals in media/originals. The originals are never modified.
//
//   npm run media                 (everything)
//   npm run media -- images       (only the listed steps: images, video, posters, meta)
//
// Needs: Node 18.17+, the `sharp` dev dependency, and ffmpeg/ffprobe on the PATH.
//
// To swap a photo: replace the file in media/originals/images (keep the
// name), run `npm run media`, and the site picks it up with no HTML edits.
// Crops below are in source pixels, so re-check them if a replacement photo
// has a different composition.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_IMG = join(ROOT, 'media/originals/images');
const SRC_VIDEO = join(ROOT, 'media/originals/video/hero-aerial.mp4');
const OUT_IMG = join(ROOT, 'site/assets/img');
const OUT_VIDEO = join(ROOT, 'site/assets/video');
const OUT_SITE = join(ROOT, 'site');

// Encoder settings, tuned by eye against the originals.
const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 76, effort: 5 };
const JPEG = { quality: 78, mozjpeg: true, progressive: true };

// Each entry produces <out>-<width>.avif and .webp for every width, plus one
// JPEG fallback. Widths larger than the (cropped) source are skipped, and the
// source width itself is always included as the largest size.
const IMAGES = [
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
  { src: 'overwater-bedroom.png', out: 'villa-overwater-pool-bedroom', widths: [480, 800, 1200] },
  { src: 'beach-pool-villa.png', out: 'villa-beach-pool', widths: [640, 960, 1280] },
  { src: 'beach-bedroom.png', out: 'villa-beach-pool-bedroom', widths: [480, 800, 1200] },
  // Full-bleed and feature sections.
  { src: 'lagoon-pool.png', out: 'lagoon-pool', widths: [640, 960, 1280] },
  { src: 'dining-terrace.png', out: 'dining-terrace', widths: [640, 960, 1280] },
  { src: 'jetty-sunset.png', out: 'arrival-jetty', widths: [640, 960, 1280] },
];

// The hero video is cropped to this window for portrait screens (phones),
// so the villas stay in frame and the open water sits under the headline.
const PORTRAIT_CROP = { left: 600, top: 0, width: 608, height: 1080 };

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

function kb(file) {
  return Math.round(statSync(file).size / 1024);
}

async function buildImage({ src, out, crop, widths }) {
  const input = isAbsolute(src) ? src : join(SRC_IMG, src);
  const base = () => (crop ? sharp(input).extract(crop) : sharp(input));
  const { width: srcWidth, height: srcHeight } = crop ?? (await sharp(input).metadata());
  const sizes = [...new Set([...widths.filter((w) => w < srcWidth), srcWidth])];

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

function frameCount(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file,
  ]);
  return Number(out.toString().trim());
}

function buildVideo(tmp) {
  // Seamless loop: play the clip forward, then backward. The two turnaround
  // frames (the last and the first) are dropped from the backward half so
  // the motion never pauses on a repeated frame.
  const frames = frameCount(SRC_VIDEO);
  const master = join(tmp, 'master.mp4');
  run('ffmpeg', [
    '-v', 'error', '-y', '-i', SRC_VIDEO,
    '-filter_complex',
    `[0:v]split[f][r0];[r0]reverse,trim=start_frame=1:end_frame=${frames - 1},setpts=PTS-STARTPTS[r];[f][r]concat=n=2:v=1:a=0[v]`,
    '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv420p', master,
  ]);

  // `soften` raises the compression a little for the phone crop, where the
  // lower half sits under the text shade and fine water detail is not seen.
  // `level` is the H.264 level announced to browsers in site/assets/js/main.js
  // (avc1.640028 = High 4.0, avc1.64001f = High 3.1); keep the two in step.
  const variants = [
    { out: 'hero-1080', vf: null, soften: 0, level: '4.0' },
    { out: 'hero-720', vf: 'scale=1280:-2', soften: 0, level: '3.1' },
    {
      out: 'hero-portrait',
      vf: `crop=${PORTRAIT_CROP.width}:${PORTRAIT_CROP.height}:${PORTRAIT_CROP.left}:${PORTRAIT_CROP.top}`,
      soften: 2,
      level: '3.1',
    },
  ];
  // Two encodes of each: AV1 (smaller, used where the device decodes it
  // efficiently) and H.264 (plays in practically every browser).
  // Neither has an audio track: the hero video is silent background media.
  const codecs = [
    { suffix: '-av1.mp4', crf: 40, args: () => ['-c:v', 'libsvtav1', '-preset', '5', '-g', '240', '-svtav1-params', 'tune=0'] },
    { suffix: '.mp4', crf: 28, args: (level) => ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level:v', level] },
  ];
  for (const { out, vf, soften, level } of variants) {
    for (const { suffix, crf, args } of codecs) {
      const name = `${out}${suffix}`;
      const file = join(OUT_VIDEO, name);
      run('ffmpeg', [
        '-v', 'error', '-y', '-i', master,
        ...(vf ? ['-vf', vf] : []),
        '-an', ...args(level), '-crf', String(crf + soften), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file,
      ]);
      console.log(`video  ${name}: ${kb(file)} KB`);
    }
  }
}

async function buildPosters(tmp) {
  // Posters: the exact first frame of the video, so the switch from still
  // image to moving video is invisible.
  const frame = join(tmp, 'frame0.png');
  run('ffmpeg', ['-v', 'error', '-y', '-i', SRC_VIDEO, '-frames:v', '1', frame]);
  await buildImage({ src: frame, out: 'hero-poster', widths: [960, 1440] });
  await buildImage({ src: frame, out: 'hero-poster-portrait', crop: PORTRAIT_CROP, widths: [] });
}

async function buildMeta() {
  // Social sharing image, 1200x630, from the aerial overview.
  const aerial = join(SRC_IMG, 'aerial-overview.png');
  await sharp(aerial)
    .extract({ left: 0, top: 40, width: 1672, height: 878 })
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
  mkdirSync(OUT_VIDEO, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'nivara-media-'));
  const steps = process.argv.slice(2);
  const want = (step) => steps.length === 0 || steps.includes(step);
  try {
    if (want('images')) for (const spec of IMAGES) await buildImage(spec);
    if (want('video')) buildVideo(tmp);
    if (want('posters')) await buildPosters(tmp);
    if (want('meta')) await buildMeta();
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

await main();
