// Demo admin: noindex frame, product create/edit/hide/delete, reset, restock,
// and demo orders. Each test runs in a fresh browser context, so localStorage
// starts empty (seed catalogue, no orders).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Counts come from the shipped catalogue, so adding a product needs no test edits.
const SEED = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));
const N = SEED.products.length;
// The editor suggests the next free SKU in a category, e.g. MONO-SH-04 after three shirts.
const NEXT_SHIRT_SKU = `MONO-SH-${String(Math.max(...SEED.products.filter((p) => p.sku.startsWith('MONO-SH-')).map((p) => Number(p.sku.slice(8)))) + 1).padStart(2, '0')}`;

const BANNER = 'Demo admin. Anyone can open this page, and changes are saved only in this browser. A real store needs server-side sign-in, a database and server-side checks.';

async function open(page, path) {
  await page.goto(path);
  await expect(page.locator('[data-admin-view]')).toHaveAttribute('aria-busy', 'false');
}

const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key);
const storedProduct = async (page, slug) => (await stored(page, 'mono.catalog.v1'))?.products.find((p) => p.slug === slug);
const row = (page, slug) => page.locator(`tr[data-row="${slug}"]`);
const editor = (page) => page.locator('#adm-editor');
const confirmBox = (page) => page.locator('dialog.adm-confirm');

function demoOrder(id, minutesAgo, status = 'received') {
  return {
    id,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    status,
    items: [
      { slug: 'olive-pique-polo', variant: 'M', name: 'Olive Piqué Polo', variantLabel: 'M', optionLabel: 'Size', qty: 2, unitPrice: 48, lineTotal: 96, imageKey: 'cut-olive-pique-polo-front' },
      { slug: 'black-dial-watch', variant: 'OS', name: 'Black Dial Watch', variantLabel: 'One size', optionLabel: '', qty: 1, unitPrice: 180, lineTotal: 180, imageKey: 'watch-black-dial' },
    ],
    subtotal: 276,
    shippingId: 'standard',
    shippingName: 'Standard delivery',
    shipping: 0,
    total: 276,
    paymentId: 'test-card',
    paymentName: 'Test card',
    contact: { email: 'sam@example.com', phone: '+1 555 0100' },
    delivery: { name: 'Sam Rivera', address1: '12 Demo Street', address2: '', city: 'Springfield', region: 'IL', postcode: '62701', country: 'United States' },
    demo: true,
  };
}

async function seedOrders(page, orders) {
  await page.goto('/admin/orders/');
  await page.evaluate((list) => localStorage.setItem('mono.orders.v1', JSON.stringify(list)), orders);
  await open(page, '/admin/orders/');
}

