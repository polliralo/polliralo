// Cross-area journeys: the paths a shopper and a shop owner take through
// several areas at once (home, collections, search, product, bag, checkout,
// confirmation and the demo admin). Runs in both projects (desktop 1440x900
// and Pixel 7). Each test gets a fresh browser context, so localStorage starts
// empty; an init script seeds a starting state only where a journey needs one.
// Run from the repo root:
//   SHOP_TEST_PORT=4320 npx playwright test --config playwright.shop.config.mjs shop/tests/journeys.spec.mjs

import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));

const OLIVE = { slug: 'olive-pique-polo', name: 'Olive Piqué Polo' };   // $48, XXL stock 2
const NAVY = { slug: 'navy-pique-polo', name: 'Navy Piqué Polo' };      // $48
const WATCH = { slug: 'black-dial-watch', name: 'Black Dial Watch' };   // $180, one size
const STRIPE = { slug: 'blue-stripe-shirt', name: 'Blue Stripe Shirt' }; // S sold out
const SAND = { slug: 'sand-linen-shirt', name: 'Sand Linen Shirt' };     // made in the admin

/** The header shows the menu button instead of the nav at 1040px and below. */
const usesMenu = (page) => (page.viewportSize()?.width ?? 1440) <= 1040;

const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key);
const badge = (page) => page.locator('.site-header [data-bag-count]');
const drawer = (page) => page.locator('#cart-drawer');
const drawerLine = (page, slug, variant) => drawer(page).locator(`[data-line][data-slug="${slug}"][data-variant="${variant}"]`);
const bagLine = (page, slug, variant) => page.locator(`[data-cart-lines] [data-line][data-slug="${slug}"][data-variant="${variant}"]`);
const card = (page, slug) => page.locator(`[data-grid] .card[data-slug="${slug}"]`);
const linksTo = (page, slug) => page.locator(`main a[href="/products/${slug}/"]`);
const addButton = (page) => page.locator('[data-pdp-form] [data-pdp-add]');
const sizeRadio = (page, name) => page.getByRole('radio', { name, exact: true });
const adminRow = (page, slug) => page.locator(`tr[data-row="${slug}"]`);
const editor = (page) => page.locator('#adm-editor');
const confirmBox = (page) => page.locator('dialog.adm-confirm');

/** Load a store page and wait until the catalogue has loaded in the browser. */
async function ready(page, path) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/store-ready/);
  if (path.startsWith('/collections/')) await expect(page.locator('[data-coll]')).toHaveAttribute('data-ready', 'true');
  if (path.startsWith('/search/')) await expect(page.locator('[data-search-page]')).toHaveAttribute('data-ready', 'true');
}

async function adminReady(page, path) {
  await page.goto(path);
  await expect(page.locator('[data-admin-view]')).toHaveAttribute('aria-busy', 'false');
}

/** Seed the bag once per test (init scripts run again on every navigation). */
async function seedBag(page, items) {
  await page.addInitScript((bag) => {
    if (sessionStorage.getItem('journey-bag-seeded')) return;
    localStorage.setItem('mono.cart.v1', JSON.stringify(bag));
    sessionStorage.setItem('journey-bag-seeded', '1');
  }, items);
}

/** Header nav on wide screens, the menu drawer on phones. */
async function openCategory(page, name) {
  if (usesMenu(page)) {
    await page.locator('.site-header').getByRole('button', { name: 'Open menu' }).click();
    const menu = page.locator('#menu-drawer');
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name, exact: true }).click();
  } else {
    await page.locator('.main-nav').getByRole('link', { name, exact: true }).click();
  }
}

/** On /checkout/: fill a valid form, place the order, return its id from the confirmation URL. */
async function placeOrder(page) {
  await expect(page.locator('[data-checkout]')).toHaveAttribute('data-state', 'ready');
  await page.fill('#co-email', 'alex@example.com');
  await page.fill('#co-name', 'Alex Morgan');
  await page.fill('#co-address1', '12 Market Street');
  await page.fill('#co-city', 'Springfield');
  await page.fill('#co-postcode', '10001');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await page.waitForURL(/\/order-confirmation\/\?order=MONO-/);
  await expect(page.locator('h1')).toHaveText('Order confirmed');
  return new URL(page.url()).searchParams.get('order');
}

