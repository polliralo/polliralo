// Bag, checkout and order confirmation (checkout area).
// Run from the repo root:
//   SHOP_TEST_PORT=4304 npx playwright test --config playwright.shop.config.mjs shop/tests/checkout.spec.mjs
import { test, expect } from '@playwright/test';

const POLO = { slug: 'olive-pique-polo', variant: 'M' };      // $48, seed stock 9
const WATCH = { slug: 'black-dial-watch', variant: 'OS' };    // $180, seed stock 5
const TEE = { slug: 'ivory-heavyweight-tee', variant: 'M' };  // $34

/** Seed the bag once per test (the init script runs on every navigation). */
async function seedBag(page, items) {
  await page.addInitScript((bag) => {
    if (sessionStorage.getItem('co-test-seeded')) return;
    localStorage.clear();
    localStorage.setItem('mono.cart.v1', JSON.stringify(bag));
    sessionStorage.setItem('co-test-seeded', '1');
  }, items);
}

const line = (page, slug, variant) => page.locator(`[data-cart-lines] [data-line][data-slug="${slug}"][data-variant="${variant}"]`);
const readStorage = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key);

async function fillValidForm(page) {
  await page.fill('#co-email', 'alex@example.com');
  await page.fill('#co-name', 'Alex Morgan');
  await page.fill('#co-address1', '12 Market Street');
  await page.fill('#co-city', 'Springfield');
  await page.fill('#co-postcode', '10001');
}

test.describe('bag page', () => {
  test('changing quantity updates the line and the totals', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }]);
    await page.goto('/cart/');
    await expect(page.locator('h1')).toHaveText('Your bag');
    const row = line(page, POLO.slug, POLO.variant);
    await expect(row).toBeVisible();
    await expect(page.locator('[data-cart-total]')).toHaveText('$54.00');
    await expect(page.locator('[data-cart-summary]')).toContainText('$48.00');

    await row.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(row.locator('output')).toHaveText('2');
    await expect(row.locator('.line-price')).toHaveText('$96.00');
    await expect(page.locator('[data-cart-total]')).toHaveText('$102.00');
    await expect(page.locator('[data-cart-count]')).toHaveText('2 items');
    // Keyboard focus stays on the stepper after the list redraws.
    await expect(row.getByRole('button', { name: 'Increase quantity' })).toBeFocused();

    await row.getByRole('button', { name: 'Decrease quantity' }).click();
    await expect(page.locator('[data-cart-total]')).toHaveText('$54.00');
    await expect(page.getByText('Demo checkout: nothing is charged.')).toBeVisible();
  });

  test('remove shows an inline Undo that brings the line back', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }, { ...WATCH, qty: 1 }]);
    await page.goto('/cart/');
    await expect(page.locator('[data-cart-total]')).toHaveText('$228.00');

    await line(page, POLO.slug, POLO.variant).getByRole('button', { name: 'Remove' }).click();
    await expect(line(page, POLO.slug, POLO.variant)).toHaveCount(0);
    const undoRow = page.locator('.co-removed');
    await expect(undoRow).toContainText('Olive Piqué Polo, size M removed.');
    const undo = undoRow.getByRole('button', { name: 'Undo' });
    await expect(undo).toBeFocused();
    await expect(page.locator('[data-cart-total]')).toHaveText('$180.00');
    expect((await readStorage(page, 'mono.cart.v1')).length).toBe(1);

    await undo.click();
    await expect(line(page, POLO.slug, POLO.variant)).toBeVisible();
    await expect(page.locator('.co-removed')).toHaveCount(0);
    await expect(page.locator('[data-cart-total]')).toHaveText('$228.00');
    // The restored line returns to its original place (first).
    await expect(page.locator('[data-cart-lines] [data-line]').first()).toHaveAttribute('data-slug', POLO.slug);
  });

  test('clear bag asks first, then shows the empty state', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }, { ...WATCH, qty: 1 }]);
    await page.goto('/cart/');
    const dialog = page.locator('#co-clear-dialog');

    await page.getByRole('button', { name: 'Clear bag' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('all 2 items');
    await dialog.getByRole('button', { name: 'Keep items' }).click();
    await expect(dialog).toBeHidden();
    await expect(line(page, POLO.slug, POLO.variant)).toBeVisible();

    await page.getByRole('button', { name: 'Clear bag' }).click();
    await dialog.getByRole('button', { name: 'Clear bag' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shop all' }).first()).toBeVisible();
    await expect(page.locator('[data-cart-new-grid] .card').first()).toBeVisible();
    expect(await readStorage(page, 'mono.cart.v1')).toEqual([]);
  });

  test('a line above the stock blocks checkout until quantities are updated', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 3 }]);
    await page.goto('/cart/');
    await expect(line(page, POLO.slug, POLO.variant)).toBeVisible();
    // Stock drops to 1 (as if the admin changed it).
    await page.evaluate(async (p) => {
      const store = await import('/assets/js/lib/store.js');
      await store.loadStore();
      store.adjustStock(p.slug, p.variant, -8);
    }, POLO);
    const checkout = page.locator('[data-cart-checkout]');
    await expect(checkout).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-cart-blocked]')).toBeVisible();
    await page.getByRole('button', { name: 'Update quantities' }).click();
    await expect(line(page, POLO.slug, POLO.variant).locator('output')).toHaveText('1');
    await expect(checkout).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-cart-blocked]')).toBeHidden();
  });
});

