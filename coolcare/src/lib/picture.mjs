// Responsive photos: AVIF and WebP in several widths, one JPEG fallback, and
// a blurred preview behind each photo while it loads. Sizes come from
// src/images.json, which `npm run media` writes.

import { html } from './html.mjs';

const file = (name, width, ext) => `assets/img/${name}-${width}.${ext}`;
const srcset = (name, image, ext) => image.widths.map((w) => `${file(name, w, ext)} ${w}w`).join(', ');

function lookup(images, name) {
  const image = images[name];
  if (!image) throw new Error(`No photo "${name}" in src/images.json. Run: npm run media`);
  return image;
}

function sources(images, name, sizes, media) {
  const image = lookup(images, name);
  const size = html`width="${image.width}" height="${image.height}"`;
  const mediaAttr = media ? html` media="${media}"` : '';
  const list = ['avif', 'webp'].map(
    (ext) => html`<source${mediaAttr} type="image/${ext}" srcset="${srcset(name, image, ext)}" sizes="${sizes}" ${size}>`,
  );
  // Art-directed sources also need a JPEG, or old browsers would get the wrong crop.
  if (media) list.push(html`<source${mediaAttr} srcset="${file(name, image.fallback, 'jpg')}" ${size}>`);
  return list;
}

// photo(images, { name, alt, sizes, eager, art: [{ name, media, sizes }], className, lqip })
export function photo(images, { name, alt, sizes, eager = false, art = [], className = '', lqip = true }) {
  const image = lookup(images, name);
  const loading = eager ? html`fetchpriority="high"` : html`loading="lazy" decoding="async"`;
  const preview = lqip ? html` style="--lqip: var(--lqip-${name})"` : '';
  return html`
    <div class="${['media', className].filter(Boolean).join(' ')}"${preview}>
      <picture>
        ${art.map((a) => sources(images, a.name, a.sizes, a.media))}
        ${sources(images, name, sizes)}
        <img class="media__img" src="${file(name, image.fallback, 'jpg')}" alt="${alt}" width="${image.width}" height="${image.height}" ${loading}>
      </picture>
    </div>`;
}