async function openSearchDialog(page) {
  await page.locator('.site-header [data-open-search]').click();
  const dialog = page.locator('#search-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#search-q')).toBeFocused();
  return dialog;
}

/* ---------------------------------------------------------------------- */

test.describe('1. shopper, start to finish', () => {
  test('home, category, product, bag, checkout, confirmation, then the order in the admin', async ({ page }) => {
    await ready(page, '/');
    await openCategory(page, 'Polos');
    await expect(page).toHaveURL(/\/collections\/polos\/$/);
    await expect(page.locator('h1')).toHaveText("Men's Polo Shirts");
    await expect(page.locator('[data-coll]')).toHaveAttribute('data-ready', 'true');

    await card(page, OLIVE.slug).getByRole('link', { name: OLIVE.name }).click();
    await expect(page).toHaveURL(/\/products\/olive-pique-polo\/$/);
    await expect(page.locator('html')).toHaveClass(/store-ready/);
    await expect(page.locator('h1')).toHaveText(OLIVE.name);

    await sizeRadio(page, 'M').check();
    await addButton(page).click();
    await expect(drawer(page)).toBeVisible();
    const line = drawerLine(page, OLIVE.slug, 'M');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-meta')).toContainText('Size: M');
    await expect(badge(page)).toHaveText('1');

    await drawer(page).getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/$/);
    await expect(page.locator('[data-place-totals] .co-total')).toContainText('$54.00');
    const id = await placeOrder(page);

    await expect(page.locator('[data-order-id]')).toHaveText(id);
    const body = page.locator('[data-order-body]');
    await expect(body).toContainText(OLIVE.name);
    await expect(body).toContainText('Size: M · Qty 1');
    await expect(body).toContainText('Standard delivery');
    await expect(body.locator('.co-total')).toContainText('$54.00');
    await expect(badge(page)).toHaveText('0');

    await page.getByRole('link', { name: 'See it in the demo admin' }).click();
    await expect(page).toHaveURL(/\/admin\/orders\/$/);
    await expect(page.locator('[data-admin-view]')).toHaveAttribute('aria-busy', 'false');
    const row = page.locator(`tr[data-order="${id}"]`);
    await expect(row).toContainText('Alex Morgan');
    await expect(row).toContainText('$54.00');
    await row.getByRole('button', { name: new RegExp(id) }).click();
    const detail = page.locator(`#adm-od-${id}`);
    await expect(detail).toBeVisible();
    await expect(detail.locator('.adm-item-text .muted')).toHaveText('Size M / Qty 1 / $48.00');
    await expect(detail).toContainText('12 Market Street');
    await expect(detail).toContainText('alex@example.com');
    const status = page.getByLabel(`Status of order ${id}`);
    await expect(status).toHaveValue('received');
    await status.selectOption('packed');
    await expect(page.getByLabel(`Status of order ${id}`)).toHaveValue('packed');
    expect((await stored(page, 'mono.orders.v1')).find((o) => o.id === id).status).toBe('packed');

    // Saved: still packed after a reload, and the confirmation page reads it too.
    await adminReady(page, '/admin/orders/');
    await expect(page.getByLabel(`Status of order ${id}`)).toHaveValue('packed');
    await page.goto(`/order-confirmation/?order=${id}`);
    await expect(page.locator('[data-order-date]')).toContainText('Status: Packed (demo)');
  });
});

