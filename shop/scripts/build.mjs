// Pre-renders every MONO page to static HTML in shop/site, plus the data file
// the browser code reads, robots.txt and (when SITE_URL is set) sitemap.xml.
//
//   npm run shop:build
//   npm run shop:build -- --only product      (only routes whose template name contains "product")
//
// Page templates live in shop/src/templates/pages/<name>.mjs. Each exports a
// default function (ctx, route) that returns { content, title, description, ... }
// (see layout.mjs). One broken template does not stop the others: the error is
// printed, the build exits with code 1 at the end.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as render from '../site/assets/js/lib/render.js';
import { layout, absolute } from '../src/templates/layout.mjs';
import * as config from '../src/config.mjs';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const SITE = join(SHOP, 'site');
const SRC = join(SHOP, 'src');

const catalog = JSON.parse(readFileSync(join(SRC, 'data/catalog.json'), 'utf8'));
const media = JSON.parse(readFileSync(join(SRC, 'data/media.json'), 'utf8'));
const sizeGuide = JSON.parse(readFileSync(join(SRC, 'data/size-guide.json'), 'utf8'));
render.configure({ media });

const version = createHash('sha1').update(JSON.stringify(catalog)).digest('hex').slice(0, 10);

const ctx = {
  catalog,
  media,
  sizeGuide,
  version,
  config,
  r: render,
  absolute,
  categories: catalog.categories,
  products: catalog.products,
  looks: catalog.looks,
  getProduct: (slug) => catalog.products.find((p) => p.slug === slug) ?? null,
  getCategory: (slug) => catalog.categories.find((c) => c.slug === slug) ?? null,
  productsIn: (category) => catalog.products.filter((p) => p.category === category),
};

/* ----- Routes ----- */
const routes = [
  { path: '/', template: 'home' },
  { path: '/collections/', template: 'collections' },
  ...catalog.categories.map((c) => ({ path: `/collections/${c.slug}/`, template: 'collection', params: { category: c.slug } })),
  ...catalog.products.map((p) => ({ path: `/products/${p.slug}/`, template: 'product', params: { slug: p.slug } })),
  { path: '/product/', template: 'product-dynamic' },
  { path: '/search/', template: 'search' },
  { path: '/cart/', template: 'cart' },
  { path: '/checkout/', template: 'checkout' },
  { path: '/order-confirmation/', template: 'order-confirmation' },
  { path: '/about/', template: 'about' },
  { path: '/contact/', template: 'contact' },
  { path: '/size-guide/', template: 'size-guide' },
  { path: '/privacy/', template: 'privacy' },
  { path: '/shipping-returns/', template: 'shipping-returns' },
  { path: '/admin/', template: 'admin', params: { view: 'dashboard' } },
  { path: '/admin/products/', template: 'admin', params: { view: 'products' } },
  { path: '/admin/orders/', template: 'admin', params: { view: 'orders' } },
  { path: '/404.html', template: 'not-found' },
];

// --only takes one or more comma-separated template names (substring match).
const onlyArg = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const onlyList = onlyArg ? onlyArg.split(',').map((s) => s.trim()).filter(Boolean) : null;
const selected = (route) => !onlyList || onlyList.some((name) => route.template.includes(name));
const only = Boolean(onlyList);

function outFile(path) {
  if (path.endsWith('.html')) return join(SITE, path);
  return join(SITE, path, 'index.html');
}

const cache = new Map();
async function loadTemplate(name) {
  if (!cache.has(name)) {
    const file = join(SRC, 'templates/pages', `${name}.mjs`);
    if (!existsSync(file)) throw new Error(`No template file: src/templates/pages/${name}.mjs`);
    cache.set(name, (await import(pathToFileURL(file).href + `?v=${Date.now()}`)).default);
  }
  return cache.get(name);
}

let failures = 0;
const indexable = [];
const seen = { title: new Map(), description: new Map() };

for (const route of routes) {
  if (!selected(route)) continue;
  try {
    const tpl = await loadTemplate(route.template);
    const page = await tpl(ctx, route);
    const htmlDoc = layout({ categories: catalog.categories, ...page, path: route.path === '/404.html' ? '/404.html' : route.path });
    const file = outFile(route.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, htmlDoc);
    if (!page.noindex && route.path !== '/404.html') {
      indexable.push(route.path);
      const docTitle = page.fullTitle ?? `${page.title} | ${config.SITE_NAME}`;
      seen.title.set(docTitle, [...(seen.title.get(docTitle) ?? []), route.path]);
      const desc = page.description ?? config.DEFAULT_DESCRIPTION;
      seen.description.set(desc, [...(seen.description.get(desc) ?? []), route.path]);
    }
  } catch (err) {
    failures += 1;
    console.error(`\n✗ ${route.path} (${route.template})\n${err.stack ?? err}`);
  }
}

/* ----- Every indexable page needs its own title and description ----- */
for (const [kind, map] of Object.entries(seen)) {
  for (const [value, paths] of map) {
    if (paths.length > 1) {
      failures += 1;
      console.error(`\n✗ Duplicate ${kind} on ${paths.join(', ')}: "${value}"`);
    }
  }
}

/* ----- Data for the browser ----- */
mkdirSync(join(SITE, 'assets/data'), { recursive: true });
writeFileSync(join(SITE, 'assets/data/store.json'), JSON.stringify({ version, catalog, media, sizeGuide }));
// The bare manifest is only needed by the build; keep the site folder tidy.
if (existsSync(join(SITE, 'assets/data/media.json'))) rmSync(join(SITE, 'assets/data/media.json'));

/* ----- robots.txt, _headers and sitemap.xml -----
   Utility pages (bag, checkout, search, admin) carry a noindex meta tag. They
   are NOT blocked in robots.txt: a blocked page is never fetched, so its
   noindex would never be seen (shop/docs/research/seo.md, section 3). */
const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  config.SITE_URL ? `Sitemap: ${config.SITE_URL}/sitemap.xml` : '# Add "Sitemap: <SITE_URL>/sitemap.xml" here once SITE_URL is set in shop/src/config.mjs.',
  '',
].join('\n');
if (!only) writeFileSync(join(SITE, 'robots.txt'), robots);

// Cloudflare (and Netlify) read _headers from the upload folder. Image names
// do not change when a photo is replaced, so images are cached for a week, not
// forever; the fonts never change.
const headers = `/admin/*
  X-Robots-Tag: noindex, nofollow
/assets/img/*
  Cache-Control: public, max-age=604800
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;
if (!only) writeFileSync(join(SITE, '_headers'), headers);

if (!only) {
  const sitemapFile = join(SITE, 'sitemap.xml');
  if (config.SITE_URL) {
    const today = new Date().toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
      + indexable.map((p) => `  <url><loc>${config.SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')
      + `\n</urlset>\n`;
    writeFileSync(sitemapFile, xml);
  } else if (existsSync(sitemapFile)) {
    rmSync(sitemapFile);
  }
}

const built = routes.filter(selected).length;
console.log(`\nBuilt ${built} pages${failures ? `, ${failures} failed` : ''}. Catalogue version ${version}.`);
if (!config.SITE_URL) console.log('SITE_URL is empty: canonical links are paths and no sitemap.xml was written.');
process.exit(failures ? 1 : 0);
