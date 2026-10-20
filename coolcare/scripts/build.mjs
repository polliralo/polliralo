// Builds site/index.html from the components in src/, the words in
// src/content.mjs and the business details in site.config.mjs.
//
//   npm run build
//
// No dependencies. Run it after changing anything in src/, site.config.mjs,
// main.css or main.js (the page links those files with a version stamp, so
// visitors never get a stale copy after an update).

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import config from '../site.config.mjs';
import makeContent from '../src/content.mjs';
import { callHref, checkConfig, whatsappHref } from '../src/lib/links.mjs';
import page from '../src/page.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const OUTPUT = join(ROOT, 'site/index.html');

const stamp = (file) => createHash('sha256').update(readFileSync(join(ROOT, 'site', file))).digest('hex').slice(0, 10);

export function render({ year = new Date().getFullYear() } = {}) {
  checkConfig(config);
  const content = makeContent(config);
  const images = JSON.parse(readFileSync(join(ROOT, 'src/images.json'), 'utf8'));
  const links = {
    call: callHref(config),
    whatsapp: whatsappHref(config, content.messages.general),
    whatsappFor: (message) => whatsappHref(config, message),
  };
  const assets = {
    css: `assets/css/main.css?v=${stamp('assets/css/main.css')}`,
    js: `assets/js/main.js?v=${stamp('assets/js/main.js')}`,
  };
  const markup = page({ config, content, images, links, assets, year }).toString();
  // Lines left empty by optional parts (say, structured data while in concept mode).
  return `${markup.replace(/\n[ \t]*(?=\n)/g, '')}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const markup = render();
  writeFileSync(OUTPUT, markup);
  console.log(`site/index.html: ${(Buffer.byteLength(markup) / 1024).toFixed(1)} KB`);
}