test.describe('2. admin edits reach the store', () => {
  test('a new price and a hidden product show everywhere, and reset brings both back', async ({ page }) => {
    await seedBag(page, [{ slug: OLIVE.slug, variant: 'M', qty: 1 }]);

    await adminReady(page, '/admin/products/');
    await adminRow(page, OLIVE.slug).getByRole('button', { name: `Edit ${OLIVE.name}` }).click();
    await expect(editor(page)).toBeVisible();
    await editor(page).locator('#ed-price').fill('52');
    await editor(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(editor(page)).toBeHidden();
    await expect(adminRow(page, OLIVE.slug)).toContainText('$52.00');
    await adminRow(page, NAVY.slug).getByRole('button', { name: `Hide ${NAVY.name}` }).click();
    await expect(adminRow(page, NAVY.slug)).toContainText('Hidden');

    // Product page: the new price, and no link (colour swatch, rails) to the hidden polo.
    await ready(page, `/products/${OLIVE.slug}/`);
    await expect(page.locator('[data-pdp-price]')).toHaveText('$52');
    await expect(page.locator('[data-sticky-price]')).toHaveText('$52');
    await expect(linksTo(page, NAVY.slug)).toHaveCount(0);
    await expect(page.locator('.pdp-swatches')).toHaveCount(0);
    // A page whose "Complete the look" lists the navy polo drops it.
    await ready(page, '/products/silver-aviator-sunglasses/');
    await expect(page.locator('[data-pdp-look] [data-look-slug]')).toHaveCount(2);
    await expect(linksTo(page, NAVY.slug)).toHaveCount(0);

    // Category grid.
    await ready(page, '/collections/polos/');
    await expect(card(page, OLIVE.slug).locator('.card-price')).toHaveText('$52');
    await expect(card(page, NAVY.slug)).toHaveCount(0);
    await expect(page.locator('[data-grid] .card')).toHaveCount(1);
    await expect(page.locator('[data-total]')).toHaveText('1 style');
    await expect(linksTo(page, NAVY.slug)).toHaveCount(0);

    // Search page and the header search dialog.
    await ready(page, '/search/?q=polo');
    await expect(page.locator('[data-search-status]')).toHaveText('1 result for “polo”');
    await expect(card(page, OLIVE.slug).locator('.card-price')).toHaveText('$52');
    await expect(card(page, NAVY.slug)).toHaveCount(0);
    const dialog = await openSearchDialog(page);
    await page.locator('#search-q').fill('navy');
    await expect(dialog.locator('[data-search-results]')).toContainText('Nothing matches "navy"');
    await page.locator('#search-q').fill('polo');
    await expect(dialog.locator('.mini-card')).toHaveCount(1);
    await expect(dialog.locator('.mini-card')).toContainText(OLIVE.name);
    await expect(dialog.locator('.mini-card')).toContainText('$52');

    // Home: three message slides with no prices; the brand slide no longer
    // shows the hidden navy polo; no navy polo anywhere; the olive polo at the new price.
    await ready(page, '/');
    const carousel = page.locator('[data-carousel]');
    await expect(carousel.locator('[data-slide]')).toHaveCount(3);
    await expect(carousel.locator('[data-hero-total]')).toHaveText('03');
    await expect(carousel.locator('[data-art]')).not.toHaveAttribute('data-art-slug', NAVY.slug);
    await expect(carousel.locator('img[src*="navy-pique-polo"]')).toHaveCount(0);
    await expect(linksTo(page, NAVY.slug)).toHaveCount(0);
    await expect(page.locator(`[data-new-list] .card[data-slug="${OLIVE.slug}"] .card-price`)).toHaveText('$52');
    await expect(page.locator(`.home-look-list[data-look="look-01"] .home-item[data-slug="${OLIVE.slug}"] .home-item-price`)).toHaveText('$52');

    // The hidden product's own page.
    await ready(page, `/products/${NAVY.slug}/`);
    await expect(page.locator('h1')).toHaveText('No longer available');
    await expect(page).toHaveTitle('No Longer Available | MONO');
    await expect(page.getByRole('link', { name: 'Shop Polos' })).toHaveAttribute('href', '/collections/polos/');

    // The bag holds the olive polo: it shows the new price.
    await ready(page, '/cart/');
    const line = bagLine(page, OLIVE.slug, 'M');
    await expect(line.locator('.line-meta')).toContainText('$52');
    await expect(line.locator('.line-price')).toHaveText('$52.00');
    await expect(page.locator('[data-cart-total]')).toHaveText('$58.00');

    // Reset demo data restores both.
    await adminReady(page, '/admin/');
    const catalogueTile = page.locator('.adm-metric').filter({ has: page.locator('dt', { hasText: 'Catalogue' }) });
    await expect(catalogueTile.locator('.adm-metric-value')).toHaveText('Edited');
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    await confirmBox(page).getByRole('button', { name: 'Reset demo data' }).click();
    await expect(confirmBox(page)).toBeHidden();
    // The reset runs on the dialog's close event (a task after it hides): wait for the dashboard to show it.
    await expect(catalogueTile.locator('.adm-metric-value')).toHaveText('Demo data');
    expect(await stored(page, 'mono.catalog.v1')).toBeNull();

    await ready(page, `/products/${OLIVE.slug}/`);
    await expect(page.locator('[data-pdp-price]')).toHaveText('$48');
    await expect(page.locator(`[data-pdp] .pdp-colour a[href="/products/${NAVY.slug}/"]`)).toHaveCount(1);
    await ready(page, `/products/${NAVY.slug}/`);
    await expect(page.locator('h1')).toHaveText(NAVY.name);
    await ready(page, '/collections/polos/');
    await expect(page.locator('[data-grid] .card')).toHaveCount(2);
    await expect(card(page, OLIVE.slug).locator('.card-price')).toHaveText('$48');
    await ready(page, '/search/?q=navy');
    await expect(page.locator('[data-search-status]')).toHaveText('1 result for “navy”');
    await ready(page, '/');
    await expect(page.locator('[data-carousel] [data-slide]')).toHaveCount(3);
    await expect(page.locator('[data-carousel] [data-art]')).toHaveAttribute('data-art-slug', NAVY.slug);
    await ready(page, '/cart/');
    await expect(bagLine(page, OLIVE.slug, 'M').locator('.line-price')).toHaveText('$48.00');
  });
});

test.describe('3. a product made in the admin', () => {
  test('shows in its category and in search, opens on /product/?slug= and can be bought', async ({ page }) => {
    await adminReady(page, '/admin/products/');
    await page.getByRole('button', { name: 'Add product' }).click();
    const ed = editor(page);
    await expect(ed).toBeVisible();
    await ed.locator('#ed-name').fill(SAND.name);
    await expect(ed.locator('#ed-slug')).toHaveValue(SAND.slug);
    await ed.locator('#ed-category').selectOption('shirts');
    await ed.locator('#ed-price').fill('72');
    await ed.locator('#ed-summary').fill('A relaxed shirt in warm sand.');
    await ed.locator('#ed-description').fill('A relaxed shirt in warm sand with a soft collar.');
    await ed.locator('#ed-colourName').fill('Sand');
    const options = ed.locator('[data-vrow]');
    await options.nth(1).locator('[data-v="stock"]').fill('4'); // M
    await options.nth(2).locator('[data-v="stock"]').fill('2'); // L
    const image = ed.locator('[data-irow]').first();
    await image.locator('[data-i="key"]').selectOption('cut-ivory-oxford-shirt-front');
    await expect(image.locator('[data-ithumb] img')).toHaveCount(1);
    await image.locator('[data-i="alt"]').fill('Sand linen shirt, front view');
    await ed.getByRole('button', { name: 'Add product' }).click();
    await expect(ed).toBeHidden();
    await expect(adminRow(page, SAND.slug)).toBeVisible();

    // Its category grid.
    await ready(page, '/collections/shirts/');
    const c = card(page, SAND.slug);
    await expect(c).toBeVisible();
    await expect(c.locator('.card-price')).toHaveText('$72');
    await expect(c.getByRole('link', { name: SAND.name })).toHaveAttribute('href', `/product/?slug=${SAND.slug}`);
    // The seed shirts plus the one just made.
    const shirts = catalog.products.filter((x) => x.category === 'shirts').length + 1;
    await expect(page.locator('[data-total]')).toHaveText(`${shirts} styles`);

    // Search.
    await ready(page, '/search/?q=sand');
    await expect(page.locator('[data-search-status]')).toHaveText('1 result for “sand”');
    await expect(card(page, SAND.slug)).toBeVisible();

    // Its card opens the dynamic product page.
    await card(page, SAND.slug).getByRole('link', { name: SAND.name }).click();
    await expect(page).toHaveURL(new RegExp(`/product/\\?slug=${SAND.slug}$`));
    await expect(page.locator('h1')).toHaveText(SAND.name);
    await expect(page).toHaveTitle(`${SAND.name} | Men's Shirts | MONO`);
    await expect(page.locator('[data-pdp-price]')).toHaveText('$72');
    await expect(page.locator('.pdp-price .tag')).toHaveText('Demo price');
    await expect(sizeRadio(page, 'S, sold out')).toBeDisabled();

    // Add to bag and buy.
    await sizeRadio(page, 'M').check();
    await addButton(page).click();
    await expect(drawerLine(page, SAND.slug, 'M')).toBeVisible();
    await expect(drawerLine(page, SAND.slug, 'M')).toContainText(SAND.name);
    await drawer(page).getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/$/);
    const id = await placeOrder(page);
    const body = page.locator('[data-order-body]');
    await expect(body).toContainText(SAND.name);
    await expect(body).toContainText('Size: M · Qty 1');
    await expect(body.locator('.co-total')).toContainText('$78.00');
    await expect(body.getByRole('link', { name: SAND.name })).toHaveAttribute('href', `/product/?slug=${SAND.slug}`);

    const order = (await stored(page, 'mono.orders.v1')).find((o) => o.id === id);
    expect(order.items).toEqual([expect.objectContaining({ slug: SAND.slug, variant: 'M', qty: 1, unitPrice: 72, lineTotal: 72 })]);
    const saved = (await stored(page, 'mono.catalog.v1')).products.find((p) => p.slug === SAND.slug);
    expect(saved.variants.find((v) => v.id === 'M').stock).toBe(3);
  });
});

