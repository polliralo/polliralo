// Shop all, category pages and search (collections area).
// Run from the repo root:
//   SHOP_TEST_PORT=4302 npx playwright test --config playwright.shop.config.mjs shop/tests/collections.spec.mjs
// Runs in both projects (desktop 1440x900 and Pixel 7). Filters are chosen
// through the bar on wide screens and through the drawer on phones. Every
// expected count comes from src/data/catalog.json.

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));
const visible = catalog.products.filter((p) => !p.hidden);
const inCategory = (slug) => visible.filter((p) => p.category === slug);
const order = (p) => visible.indexOf(p);
const byPrice = (list, dir = 1) => [...list].sort((a, b) => dir * (a.price - b.price) || order(a) - order(b));
const slugs = (list) => list.map((p) => p.slug);
const offersSize = (p, id) => p.option?.type !== 'none' && p.variants.some((v) => String(v.id).toLowerCase() === id);
const sizeInStock = (p, id) => p.variants.some((v) => String(v.id).toLowerCase() === id && Number(v.stock) > 0);
const colourOf = (p) => String(p.colour?.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The products the shop's search should return (same rules as lib/search.js). */
function expectedSearch(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const cats = Object.fromEntries(catalog.categories.map((c) => [c.slug, `${c.name} ${c.title}`.toLowerCase()]));
  return visible.filter((p) => {
    const hay = [p.name, p.summary, p.description, p.colour?.name, cats[p.category], p.category, p.sku, ...(p.details ?? [])].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t) || (t.length > 3 && hay.includes(t.replace(/(es|s)$/, ''))));
  });
}

const LISTINGS = [
  { path: '/collections/', products: visible, title: 'Shop All Menswear' },
  ...catalog.categories.map((c) => ({ path: `/collections/${c.slug}/`, products: inCategory(c.slug), title: c.title })),
];

// Each test starts with an empty browser store (no admin edits, empty bag).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('coll-test-clean')) return;
    localStorage.clear();
    sessionStorage.setItem('coll-test-clean', '1');
  });
});

const cards = (page) => page.locator('[data-grid] > .card');
const slugsOf = async (page) => cards(page).evaluateAll((els) => els.map((el) => el.dataset.slug));
const pricesOf = async (page) => cards(page).locator('.card-price')
  .evaluateAll((els) => els.map((el) => Number(el.textContent.replace(/[^0-9.]/g, ''))));

async function open(page, path) {
  await page.goto(path);
  await expect(page.locator('[data-coll], [data-search-page]')).toHaveAttribute('data-ready', 'true');
}

const phoneLayout = (page) => page.locator('[data-open-filters]').isVisible();
const columnsFor = (page) => (page.viewportSize().width >= 1000 ? 3 : 2);

/** Choose a filter or sort option the way a visitor would on this screen size. */
async function choose(page, facet, id) {
  if (await phoneLayout(page)) {
    await page.locator('[data-open-filters]').click();
    const drawer = page.locator('#coll-drawer');
    await expect(drawer).toBeVisible();
    await drawer.locator(`[data-opt="${facet}:${id}"]`).click();
    await drawer.locator('[data-show-results]').click();
    await expect(drawer).toBeHidden();
  } else {
    const dd = page.locator(`[data-dd="${facet}"]`);
    await dd.locator('.coll-dd-btn').click();
    await expect(dd.locator('[data-dd-panel]')).toBeVisible();
    await dd.locator(`[data-opt="${facet}:${id}"]`).click();
    if (facet !== 'sort') await page.keyboard.press('Escape');
    await expect(dd.locator('[data-dd-panel]')).toBeHidden();
  }
}

/** Where the editorial tile is, next to the grid it closes. */
function tileState(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-grid]');
    const tile = grid.querySelector('[data-tile]');
    const list = [...grid.querySelectorAll(':scope > .card')];
    const box = (el) => el.getBoundingClientRect();
    const shown = Boolean(tile) && getComputedStyle(tile).display !== 'none' && !grid.hidden;
    return {
      exists: Boolean(tile),
      shown,
      cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      gap: parseFloat(getComputedStyle(grid).columnGap),
      cardW: list.length ? box(list[0]).width : 0,
      tileW: shown ? box(tile).width : 0,
      tileTop: shown ? box(tile).top : 0,
      lastTop: list.length ? box(list.at(-1)).top : 0,
      mod3: tile?.dataset.mod3,
      mod2: tile?.dataset.mod2,
    };
  });
}