test.describe('checkout', () => {
  test('submitting empty fields shows a focused error summary with links', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }]);
    await page.goto('/checkout/');
    await expect(page.locator('h1')).toHaveText('Checkout');
    await expect(page.getByText('Nothing is charged and nothing ships.').first()).toBeVisible();
    await expect(page.locator('input[autocomplete*="cc-"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Place demo order' }).click();
    const summary = page.locator('[data-error-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('There is a problem');
    await expect(summary).toContainText('Enter your email address');
    await expect(summary).toContainText('Enter your ZIP code');
    await expect(page).toHaveTitle(/^Error: Checkout/);
    await expect(page.locator('#co-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#co-email')).toHaveAttribute('aria-describedby', /co-email-error/);
    await expect(page.locator('#co-email-error')).toContainText('Enter your email address');
    // Optional fields never get an error.
    await expect(page.locator('#co-phone')).not.toHaveAttribute('aria-invalid', 'true');

    await summary.getByRole('link', { name: 'Enter your email address' }).click();
    await expect(page.locator('#co-email')).toBeFocused();
    // After the first attempt, errors clear as soon as the field is fixed.
    await page.locator('#co-email').fill('name@example');
    await expect(page.locator('#co-email-error')).toContainText('correct format');
    await page.locator('#co-email').fill('name@example.com');
    await expect(page.locator('#co-email-error')).toBeHidden();
    await expect(page.locator('#co-email')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(summary).not.toContainText('Enter your email address');
  });

  test('express delivery changes the total', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }]);
    await page.goto('/checkout/');
    const total = page.locator('[data-place-totals] .co-total');
    await expect(total).toContainText('$54.00');
    await expect(page.locator('[data-ship-price="standard"]')).toHaveText('$6.00');
    await page.locator('label.co-option', { hasText: 'Express delivery' }).click();
    await expect(page.locator('#co-ship-express')).toBeChecked();
    await expect(total).toContainText('$62.00');
    await expect(page.locator('[data-sum-bar-total]')).toHaveText('$62.00');
    await expect(page.locator('[data-place-totals]')).toContainText('Express delivery');
  });

  test('standard delivery is free at $150 or more', async ({ page }) => {
    await seedBag(page, [{ ...TEE, qty: 3 }, { ...POLO, qty: 1 }]); // exactly $150
    await page.goto('/checkout/');
    await expect(page.locator('[data-ship-price="standard"]')).toHaveText('Free');
    await expect(page.locator('[data-place-totals] .co-total')).toContainText('$150.00');
    await expect(page.locator('[data-place-totals]')).toContainText('Free');
    await page.locator('label.co-option', { hasText: 'Express delivery' }).click();
    await expect(page.locator('[data-place-totals] .co-total')).toContainText('$164.00');
  });

  test('delivery and payment work from the keyboard', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }]);
    await page.goto('/checkout/');
    await expect(page.locator('[data-checkout]')).toHaveAttribute('data-state', 'ready');
    await page.locator('#co-ship-standard').focus();
    await expect(page.locator('#co-ship-standard')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#co-ship-express')).toBeChecked();
    await expect(page.locator('#co-ship-express')).toBeFocused();
    await expect(page.locator('[data-place-totals] .co-total')).toContainText('$62.00');
    await page.locator('#co-pay-test-card').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#co-pay-cod')).toBeChecked();
  });

  test('a bag issue blocks the order and links back to the bag', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 3 }]);
    await page.goto('/checkout/');
    await expect(page.locator('[data-co-form]')).toBeVisible();
    await page.evaluate(async (p) => {
      const store = await import('/assets/js/lib/store.js');
      await store.loadStore();
      store.adjustStock(p.slug, p.variant, -8); // 1 left, 3 in the bag
    }, POLO);
    const blocked = page.locator('[data-co-blocked]');
    await expect(blocked).toBeVisible();
    await expect(blocked.getByRole('link', { name: 'Review your bag' })).toHaveAttribute('href', '/cart/');
    await fillValidForm(page);
    // The button is aria-disabled while blocked; Enter in a field still submits the form.
    await expect(page.getByRole('button', { name: 'Place demo order' })).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#co-postcode').press('Enter');
    await expect(blocked).toBeFocused();
    await expect(page).toHaveURL(/\/checkout\/$/);
    expect(await readStorage(page, 'mono.orders.v1')).toBeNull();
  });

  test('entered details survive a reload', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 1 }]);
    await page.goto('/checkout/');
    await page.fill('#co-email', 'keep@example.com');
    await page.fill('#co-city', 'Lisbon');
    await page.selectOption('#co-country', 'PT');
    await expect(page.locator('[data-label-for="postcode"]')).toHaveText('Postcode');
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('#co-email')).toHaveValue('keep@example.com');
    await expect(page.locator('#co-city')).toHaveValue('Lisbon');
    await expect(page.locator('#co-country')).toHaveValue('PT');
    await expect(page.locator('[data-label-for="postcode"]')).toHaveText('Postcode');
  });

  test('an empty bag shows a friendly message instead of the form', async ({ page }) => {
    await seedBag(page, []);
    await page.goto('/checkout/');
    await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
    await expect(page.locator('[data-co-form]')).toBeHidden();
  });
});