test.describe('4. quick add from a card', () => {
  test('one size goes straight in; a sized item asks for the size first; sold-out sizes cannot be chosen; the order reads right in the admin', async ({ page }) => {
    await ready(page, '/collections/watches/');
    await card(page, WATCH.slug).getByRole('button', { name: `Quick add ${WATCH.name}` }).click();
    await expect(drawer(page)).toBeVisible();
    await expect(drawerLine(page, WATCH.slug, 'OS')).toBeVisible();
    await expect(badge(page)).toHaveText('1');
    await expect(card(page, WATCH.slug).locator('[data-quick-panel]')).toBeHidden();
    await drawer(page).getByRole('button', { name: 'Close bag' }).click();
    await expect(drawer(page)).toBeHidden();

    await ready(page, '/collections/shirts/');
    const shirt = card(page, STRIPE.slug);
    await shirt.getByRole('button', { name: `Quick add ${STRIPE.name}` }).click();
    const panel = shirt.locator('[data-quick-panel]');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Choose size');
    await expect(shirt.locator('.card-add')).toHaveAttribute('aria-expanded', 'true');
    // Nothing is added until a size is chosen.
    await expect(drawer(page)).toBeHidden();
    await expect(badge(page)).toHaveText('1');

    // S is sold out: shown, but not a button, and clicking it adds nothing.
    const soldOut = panel.locator('.chip.is-out');
    await expect(soldOut).toHaveCount(1);
    await expect(soldOut).toHaveText('S sold out');
    await expect(soldOut).toHaveAttribute('aria-disabled', 'true');
    await expect(panel.locator('[data-quick-size="S"]')).toHaveCount(0);
    await soldOut.click({ force: true });
    await expect(drawer(page)).toBeHidden();
    await expect(badge(page)).toHaveText('1');
    expect((await stored(page, 'mono.cart.v1')).some((i) => i.slug === STRIPE.slug)).toBe(false);

    await panel.locator('[data-quick-size="M"]').click();
    await expect(drawer(page)).toBeVisible();
    await expect(drawerLine(page, STRIPE.slug, 'M')).toBeVisible();
    await expect(badge(page)).toHaveText('2');
    await expect(panel).toBeHidden();
    expect(await stored(page, 'mono.cart.v1')).toEqual([
      { slug: WATCH.slug, variant: 'OS', qty: 1 },
      { slug: STRIPE.slug, variant: 'M', qty: 1 },
    ]);

    // Buy both. The confirmation and the admin name each line's option once.
    await drawer(page).getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/$/);
    const id = await placeOrder(page);
    const body = page.locator('[data-order-body]');
    await expect(body).toContainText('One size · Qty 1');
    await expect(body).toContainText('Size: M · Qty 1');
    await expect(body.locator('.co-total')).toContainText('$244.00');
    await adminReady(page, `/admin/orders/?order=${id}`);
    const detail = page.locator(`#adm-od-${id}`);
    await expect(detail).toBeVisible();
    const itemText = (name) => detail.locator('.adm-item', { hasText: name }).locator('.adm-item-text .muted');
    await expect(itemText(WATCH.name)).toHaveText('One size / Qty 1 / $180.00');
    await expect(itemText(STRIPE.name)).toHaveText('Size M / Qty 1 / $64.00');
  });
});