/** The tile fills exactly the empty slots of the last row, or is hidden when it is full. */
function expectTileFor(state, count) {
  const empty = count === 0 ? 0 : (state.cols - (count % state.cols)) % state.cols;
  expect(state.mod3, 'data-mod3').toBe(String(count % 3));
  expect(state.mod2, 'data-mod2').toBe(String(count % 2));
  if (empty === 0) {
    expect(state.shown, 'tile hidden when the last row is full').toBe(false);
    return;
  }
  expect(state.shown, `tile shown for ${empty} empty slot(s)`).toBe(true);
  expect(Math.abs(state.tileW - (empty * state.cardW + (empty - 1) * state.gap)), 'tile spans the empty slots').toBeLessThan(2);
  expect(Math.abs(state.tileTop - state.lastTop), 'tile sits in the last row').toBeLessThan(2);
}

test.describe('category pages', () => {
  for (const cat of catalog.categories) {
    test(`${cat.slug}: heading, count and cards`, async ({ page }) => {
      const products = inCategory(cat.slug);
      await open(page, `/collections/${cat.slug}/`);
      await expect(page).toHaveTitle(`${cat.title} | MONO`);
      await expect(page.locator('h1')).toHaveText(cat.title);
      await expect(page.locator('[data-total]')).toHaveText(`${products.length} ${products.length === 1 ? 'style' : 'styles'}`);
      await expect(page.locator('[data-showing]')).toHaveText(`Showing ${products.length} of ${products.length}`);
      await expect(cards(page)).toHaveCount(products.length);
      expect(await slugsOf(page)).toEqual(slugs(products));
      // Product names are crawlable links to the product pages.
      for (const p of products) {
        await expect(page.locator(`.card[data-slug="${p.slug}"] .card-name a`)).toHaveAttribute('href', `/products/${p.slug}/`);
      }
      // The header marks the category as the current page.
      if (await page.locator('.main-nav').isVisible()) {
        await expect(page.locator(`.main-nav a[href="/collections/${cat.slug}/"]`)).toHaveAttribute('aria-current', 'page');
      }
    });
  }

  test('shop all lists every product', async ({ page }) => {
    await open(page, '/collections/');
    await expect(page).toHaveTitle('Shop All Menswear | MONO');
    await expect(page.locator('h1')).toHaveText('Shop all menswear');
    await expect(cards(page)).toHaveCount(visible.length);
    await expect(page.locator('[data-showing]')).toHaveText(`Showing ${visible.length} of ${visible.length}`);
    await expect(page.locator('[data-total]')).toHaveText(`${visible.length} styles`);
  });
});

test.describe('compact head and grid', () => {
  for (const l of LISTINGS) {
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      test(`${l.path}: products start in the first screen at ${size.width}x${size.height}`, async ({ page }) => {
        await page.setViewportSize(size);
        await open(page, l.path);
        const top = await cards(page).first().evaluate((el) => el.getBoundingClientRect().top);
        expect(top).toBeLessThan(size.height);
        // The head holds no photo: breadcrumb, title, description and count only.
        await expect(page.locator('.coll-head img')).toHaveCount(0);
        await expect(page.locator('.coll-head .crumbs')).toBeVisible();
        await expect(page.locator('.coll-head [data-total]')).toBeVisible();
      });
    }
  }

  test('the grid has 3 columns on wide screens and 2 on phones', async ({ page }) => {
    for (const [width, cols] of [[1440, 3], [1024, 3], [768, 2], [390, 2], [320, 2]]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/collections/');
      const state = await tileState(page);
      expect(state.cols, `${width}px`).toBe(cols);
    }
  });
});