test.describe('frame', () => {
  for (const [path, title, h1, current] of [
    ['/admin/', 'Admin (Demo) | MONO', 'Admin (Demo)', 'Dashboard'],
    ['/admin/products/', 'Products | Admin (Demo) | MONO', 'Products', 'Products'],
    ['/admin/orders/', 'Orders | Admin (Demo) | MONO', 'Orders', 'Orders'],
  ]) {
    test(`${path} is a noindex, nofollow demo page with the honest banner`, async ({ page }) => {
      await open(page, path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('.adm-banner')).toHaveText(BANNER);
      await expect(page.locator('.adm-nav a[aria-current="page"] .adm-nav-text')).toHaveText(current);
      await expect(page.locator('.adm-nav').getByRole('link', { name: 'View store' })).toHaveAttribute('href', '/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('server markup has a loading state and a no-JS message', async ({ request }) => {
    const html = await (await request.get('/admin/products/')).text();
    expect(html).toContain('data-admin-loading');
    expect(html).toContain('<noscript>');
    expect(html).not.toMatch(/[\u2013\u2014]/);
  });
});

test.describe('dashboard', () => {
  test('shows metrics from the demo data and restocks a low option by 5', async ({ page }) => {
    await open(page, '/admin/');
    const metric = (label) => page.locator('.adm-metric').filter({ has: page.locator('dt', { hasText: label }) }).locator('.adm-metric-value');
    await expect(metric('Live products')).toHaveText(String(N));
    await expect(metric('Hidden products')).toHaveText('0');
    await expect(metric('Demo orders')).toHaveText('0');
    await expect(page.locator('.adm-metric', { hasText: 'Demo revenue' })).toContainText('Demo');

    const restock = page.getByRole('button', { name: 'Add 5 to Olive Piqué Polo, Size XXL' });
    await restock.click();
    await expect(page.locator('[data-restock-row="olive-pique-polo|XXL"]')).toHaveCount(0);
    const polo = await storedProduct(page, 'olive-pique-polo');
    expect(polo.variants.find((v) => v.id === 'XXL').stock).toBe(7);
    // Focus moves to the next restock button instead of getting lost.
    await expect(page.locator(':focus')).toHaveAttribute('data-restock', /\|/);
  });

  test('reset demo data restores the seed products and clears orders, after confirming', async ({ page }) => {
    await seedOrders(page, [demoOrder('MONO-TEST-01', 5)]);
    await open(page, '/admin/products/');
    await row(page, 'navy-pique-polo').getByRole('button', { name: 'Delete Navy Piqué Polo' }).click();
    await confirmBox(page).getByRole('button', { name: 'Delete product' }).click();
    await expect(row(page, 'navy-pique-polo')).toHaveCount(0);

    await open(page, '/admin/');
    const live = page.locator('.adm-metric', { hasText: 'Live products' }).locator('.adm-metric-value');
    await expect(live).toHaveText(String(N - 1));
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    await expect(confirmBox(page)).toBeVisible();
    await expect(confirmBox(page)).toContainText('Reset the demo data?');
    await confirmBox(page).getByRole('button', { name: 'Reset demo data' }).click();
    await expect(confirmBox(page)).toBeHidden();
    await expect(live).toHaveText(String(N));
    await expect(page.locator('.adm-metric', { hasText: 'Demo orders' }).locator('.adm-metric-value')).toHaveText('0');
    expect(await stored(page, 'mono.catalog.v1')).toBeNull();
    expect(await stored(page, 'mono.orders.v1')).toBeNull();
    await expect(page.getByRole('button', { name: 'Reset demo data' })).toBeFocused();

    await open(page, '/admin/products/');
    await expect(page.locator('.adm-count')).toHaveText(`${N} products`);
    await expect(page.locator('tr[data-row]')).toHaveCount(N);
  });
});

test.describe('products', () => {
  test('creates a product: errors first, then a valid one saved as custom', async ({ page }) => {
    await open(page, '/admin/products/');
    await expect(page.locator('tr[data-row]')).toHaveCount(N);
    await page.getByRole('button', { name: 'Add product' }).click();
    const ed = editor(page);
    await expect(ed).toBeVisible();

    // Empty name and a zero price are refused with a focused summary and inline errors.
    await ed.locator('#ed-price').fill('0');
    await ed.getByRole('button', { name: 'Add product' }).click();
    const summary = ed.locator('[data-error-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('Enter a product name.');
    await expect(summary).toContainText('Enter a price above $0.');
    await expect(ed.locator('#ed-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(ed.locator('#ed-price')).toHaveAttribute('aria-invalid', 'true');
    await expect(ed.locator('#ed-price')).toHaveAttribute('aria-describedby', /ed-price-err/);
    expect(await stored(page, 'mono.catalog.v1')).toBeNull();

    // A summary link moves focus to its field.
    await summary.getByRole('link', { name: 'Enter a product name.' }).click();
    await expect(ed.locator('#ed-name')).toBeFocused();

    await ed.locator('#ed-name').fill('Sand Linen Shirt');
    await expect(ed.locator('#ed-name')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(ed.locator('#ed-slug')).toHaveValue('sand-linen-shirt');
    await ed.locator('#ed-category').selectOption('shirts');
    await expect(ed.locator('#ed-sku')).toHaveValue(NEXT_SHIRT_SKU);
    await ed.locator('#ed-price').fill('72');
    await ed.locator('#ed-summary').fill('A relaxed shirt in warm sand.');
    await ed.locator('#ed-description').fill('A relaxed shirt in warm sand with a soft collar.');
    await ed.locator('#ed-details').fill('Soft collar\nCurved hem');
    await ed.locator('#ed-colourName').fill('Sand');
    await ed.locator('[data-vrow]').nth(1).locator('[data-v="stock"]').fill('4');
    const image = ed.locator('[data-irow]').first();
    await image.locator('[data-i="key"]').selectOption('cut-ivory-oxford-shirt-front');
    await expect(image.locator('[data-ithumb] img')).toHaveCount(1);
    await image.locator('[data-i="alt"]').fill('Sand linen shirt, front view');
    await ed.getByRole('button', { name: 'Add product' }).click();
    await expect(ed).toBeHidden();

    const r = row(page, 'sand-linen-shirt');
    await expect(r).toBeVisible();
    await expect(r).toContainText('Sand Linen Shirt');
    await expect(r).toContainText(NEXT_SHIRT_SKU);
    await expect(r).toContainText('$72.00');
    await expect(r).toContainText('New');
    await expect(r.locator('[data-view-link]')).toHaveAttribute('href', '/product/?slug=sand-linen-shirt');
    await expect(page.locator('.toast a').first()).toHaveAttribute('href', '/product/?slug=sand-linen-shirt');
    await expect(page.locator('tr[data-row]')).toHaveCount(N + 1);
    await expect(r.getByRole('button', { name: 'Edit Sand Linen Shirt' })).toBeFocused();

    const saved = await storedProduct(page, 'sand-linen-shirt');
    expect(saved).toBeTruthy();
    expect(saved.custom).toBe(true);
    expect(saved.price).toBe(72);
    expect(saved.category).toBe('shirts');
    expect(saved.details).toEqual(['Soft collar', 'Curved hem']);
    expect(saved.variants.find((v) => v.id === 'M').stock).toBe(4);
    expect(saved.images[0]).toMatchObject({ key: 'cut-ivory-oxford-shirt-front', alt: 'Sand linen shirt, front view', kind: 'cutout' });
  });

  test('edits the olive polo price and keeps it after a reload', async ({ page }) => {
    await open(page, '/admin/products/');
    await row(page, 'olive-pique-polo').getByRole('button', { name: 'Edit Olive Piqué Polo' }).click();
    const ed = editor(page);
    await expect(ed).toBeVisible();
    await expect(ed.locator('#ed-slug')).toHaveAttribute('readonly', '');
    await expect(ed.locator('#ed-price')).toHaveValue('48');
    await ed.locator('#ed-price').fill('52');
    await ed.getByRole('button', { name: 'Save changes' }).click();
    await expect(ed).toBeHidden();
    await expect(row(page, 'olive-pique-polo')).toContainText('$52.00');
    await expect(row(page, 'olive-pique-polo')).toContainText('Edited');
    await expect(row(page, 'olive-pique-polo').getByRole('button', { name: 'Edit Olive Piqué Polo' })).toBeFocused();
    const polo = await storedProduct(page, 'olive-pique-polo');
    expect(polo.price).toBe(52);
    expect(polo.custom).toBe(false);
    await expect(row(page, 'olive-pique-polo').locator('[data-view-link]')).toHaveAttribute('href', '/products/olive-pique-polo/');

    await open(page, '/admin/products/');
    await expect(row(page, 'olive-pique-polo')).toContainText('$52.00');
  });

  test('hides and shows a product', async ({ page }) => {
    await open(page, '/admin/products/');
    const r = row(page, 'navy-pique-polo');
    await r.getByRole('button', { name: 'Hide Navy Piqué Polo' }).click();
    await expect(r).toContainText('Hidden');
    await expect(r.getByRole('button', { name: 'Show Navy Piqué Polo' })).toBeFocused();
    expect((await storedProduct(page, 'navy-pique-polo')).hidden).toBe(true);

    await r.getByRole('button', { name: 'Show Navy Piqué Polo' }).click();
    await expect(r).toContainText('Live');
    await expect(r).not.toContainText('Edited');
    expect((await storedProduct(page, 'navy-pique-polo')).hidden).toBeFalsy();
  });

  test('deletes a product only after confirming', async ({ page }) => {
    await open(page, '/admin/products/');
    const r = row(page, 'black-dress-belt');
    await r.getByRole('button', { name: 'Delete Black Dress Belt' }).click();
    await expect(confirmBox(page)).toBeVisible();
    await expect(confirmBox(page)).toContainText('Delete Black Dress Belt?');
    await confirmBox(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(confirmBox(page)).toBeHidden();
    await expect(r).toBeVisible();
    await expect(r.getByRole('button', { name: 'Delete Black Dress Belt' })).toBeFocused();
    expect(await stored(page, 'mono.catalog.v1')).toBeNull();

    await r.getByRole('button', { name: 'Delete Black Dress Belt' }).click();
    await confirmBox(page).getByRole('button', { name: 'Delete product' }).click();
    await expect(r).toHaveCount(0);
    await expect(page.locator('.adm-count')).toHaveText(`${N - 1} products`);
    const catalog = await stored(page, 'mono.catalog.v1');
    expect(catalog.products).toHaveLength(N - 1);
    expect(catalog.products.some((p) => p.slug === 'black-dress-belt')).toBe(false);
  });

  test('search and category filter the table', async ({ page }) => {
    await open(page, '/admin/products/');
    const watches = SEED.products.filter((p) => p.sku.startsWith('MONO-WT')).length;
    await page.locator('#adm-q').fill('MONO-WT');
    await expect(page.locator('tr[data-row]')).toHaveCount(watches);
    await expect(page.locator('.adm-count')).toHaveText(`Showing ${watches} of ${N} products`);
    await page.locator('#adm-q').fill('');
    await page.locator('#adm-cat').selectOption('polos');
    await expect(page.locator('tr[data-row]')).toHaveCount(SEED.products.filter((p) => p.category === 'polos').length);
    await expect(page).toHaveURL(/category=polos/);
  });

  test('Esc closes the editor, asks before discarding changes, and returns focus', async ({ page }) => {
    await open(page, '/admin/products/');
    const edit = row(page, 'ivory-oxford-shirt').getByRole('button', { name: 'Edit Ivory Oxford Shirt' });
    await edit.focus();
    await page.keyboard.press('Enter');
    const ed = editor(page);
    await expect(ed).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(ed).toBeHidden();
    await expect(edit).toBeFocused();

    await edit.click();
    await expect(ed).toBeVisible();
    await ed.locator('#ed-summary').fill('Changed but not saved.');
    await page.keyboard.press('Escape');
    await expect(confirmBox(page)).toBeVisible();
    await confirmBox(page).getByRole('button', { name: 'Keep editing' }).click();
    await expect(confirmBox(page)).toBeHidden();
    await expect(ed).toBeVisible();
    await ed.getByRole('button', { name: 'Cancel' }).click();
    await confirmBox(page).getByRole('button', { name: 'Discard changes' }).click();
    await expect(ed).toBeHidden();
    await expect(edit).toBeFocused();
    expect(await stored(page, 'mono.catalog.v1')).toBeNull();
  });

  test('phone and desktop: the table scrolls inside its wrap, never the page', async ({ page }) => {
    await open(page, '/admin/products/');
    const width = page.viewportSize().width;
    const m = await page.evaluate(() => {
      const wrap = document.querySelector('.adm-table-wrap');
      return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, wrapScrolls: wrap.scrollWidth > wrap.clientWidth };
    });
    expect(m.page).toBeLessThanOrEqual(0);
    if (width < 900) expect(m.wrapScrolls).toBe(true);
    // Opening the editor must not widen the layout either.
    await page.getByRole('button', { name: 'Add product' }).click();
    await expect(editor(page)).toBeVisible();
    expect(await page.evaluate(() => window.innerWidth)).toBe(width);
    // Once the drawer has slid in, its save button sits fully on screen.
    await expect(editor(page).getByRole('button', { name: 'Add product' })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => window.innerWidth)).toBe(width);
  });
});

test.describe('orders', () => {
  test('lists orders newest first, shows details, changes status and clears after confirming', async ({ page }) => {
    await seedOrders(page, [demoOrder('MONO-TEST-02', 600, 'packed'), demoOrder('MONO-TEST-01', 5)]);
    const rows = page.locator('tr[data-order]');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toHaveAttribute('data-order', 'MONO-TEST-01');
    const r = page.locator('tr[data-order="MONO-TEST-01"]');
    await expect(r).toContainText('Sam Rivera');
    await expect(r).toContainText('$276.00');
    await expect(r).toContainText('Test card');
    const created = await page.evaluate(() => {
      const o = JSON.parse(localStorage.getItem('mono.orders.v1')).find((x) => x.id === 'MONO-TEST-01');
      return new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    });
    await expect(r).toContainText(created);

    const toggle = r.getByRole('button', { name: /MONO-TEST-01/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const detail = page.locator('#adm-od-MONO-TEST-01');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('12 Demo Street');
    await expect(detail).toContainText('Olive Piqué Polo');
    await expect(detail).toContainText('Standard delivery');

    const status = page.getByLabel('Status of order MONO-TEST-01');
    await expect(status).toHaveValue('received');
    await status.selectOption('shipped');
    await expect(page.getByLabel('Status of order MONO-TEST-01')).toHaveValue('shipped');
    const orders = await stored(page, 'mono.orders.v1');
    expect(orders.find((o) => o.id === 'MONO-TEST-01').status).toBe('shipped');
    expect(orders.find((o) => o.id === 'MONO-TEST-02').status).toBe('packed');
    await expect(detail).toBeVisible();

    await page.locator('[data-clear-orders]').click();
    await expect(confirmBox(page)).toBeVisible();
    await confirmBox(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(rows).toHaveCount(2);
    await page.locator('[data-clear-orders]').click();
    await confirmBox(page).getByRole('button', { name: 'Clear demo orders' }).click();
    await expect(page.getByText('No demo orders yet')).toBeVisible();
    await expect(rows).toHaveCount(0);
    await expect(page.locator('[data-admin-view]').getByRole('link', { name: 'Go to the shop' })).toHaveAttribute('href', '/collections/');
    expect(await stored(page, 'mono.orders.v1')).toBeNull();
  });

  test('empty state links to the shop', async ({ page }) => {
    await open(page, '/admin/orders/');
    await expect(page.getByText('No demo orders yet')).toBeVisible();
    await expect(page.locator('[data-clear-orders]')).toBeHidden();
    await expect(page.locator('[data-admin-view]').getByRole('link', { name: 'Go to the shop' })).toHaveAttribute('href', '/collections/');
  });
});