test.describe('5. the header search dialog', () => {
  test('"watch" shows results, one opens its product page, and Enter goes to /search/?q=watch', async ({ page }) => {
    await ready(page, '/');
    let dialog = await openSearchDialog(page);
    await page.locator('#search-q').fill('watch');
    const results = dialog.locator('[data-search-results]');
    await expect(results).toContainText('2 results');
    await expect(results.locator('.mini-card')).toHaveCount(2);
    await results.locator('.mini-card', { hasText: WATCH.name }).click();
    await expect(page).toHaveURL(/\/products\/black-dial-watch\/$/);
    await expect(page.locator('h1')).toHaveText(WATCH.name);

    await expect(page.locator('html')).toHaveClass(/store-ready/);
    dialog = await openSearchDialog(page);
    await page.locator('#search-q').fill('watch');
    await expect(dialog.locator('.mini-card')).toHaveCount(2);
    await page.locator('#search-q').press('Enter');
    await expect(page).toHaveURL(/\/search\/\?q=watch$/);
    await expect(page.locator('[data-search-page]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#srch-q')).toHaveValue('watch');
    await expect(page.locator('[data-search-status]')).toHaveText('2 results for “watch”');
    await expect(page.locator('[data-grid] .card')).toHaveCount(2);
    await expect(card(page, 'black-dial-watch')).toBeVisible();
    await expect(card(page, 'white-dial-watch')).toBeVisible();
  });
});