test.describe('editorial tile', () => {
  for (const l of LISTINGS) {
    test(`${l.path}: the tile spans the empty slots of the last row`, async ({ page }) => {
      await open(page, l.path);
      const state = await tileState(page);
      expect(state.exists).toBe(true);
      expect(state.cols).toBe(columnsFor(page));
      expectTileFor(state, l.products.length);
    });

    test(`${l.path}: no photo shows twice, and the tile is never a product`, async ({ page }) => {
      await open(page, l.path);
      const keys = await page.locator('main img').evaluateAll((imgs) => imgs.map((img) => {
        const m = (img.getAttribute('src') ?? '').match(/\/assets\/img\/(.+?)-\d+\.(?:avif|webp|jpg|png)$/);
        return m ? m[1] : img.getAttribute('src');
      }));
      expect(keys.filter((k, i) => keys.indexOf(k) !== i), 'repeated photos').toEqual([]);
      const tile = page.locator('[data-tile]');
      await expect(tile.locator('img')).toHaveCount(1);
      await expect(tile.locator('.card-price, [data-quick-add]')).toHaveCount(0);
      // A real link with a sensible name, and a sensibly named group.
      const kicker = (await tile.locator('.coll-tile-kicker').textContent()).trim();
      await expect(page.getByRole('group', { name: kicker })).toHaveCount(1);
      const href = await tile.locator('a').getAttribute('href');
      const res = await page.request.get(href.split('#')[0]);
      expect(res.status(), `${href} exists`).toBe(200);
      if (href.includes('#')) expect(await res.text()).toContain(`id="${href.split('#')[1]}"`);
    });
  }

  test('the tile is hidden when the last row is full', async ({ page }) => {
    const cols = columnsFor(page);
    // A set of categories whose products exactly fill whole rows.
    const cats = catalog.categories.map((c) => c.slug).filter((s) => inCategory(s).length);
    let pick = null;
    for (let mask = 1; mask < 1 << cats.length && !pick; mask += 1) {
      const set = cats.filter((_, i) => mask & (1 << i));
      const n = set.reduce((sum, s) => sum + inCategory(s).length, 0);
      if (n % cols === 0) pick = { set, n };
    }
    test.skip(!pick, 'no category set fills whole rows in this catalogue');
    await open(page, `/collections/?${pick.set.map((s) => `category=${s}`).join('&')}`);
    await expect(cards(page)).toHaveCount(pick.n);
    expectTileFor(await tileState(page), pick.n);
    await expect(page.locator('[data-tile]')).toBeHidden();
  });

  test('the tile is recomputed after a filter', async ({ page }) => {
    await open(page, '/collections/');
    expectTileFor(await tileState(page), visible.length);
    const cols = columnsFor(page);
    // A category whose count leaves a different gap than the full list.
    const target = catalog.categories.find((c) => inCategory(c.slug).length % cols !== visible.length % cols)
      ?? catalog.categories[0];
    const n = inCategory(target.slug).length;
    await choose(page, 'category', target.slug);
    await expect(cards(page)).toHaveCount(n);
    await expect(page.locator('[data-tile]')).toHaveAttribute('data-mod3', String(n % 3));
    await expect(page.locator('[data-tile]')).toHaveAttribute('data-mod2', String(n % 2));
    await expect.poll(async () => (await tileState(page)).mod3).toBe(String(n % 3));
    expectTileFor(await tileState(page), n);
    // "Showing" counts products only, never the tile.
    await expect(page.locator('[data-showing]')).toHaveText(`Showing ${n} of ${visible.length}`);
  });
});

