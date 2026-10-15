// Shop all, category pages and search (collections area).
// Run from the repo root:
//   SHOP_TEST_PORT=4302 npx playwright test --config playwright.shop.config.mjs shop/tests/collections.spec.mjs
// Runs in both projects (desktop 1440x900 and Pixel 7). Filters are chosen
// through the bar on wide screens and through the drawer on phones.

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));
const visible = catalog.products.filter((p) => !p.hidden);
const inCategory = (slug) => visible.filter((p) => p.category === slug);

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
      expect(await slugsOf(page)).toEqual(products.map((p) => p.slug));
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
  });
});

test.describe('filters and sort', () => {
  test('the size filter narrows the results and updates the address', async ({ page }) => {
    await open(page, '/collections/');
    await choose(page, 'size', '32');
    const belts = visible.filter((p) => p.variants.some((v) => v.id === '32'));
    await expect(cards(page)).toHaveCount(belts.length);
    expect(await slugsOf(page)).toEqual(belts.map((p) => p.slug));
    await expect(page).toHaveURL(/\/collections\/\?size=32$/);
    await expect(page.locator('[data-showing]')).toHaveText(`Showing ${belts.length} of ${visible.length}`);
    await expect(page.locator('[data-remove="size:32"]')).toBeVisible();
  });

  test('a size filter on a category page keeps only products in that size', async ({ page }) => {
    await open(page, '/collections/t-shirts/?stock=in');
    await choose(page, 'size', 'xxl');
    // The ivory tee has no XXL in stock, so only the charcoal tee is left.
    const expected = inCategory('t-shirts').filter((p) => p.variants.some((v) => v.id === 'XXL' && v.stock > 0));
    expect(await slugsOf(page)).toEqual(expected.map((p) => p.slug));
    await expect(page).toHaveURL(/\?size=xxl&stock=in$/);
  });

  test('price sort orders the prices', async ({ page }) => {
    await open(page, '/collections/');
    await choose(page, 'sort', 'price-asc');
    await expect(page).toHaveURL(/\?sort=price-asc$/);
    await expect.poll(() => pricesOf(page)).toEqual([...visible.map((p) => p.price)].sort((a, b) => a - b));
    await choose(page, 'sort', 'price-desc');
    await expect(page).toHaveURL(/\?sort=price-desc$/);
    await expect.poll(() => pricesOf(page)).toEqual([...visible.map((p) => p.price)].sort((a, b) => b - a));
  });

  test('clear all restores every product and keeps the sort', async ({ page }) => {
    await open(page, '/collections/?size=32&stock=in&sort=name');
    await expect(cards(page)).toHaveCount(1);
    await page.locator('[data-active] [data-clear]').click();
    await expect(cards(page)).toHaveCount(visible.length);
    await expect(page.locator('[data-active]')).toBeHidden();
    await expect(page).toHaveURL(/\/collections\/\?sort=name$/);
    const names = await cards(page).locator('.card-name').allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('a removed chip drops only that filter', async ({ page }) => {
    await open(page, '/collections/?category=polos&category=watches');
    await expect(cards(page)).toHaveCount(4);
    await page.locator('[data-remove="category:watches"]').click();
    await expect(cards(page)).toHaveCount(2);
    await expect(page).toHaveURL(/\?category=polos$/);
  });

  test('address parameters restore the state on load', async ({ page }) => {
    await open(page, '/collections/?Category=polos&category=watches&sort=price-desc&utm_source=test');
    expect(await slugsOf(page)).toEqual(['white-dial-watch', 'black-dial-watch', 'olive-pique-polo', 'navy-pique-polo']);
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
    await expect(cards(page)).toHaveCount(2);
  });

  test('a combination with no matches shows the empty state', async ({ page }) => {
    await open(page, '/collections/?size=xxl&colour=navy&stock=in');
    await expect(cards(page)).toHaveCount(0);
    const empty = page.locator('[data-empty]');
    await expect(empty).toBeVisible();
    await expect(empty.locator('h3')).toHaveText('No pieces match these filters');
    await empty.locator('[data-clear]').click();
    await expect(cards(page)).toHaveCount(visible.length);
    await expect(empty).toBeHidden();
  });

  test('the phone filter drawer opens and applies', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/collections/');
    const opener = page.locator('[data-open-filters]');
    await expect(opener).toBeVisible();
    await opener.click();
    const drawer = page.locator('#coll-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('h2')).toHaveText('Filter and sort');
    await drawer.locator('[data-opt="category:watches"]').click();
    await expect(drawer.locator('[data-show-results]')).toHaveText('Show 2 results');
    await drawer.locator('[data-opt="sort:price-asc"]').click();
    await drawer.locator('[data-show-results]').click();
    await expect(drawer).toBeHidden();
    expect(await slugsOf(page)).toEqual(['black-dial-watch', 'white-dial-watch']);
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
    expect(await slugsOf(page)).toEqual(['olive-pique-polo', 'sand-pique-polo']);
    await expect(page.locator('.card[data-slug="sand-pique-polo"] .card-name a')).toHaveAttribute('href', '/product/?slug=sand-pique-polo');
    await expect(page.locator('.card[data-slug="sand-pique-polo"] .card-price')).toHaveText('$52');
    await expect(page.locator('#coll-drawer [data-opt="colour:sand"]')).toHaveCount(1);
  });
});

test.describe('search', () => {
  test('/search/?q=olive finds the olive polo', async ({ page }) => {
    await open(page, '/search/?q=olive');
    await expect(page.locator('#srch-q')).toHaveValue('olive');
    await expect(page.locator('[data-srch-results] .card[data-slug="olive-pique-polo"]')).toBeVisible();
    await expect(page.locator('[data-search-status]')).toHaveText(/1 result for .olive./);
  });

  test('typing updates the results and the address', async ({ page }) => {
    await open(page, '/search/');
    await page.locator('#srch-q').fill('navy');
    await expect(page).toHaveURL(/\/search\/\?q=navy$/);
    await expect(page.locator('[data-srch-results] .card')).toHaveCount(1);
    await expect(page.locator('[data-srch-results] .card')).toHaveAttribute('data-slug', 'navy-pique-polo');
    await page.locator('#srch-q').fill('watch');
    await expect(page.locator('[data-srch-results] .card')).toHaveCount(2);
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
  const pages = [
    { path: '/collections/', title: 'Shop All Menswear' },
    ...catalog.categories.map((c) => ({ path: `/collections/${c.slug}/`, title: c.title })),
    { path: '/search/', title: 'Search' },
  ];

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