test.describe('6. persistence and stock', () => {
  test('the bag survives a reload', async ({ page }) => {
    await ready(page, `/products/${OLIVE.slug}/`);
    await sizeRadio(page, 'L').check();
    await addButton(page).click();
    await expect(drawerLine(page, OLIVE.slug, 'L')).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/store-ready/);
    await expect(badge(page)).toHaveText('1');
    await page.locator('.site-header [data-open-cart]').click();
    await expect(drawerLine(page, OLIVE.slug, 'L')).toBeVisible();
    await ready(page, '/cart/');
    await expect(bagLine(page, OLIVE.slug, 'L')).toBeVisible();
    await expect(page.locator('[data-cart-total]')).toHaveText('$54.00');
  });

  test('buying the last units of a size shows that size as sold out afterwards', async ({ page }) => {
    await ready(page, `/products/${OLIVE.slug}/`);
    await sizeRadio(page, 'XXL').check();
    await expect(page.locator('[data-pdp-stock]')).toHaveText('In stock');
    const plus = page.locator('[data-pdp-qty] [data-step="1"]');
    await plus.click();
    await expect(page.locator('[data-pdp-qty] output')).toHaveText('2');
    await expect(plus).toBeDisabled();
    await addButton(page).click();
    await expect(drawerLine(page, OLIVE.slug, 'XXL').locator('output')).toHaveText('2');
    await drawer(page).getByRole('link', { name: 'Checkout' }).click();
    await placeOrder(page);
    await expect(page.locator('[data-order-body]')).toContainText('Size: XXL · Qty 2');

    // The product page (even asked for ?size=XXL) shows XXL as sold out.
    await ready(page, `/products/${OLIVE.slug}/?size=XXL`);
    await expect(sizeRadio(page, 'XXL, sold out')).toBeDisabled();
    await expect(page.locator('input[name="size"]:checked')).toHaveCount(0);
    await expect(page.locator('[data-pdp-stock]')).toHaveText('Sold out in XXL');
    await expect(sizeRadio(page, 'M')).toBeEnabled();

    // So do the quick add chips and the size chips in the home page's look panel.
    await ready(page, '/collections/polos/');
    await card(page, OLIVE.slug).getByRole('button', { name: `Quick add ${OLIVE.name}` }).click();
    const panel = card(page, OLIVE.slug).locator('[data-quick-panel]');
    await expect(panel.locator('.chip.is-out')).toHaveText('XXL sold out');
    await expect(panel.locator('[data-quick-size="XXL"]')).toHaveCount(0);
    await ready(page, '/');
    const lookPolo = page.locator(`.home-look-list[data-look="look-01"] .home-item[data-slug="${OLIVE.slug}"]`);
    await lookPolo.locator('[data-choose]').click();
    await expect(lookPolo.locator('.chip', { hasText: 'XXL' })).toBeDisabled();
    await expect(lookPolo.locator('.chip', { hasText: 'XXL' })).toHaveText('XXL sold out');
  });

  test('a product deleted in the admin while in the bag blocks checkout until it is removed', async ({ page }) => {
    await seedBag(page, [{ slug: OLIVE.slug, variant: 'M', qty: 1 }, { slug: WATCH.slug, variant: 'OS', qty: 1 }]);
    await adminReady(page, '/admin/products/');
    await adminRow(page, WATCH.slug).getByRole('button', { name: `Delete ${WATCH.name}` }).click();
    await confirmBox(page).getByRole('button', { name: 'Delete product' }).click();
    await expect(adminRow(page, WATCH.slug)).toHaveCount(0);

    await ready(page, '/cart/');
    const gone = bagLine(page, WATCH.slug, 'OS');
    await expect(gone).toContainText('Unavailable item');
    await expect(gone.locator('.line-issue')).toHaveText('No longer available. Remove it to continue.');
    await expect(page.locator('[data-cart-issues]')).toContainText('One item is no longer available.');
    await expect(page.locator('[data-cart-total]')).toHaveText('$54.00');
    const checkout = page.locator('[data-cart-checkout]');
    await expect(checkout).toHaveAttribute('aria-disabled', 'true');
    await checkout.click({ force: true });
    await expect(page.locator('[data-cart-blocked]')).toBeVisible();
    await expect(page).toHaveURL(/\/cart\/$/);

    // The bag drawer and the checkout page block it too.
    await page.locator('.site-header [data-open-cart]').click();
    await expect(drawer(page).locator('[data-drawer-blocked]')).toBeVisible();
    await expect(drawer(page).locator('[data-drawer-checkout]')).toHaveAttribute('aria-disabled', 'true');
    await drawer(page).getByRole('button', { name: 'Close bag' }).click();
    await ready(page, '/checkout/');
    await expect(page.locator('[data-co-blocked]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place demo order' })).toHaveAttribute('aria-disabled', 'true');

    // Removing it unblocks checkout.
    await ready(page, '/cart/');
    await page.getByRole('button', { name: 'Remove unavailable items' }).click();
    await expect(bagLine(page, WATCH.slug, 'OS')).toHaveCount(0);
    await expect(page.locator('[data-cart-issues]')).toBeHidden();
    await expect(checkout).not.toHaveAttribute('aria-disabled', 'true');
    await checkout.click();
    await expect(page).toHaveURL(/\/checkout\/$/);
    await expect(page.locator('[data-co-blocked]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Place demo order' })).not.toHaveAttribute('aria-disabled', 'true');
    await placeOrder(page);
    await expect(page.locator('[data-order-body]')).toContainText(OLIVE.name);
    await expect(page.locator('[data-order-body]')).not.toContainText(WATCH.name);
  });
});