test.describe('placing an order', () => {
  test('a valid order lands on the confirmation, empties the bag and lowers stock', async ({ page }) => {
    await seedBag(page, [{ ...POLO, qty: 2 }]);
    await page.goto('/checkout/');
    await fillValidForm(page);
    await page.locator('label.co-option', { hasText: 'Express delivery' }).click();
    await page.getByRole('button', { name: 'Place demo order' }).click();

    await page.waitForURL(/\/order-confirmation\/\?order=MONO-/);
    const id = new URL(page.url()).searchParams.get('order');
    expect(page.url()).not.toContain('example.com');
    await expect(page.locator('h1')).toHaveText('Order confirmed');
    await expect(page.locator('[data-order-id]')).toHaveText(id);
    await expect(page.getByText('This is a demo order: nothing was charged and nothing will be shipped.')).toBeVisible();
    const body = page.locator('[data-order-body]');
    await expect(body).toContainText('Olive Piqué Polo');
    await expect(body).toContainText('Size: M · Qty 2');
    await expect(body).toContainText('$96.00');
    await expect(body).toContainText('Express delivery');
    await expect(body.locator('.co-total')).toContainText('$110.00');
    await expect(body).toContainText('12 Market Street');
    await expect(body).toContainText('Test card');
    await expect(page.getByRole('link', { name: 'See it in the demo admin' })).toHaveAttribute('href', '/admin/orders/');
    await expect(page.getByRole('link', { name: 'Continue shopping' }).first()).toBeVisible();

    // The bag is empty and the header count says so.
    expect(await readStorage(page, 'mono.cart.v1')).toEqual([]);
    await expect(page.locator('[data-bag-count]').first()).toHaveText('0');

    // Stock went down for the ordered option only.
    const catalog = await readStorage(page, 'mono.catalog.v1');
    const polo = catalog.products.find((p) => p.slug === POLO.slug);
    expect(polo.variants.find((v) => v.id === 'M').stock).toBe(7);
    expect(polo.variants.find((v) => v.id === 'L').stock).toBe(8);

    // The order record follows the shared format (the admin reads it).
    const [order] = await readStorage(page, 'mono.orders.v1');
    expect(order).toMatchObject({
      id, status: 'received', subtotal: 96, shippingId: 'express', shippingName: 'Express delivery', shipping: 14, total: 110,
      paymentId: 'test-card', paymentName: 'Test card', demo: true,
      contact: { email: 'alex@example.com', phone: '' },
      delivery: { name: 'Alex Morgan', address1: '12 Market Street', address2: '', city: 'Springfield', region: '', postcode: '10001', country: 'United States' },
    });
    expect(order.items).toEqual([{
      slug: POLO.slug, variant: 'M', name: 'Olive Piqué Polo', variantLabel: 'M', optionLabel: 'Size', qty: 2, unitPrice: 48, lineTotal: 96, imageKey: 'cut-olive-pique-polo-front',
    }]);
    expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);

    // Going back to checkout cannot place it again.
    await page.goto('/checkout/');
    await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
    await page.goto('/cart/');
    await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
  });

  test('an unknown or missing order id shows the not-found message', async ({ page }) => {
    await page.goto('/order-confirmation/?order=MONO-NOPE-00');
    await expect(page.getByText('We could not find that order in this browser')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Order not found');
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
    await page.goto('/order-confirmation/');
    await expect(page.getByText('We could not find that order in this browser')).toBeVisible();
  });
});