test.describe('filters and sort', () => {
  test('the size filter narrows the results and updates the address', async ({ page }) => {
    await open(page, '/collections/');
    const belts = visible.filter((p) => offersSize(p, '32'));
    test.skip(!belts.length, 'no product in waist 32');
    await choose(page, 'size', '32');
    await expect(cards(page)).toHaveCount(belts.length);
    expect(await slugsOf(page)).toEqual(slugs(belts));
    await expect(page).toHaveURL(/\/collections\/\?size=32$/);
    await expect(page.locator('[data-showing]')).toHaveText(`Showing ${belts.length} of ${visible.length}`);
    await expect(page.locator('[data-remove="size:32"]')).toBeVisible();
  });

  test('a size filter on a category page keeps only products in that size', async ({ page }) => {
    await open(page, '/collections/t-shirts/?stock=in');
    await choose(page, 'size', 'xxl');
    const expected = inCategory('t-shirts').filter((p) => sizeInStock(p, 'xxl'));
    expect(await slugsOf(page)).toEqual(slugs(expected));
    await expect(page).toHaveURL(/\?size=xxl&stock=in$/);
  });

  test('price sort orders the prices', async ({ page }) => {
    await open(page, '/collections/');
    await choose(page, 'sort', 'price-asc');
    await expect(page).toHaveURL(/\?sort=price-asc$/);
    await expect.poll(() => pricesOf(page)).toEqual(byPrice(visible).map((p) => p.price));
    await choose(page, 'sort', 'price-desc');
    await expect(page).toHaveURL(/\?sort=price-desc$/);
    await expect.poll(() => pricesOf(page)).toEqual(byPrice(visible, -1).map((p) => p.price));
  });

  test('clear all restores every product and keeps the sort', async ({ page }) => {
    const narrowed = visible.filter((p) => sizeInStock(p, '32'));
    await open(page, '/collections/?size=32&stock=in&sort=name');
    await expect(cards(page)).toHaveCount(narrowed.length);
    await page.locator('[data-active] [data-clear]').click();
    await expect(cards(page)).toHaveCount(visible.length);
    await expect(page.locator('[data-active]')).toBeHidden();
    await expect(page).toHaveURL(/\/collections\/\?sort=name$/);
    const names = await cards(page).locator('.card-name').allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('a removed chip drops only that filter', async ({ page }) => {
    await open(page, '/collections/?category=polos&category=watches');
    await expect(cards(page)).toHaveCount(inCategory('polos').length + inCategory('watches').length);
    await page.locator('[data-remove="category:watches"]').click();
    await expect(cards(page)).toHaveCount(inCategory('polos').length);
    await expect(page).toHaveURL(/\?category=polos$/);
  });

  test('address parameters restore the state on load', async ({ page }) => {
    await open(page, '/collections/?Category=polos&category=watches&sort=price-desc&utm_source=test');
    const expected = byPrice([...inCategory('polos'), ...inCategory('watches')], -1);
    expect(await slugsOf(page)).toEqual(slugs(expected));
    await expect(page.locator('[data-remove="category:polos"]')).toBeVisible();
    await expect(page.locator('[data-remove="category:watches"]')).toBeVisible();
    await expect(page.locator('#coll-dd-category input[value="polos"]')).toBeChecked();
    await expect(page.locator('#coll-drawer input[value="watches"]')).toBeChecked();
    await expect(page.locator('#coll-drawer input[data-facet="sort"][value="price-desc"]')).toBeChecked();
    // Keys are written lower-case in a stable order; unrelated parameters stay.
    await expect(page).toHaveURL(/\?utm_source=test&category=polos&category=watches&sort=price-desc$/);
  });

  test('upper-case values and unknown options are cleaned up', async ({ page }) => {
    await open(page, '/collections/polos/?size=M&colour=purple');
    await expect(page).toHaveURL(/\/collections\/polos\/\?size=m$/);
    await expect(cards(page)).toHaveCount(inCategory('polos').filter((p) => offersSize(p, 'm')).length);
  });

  test('a combination with no matches shows the empty state', async ({ page }) => {
    // Navy in XXL, in stock only: computed from the data, expected to be empty.
    const matches = visible.filter((p) => colourOf(p) === 'navy' && sizeInStock(p, 'xxl'));
    test.skip(matches.length > 0, 'the catalogue now has a navy XXL in stock');
    await open(page, '/collections/?size=xxl&colour=navy&stock=in');
    await expect(cards(page)).toHaveCount(0);
    const empty = page.locator('[data-empty]');
    await expect(empty).toBeVisible();
    await expect(empty.locator('h3')).toHaveText('No pieces match these filters');
    await expect(page.locator('[data-tile]')).toBeHidden();
    await empty.locator('[data-clear]').click();
    await expect(cards(page)).toHaveCount(visible.length);
    await expect(empty).toBeHidden();
  });

  test('the phone filter drawer opens and applies', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/collections/');
    const watches = inCategory('watches');
    const opener = page.locator('[data-open-filters]');
    await expect(opener).toBeVisible();
    await opener.click();
    const drawer = page.locator('#coll-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('h2')).toHaveText('Filter and sort');
    await drawer.locator('[data-opt="category:watches"]').click();
    await expect(drawer.locator('[data-show-results]')).toHaveText(`Show ${watches.length} ${watches.length === 1 ? 'result' : 'results'}`);
    await drawer.locator('[data-opt="sort:price-asc"]').click();
    await drawer.locator('[data-show-results]').click();
    await expect(drawer).toBeHidden();
    expect(await slugsOf(page)).toEqual(slugs(byPrice(watches)));
    await expect(page).toHaveURL(/\?category=watches&sort=price-asc$/);
    await expect(page.locator('[data-filter-badge]')).toContainText('1');
    // Focus returns to the button that opened the drawer.
    await expect(opener).toBeFocused();
  });

  test('dropdown panels open from the keyboard and close with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, '/collections/');
    const btn = page.locator('[data-dd="colour"] .coll-dd-btn');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#coll-dd-colour')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/\?colour=/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#coll-dd-colour')).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
    // A click outside also closes it.
    await btn.click();
    await expect(page.locator('#coll-dd-colour')).toBeVisible();
    await page.locator('h1').click();
    await expect(page.locator('#coll-dd-colour')).toBeHidden();
  });

  test('admin edits and custom products show up in the listing', async ({ page }) => {
    await open(page, '/collections/polos/');
    await page.evaluate(async () => {
      const store = await (await fetch('/assets/data/store.json')).json();
      const products = store.catalog.products.map((p) => (p.slug === 'navy-pique-polo' ? { ...p, hidden: true } : p));
      const olive = products.find((p) => p.slug === 'olive-pique-polo');
      products.push({ ...olive, slug: 'sand-pique-polo', name: 'Sand Piqué Polo', price: 52, colour: { name: 'Sand', hex: '#D8CBB4' }, custom: true, newArrival: false });
      localStorage.setItem('mono.catalog.v1', JSON.stringify({ version: store.version, products, savedAt: new Date().toISOString() }));
    });
    await open(page, '/collections/polos/');
    const expected = [...slugs(inCategory('polos').filter((p) => p.slug !== 'navy-pique-polo')), 'sand-pique-polo'];
    expect(await slugsOf(page)).toEqual(expected);
    await expect(page.locator('.card[data-slug="sand-pique-polo"] .card-name a')).toHaveAttribute('href', '/product/?slug=sand-pique-polo');
    await expect(page.locator('.card[data-slug="sand-pique-polo"] .card-price')).toHaveText('$52');
    await expect(page.locator('#coll-drawer [data-opt="colour:sand"]')).toHaveCount(1);
    expectTileFor(await tileState(page), expected.length);
  });
});

test.describe('search', () => {
  test('/search/?q=olive finds the olive polo', async ({ page }) => {
    const expected = expectedSearch('olive');
    await open(page, '/search/?q=olive');
    await expect(page.locator('#srch-q')).toHaveValue('olive');
    await expect(page.locator('[data-srch-results] .card[data-slug="olive-pique-polo"]')).toBeVisible();
    await expect(page.locator('[data-srch-results] .card')).toHaveCount(expected.length);
    const label = `${expected.length} ${expected.length === 1 ? 'result' : 'results'}`;
    await expect(page.locator('[data-search-status]')).toHaveText(new RegExp(`${label} for .olive.`));
  });

  test('typing updates the results and the address', async ({ page }) => {
    await open(page, '/search/');
    await page.locator('#srch-q').fill('navy');
    await expect(page).toHaveURL(/\/search\/\?q=navy$/);
    await expect(page.locator('[data-srch-results] .card')).toHaveCount(expectedSearch('navy').length);
    await expect(page.locator('[data-srch-results] .card[data-slug="navy-pique-polo"]')).toBeVisible();
    await page.locator('#srch-q').fill('watch');
    await expect(page.locator('[data-srch-results] .card')).toHaveCount(expectedSearch('watch').length);
    await page.locator('[data-search-clear]').click();
    await expect(page).toHaveURL(/\/search\/$/);
    await expect(page.locator('[data-search-empty]')).toBeVisible();
  });

  test('a search with no matches shows the empty state with categories', async ({ page }) => {
    await open(page, '/search/?q=zzzz');
    await expect(page.locator('[data-srch-results]')).toBeHidden();
    const empty = page.locator('[data-search-empty]');
    await expect(empty).toBeVisible();
    await expect(empty.locator('h2')).toContainText('Nothing matches');
    await expect(page.locator('[data-search-status]')).toContainText('No results');
    await expect(empty.locator('a[href^="/collections/"]')).toHaveCount(catalog.categories.length);
  });

  test('an empty search suggests the categories', async ({ page }) => {
    await open(page, '/search/');
    await expect(page.locator('[data-search-empty] h2')).toHaveText('Start with a category');
    await expect(page.locator('[data-search-empty] a[href^="/collections/"]')).toHaveCount(catalog.categories.length);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test.describe('page structure', () => {
  const pages = [...LISTINGS.map((l) => ({ path: l.path, title: l.title })), { path: '/search/', title: 'Search' }];

  for (const p of pages) {
    test(`${p.path}: one h1 that matches the title`, async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('h1')).toHaveCount(1);
      const h1 = (await page.locator('h1').textContent()).trim();
      expect(h1.toLowerCase()).toBe(p.title.toLowerCase());
      await expect(page).toHaveTitle(`${p.title} | MONO`);
    });
  }

  for (const p of pages.filter((x) => x.path !== '/search/')) {
    test(`${p.path}: breadcrumb JSON-LD matches the visible trail`, async ({ page }) => {
      await page.goto(p.path);
      const trail = (await page.locator('.crumbs li').allTextContents()).map((t) => t.trim());
      const data = await page.locator('script[type="application/ld+json"]').allTextContents();
      const crumbs = data.map((t) => JSON.parse(t)).find((j) => j['@type'] === 'BreadcrumbList');
      expect(crumbs).toBeTruthy();
      expect(crumbs.itemListElement.map((i) => i.name)).toEqual(trail);
      expect(crumbs.itemListElement.at(-1).item).toContain(p.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${p.path}$`));
    });
  }
});