/* ----- 7. Every page loads cleanly ----- */

const ROUTES = [
  '/',
  '/collections/',
  ...catalog.categories.map((c) => `/collections/${c.slug}/`),
  ...catalog.products.map((p) => `/products/${p.slug}/`),
  '/product/',
  '/search/',
  '/cart/',
  '/checkout/',
  '/order-confirmation/',
  '/about/',
  '/contact/',
  '/size-guide/',
  '/privacy/',
  '/shipping-returns/',
  '/admin/',
  '/admin/products/',
  '/admin/orders/',
  '/404.html',
];

// With demo data in the browser, these routes get the query that gives them content.
const WITH_DATA = {
  '/product/': `/product/?slug=${SAND.slug}`,
  '/search/': '/search/?q=polo',
  '/order-confirmation/': '/order-confirmation/?order=MONO-TEST-01',
};

/** A lived-in browser: admin edits (a new price, a hidden and a custom product), a bag and a demo order. */
async function demoData(request) {
  const { version, catalog: seed } = await (await request.get('/assets/data/store.json')).json();
  const products = structuredClone(seed.products);
  products.find((p) => p.slug === OLIVE.slug).price = 52;
  products.find((p) => p.slug === NAVY.slug).hidden = true;
  const base = structuredClone(products.find((p) => p.slug === 'ivory-oxford-shirt'));
  products.push({
    ...base, slug: SAND.slug, sku: 'MONO-SH-90', name: SAND.name, colour: { name: 'Sand', hex: '#C8B79A' },
    group: null, completeTheLook: [], featured: false, newArrival: false, custom: true,
  });
  const order = {
    id: 'MONO-TEST-01', createdAt: new Date().toISOString(), status: 'received',
    items: [{ slug: OLIVE.slug, variant: 'M', name: OLIVE.name, variantLabel: 'M', optionLabel: 'Size', qty: 1, unitPrice: 52, lineTotal: 52, imageKey: 'cut-olive-pique-polo-front' }],
    subtotal: 52, shippingId: 'standard', shippingName: 'Standard delivery', shipping: 6, total: 58,
    paymentId: 'test-card', paymentName: 'Test card',
    contact: { email: 'sam@example.com', phone: '' },
    delivery: { name: 'Sam Rivera', address1: '12 Demo Street', address2: '', city: 'Springfield', region: '', postcode: '62701', country: 'United States' },
    demo: true,
  };
  return {
    'mono.catalog.v1': { version, products, savedAt: new Date().toISOString() },
    'mono.cart.v1': [
      { slug: OLIVE.slug, variant: 'M', qty: 1 },
      { slug: SAND.slug, variant: 'L', qty: 1 },
      { slug: NAVY.slug, variant: 'M', qty: 1 },
      { slug: WATCH.slug, variant: 'OS', qty: 1 },
    ],
    'mono.orders.v1': [order],
  };
}

/** Load a page, scroll through it (lazy images, reveals) and return every problem seen. */
async function loadCleanly(page, path) {
  const problems = [];
  const onConsole = (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); };
  const onPageError = (e) => problems.push(`page error: ${e.message}`);
  const onFailed = (r) => problems.push(`failed: ${r.url()} (${r.failure()?.errorText ?? ''})`);
  const onResponse = (r) => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onFailed);
  page.on('response', onResponse);
  try {
    const res = await page.goto(path);
    expect(res.status(), `${path} status`).toBe(200);
    await expect(page.locator('html')).toHaveClass(/store-ready/);
    await page.evaluate(async () => {
      const step = Math.max(200, Math.round(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForLoadState('networkidle');
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onFailed);
    page.off('response', onResponse);
  }
  return problems;
}

test.describe('7. every page loads cleanly', () => {
  for (const path of ROUTES) {
    test(`${path}: no console errors or failed requests, fresh and with demo data`, async ({ page, context, request }) => {
      expect(await loadCleanly(page, path), `${path}, fresh browser`).toEqual([]);
      const data = await demoData(request);
      await page.evaluate((entries) => entries.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value))), Object.entries(data));
      // A second tab in the same browser: leaving the first page could cut off
      // its late image requests (gallery warm-up), which are not failures.
      const second = await context.newPage();
      const withData = WITH_DATA[path] ?? path;
      expect(await loadCleanly(second, withData), `${withData}, with demo data`).toEqual([]);
    });
  }
});
