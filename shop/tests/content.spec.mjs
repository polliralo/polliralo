// Content pages: about (demo reset), contact (demo form), size guide,
// privacy, shipping and returns, and the 404 page.
//   SHOP_TEST_PORT=4306 npx playwright test --config playwright.shop.config.mjs shop/tests/content.spec.mjs

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const sizeGuide = JSON.parse(readFileSync(new URL('../src/data/size-guide.json', import.meta.url), 'utf8'));
const KEYS = ['mono.cart.v1', 'mono.catalog.v1', 'mono.orders.v1'];

const PAGES = [
  { path: '/about/', h1: 'About MONO', title: 'About MONO' },
  { path: '/contact/', h1: 'Contact', title: 'Contact | MONO' },
  { path: '/size-guide/', h1: 'Size guide', title: 'Size Guide | MONO' },
  { path: '/privacy/', h1: 'Privacy policy', title: 'Privacy Policy | MONO' },
  { path: '/shipping-returns/', h1: 'Shipping and returns', title: 'Shipping and Returns | MONO' },
];

function watchProblems(page) {
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && problems.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`));
  return problems;
}

test.describe('content pages render', () => {
  for (const p of PAGES) {
    test(`${p.path} has its h1, title and breadcrumb`, async ({ page }) => {
      const problems = watchProblems(page);
      const res = await page.goto(p.path);
      expect(res.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(p.h1);
      await expect(page).toHaveTitle(p.title);
      // The title's main part matches the h1.
      expect(p.title.split(' | ')[0].toLowerCase()).toBe(p.h1.toLowerCase());
      await expect(page.locator('main .crumbs [aria-current="page"]')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.path);
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  }

  test('an unknown address returns 404 with the not-found page', async ({ page }) => {
    const res = await page.goto('/no-such-page/at/all/');
    expect(res.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page).toHaveTitle('Page Not Found | MONO');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});

test.describe('contact form', () => {
  test('shows errors, links them to fields and confirms a valid demo message', async ({ page }) => {
    await page.goto('/contact/');
    const form = page.locator('form[data-contact-form]');
    const summary = form.locator('[data-error-summary]');
    const message = form.locator('[data-form-message]');
    const name = page.getByLabel('Name');
    const email = page.getByLabel('Email');
    const topic = page.getByLabel('Topic');
    const text = page.getByLabel('Message', { exact: true });

    // Empty submit: four errors, summary focused, fields marked invalid.
    await form.getByRole('button', { name: /send message/i }).click();
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('Check 4 fields');
    await expect(summary.locator('li')).toHaveCount(4);
    for (const field of [name, email, topic, text]) await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#ct-name-error')).toHaveText('Enter your name.');
    await expect(page.locator('#ct-topic-error')).toHaveText('Choose a topic.');
    await expect(name).toHaveAttribute('aria-describedby', /ct-name-error/);
    await expect(message).toHaveText('');

    // A summary link moves focus to its field.
    await summary.getByRole('link', { name: 'Enter your email.' }).click();
    await expect(email).toBeFocused();

    // Fixing a field clears its error as you type.
    await name.fill('Sam Example');
    await expect(name).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#ct-name-error')).toBeHidden();

    // A bad email and a short message.
    await email.fill('sam@');
    await topic.selectOption('Sizing and fit');
    await text.fill('Hi');
    await form.getByRole('button', { name: /send message/i }).click();
    await expect(summary).toContainText('Check 2 fields');
    await expect(page.locator('#ct-email-error')).toContainText('name@example.com');
    await expect(page.locator('#ct-message-error')).toContainText('at least 10 characters');
    await expect(message).toHaveText('');

    // Valid: the demo confirmation shows, nothing is left marked invalid.
    await email.fill('sam@example.com');
    await text.fill('Does the Oxford shirt come in a longer fit?');
    await expect(page.locator('[data-char-count]')).toHaveText('43 / 1000');
    await form.getByRole('button', { name: /send message/i }).click();
    await expect(message).toContainText('This is a demo, so your message was not sent anywhere');
    await expect(summary).toBeHidden();
    await expect(name).toHaveValue('');
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/contact/');
  });

  test('checks the email when the visitor leaves the field', async ({ page }) => {
    await page.goto('/contact/');
    const email = page.getByLabel('Email');
    await email.fill('not-an-email');
    await page.getByLabel('Topic').focus();
    await expect(page.locator('#ct-email-error')).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    // Leaving an untouched field empty does not nag.
    await page.getByLabel('Name').focus();
    await page.getByLabel('Topic').focus();
    await expect(page.locator('#ct-name-error')).toBeHidden();
  });
});

test.describe('about: reset the demo', () => {
  async function seed(page) {
    await page.evaluate(() => {
      localStorage.setItem('mono.cart.v1', JSON.stringify([{ slug: 'olive-pique-polo', variant: 'M', qty: 2 }]));
      localStorage.setItem('mono.orders.v1', JSON.stringify([{ id: 'MONO-TEST-01', items: [], total: 48, demo: true }]));
      localStorage.setItem('mono.catalog.v1', JSON.stringify({ version: 'test', products: [] }));
    });
    await page.reload();
  }
  const read = (page) => page.evaluate((keys) => keys.map((k) => localStorage.getItem(k)), KEYS);

  test('cancel keeps the data; confirm removes the three keys', async ({ page }) => {
    await page.goto('/about/');
    await seed(page);
    const panel = page.locator('[data-demo-reset]');
    await expect(panel.locator('[data-state="cart"]')).toHaveText('2 items');
    await expect(panel.locator('[data-state="orders"]')).toHaveText('1 order');
    await expect(panel.locator('[data-state="catalog"]')).toHaveText('Edited in this browser');

    const open = page.getByRole('button', { name: 'Reset this demo in my browser' });
    const dialog = page.locator('#ct-reset-dialog');

    await open.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Reset this demo?' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    expect((await read(page)).every((v) => v !== null)).toBe(true);

    await open.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Reset demo' }).click();
    await expect(dialog).toBeHidden();
    expect(await read(page)).toEqual([null, null, null]);
    await expect(page.locator('[data-reset-done]')).toContainText('have been cleared');
    await expect(panel.locator('[data-state="cart"]')).toHaveText('No items');
    await expect(panel.locator('[data-state="orders"]')).toHaveText('None');
    await expect(panel.locator('[data-state="catalog"]')).toHaveText('As shipped');
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('0');
  });

  test('Escape closes the confirmation without resetting', async ({ page }) => {
    await page.goto('/about/');
    await seed(page);
    await page.getByRole('button', { name: 'Reset this demo in my browser' }).click();
    await expect(page.locator('#ct-reset-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ct-reset-dialog')).toBeHidden();
    expect((await read(page)).every((v) => v !== null)).toBe(true);
  });

  test('the announcement link lands on "How this demo works"', async ({ page }) => {
    await page.goto('/contact/');
    await page.locator('.announce a[href="/about/#demo"]').click();
    await expect(page).toHaveURL(/\/about\/#demo$/);
    await expect(page.locator('#demo h2')).toBeInViewport();
  });
});

test.describe('size guide', () => {
  test('tables list every size from the data', async ({ page }) => {
    await page.goto('/size-guide/');
    for (const [id, data] of [['tops', sizeGuide.tops], ['belts', sizeGuide.belts]]) {
      const table = page.locator(`#${id} table`);
      await expect(table.locator('thead th')).toHaveText(data.columns);
      await expect(table.locator('tbody tr')).toHaveCount(data.rows.length);
      await expect(table.locator('tbody th[scope="row"]')).toHaveText(data.rows.map((r) => r[0]));
      const firstRow = await table.locator('tbody tr').first().locator('th, td').allTextContents();
      expect(firstRow).toEqual(data.rows[0]);
    }
    await expect(page.locator('#tops tbody th')).toHaveText(['S', 'M', 'L', 'XL', 'XXL']);
    await expect(page.locator('#belts tbody th')).toHaveText(['32', '34', '36', '38']);
    await expect(page.locator('#measure .ct-steps li')).toHaveCount(sizeGuide.howToMeasure.length);
    await expect(page.locator('main')).toContainText(sizeGuide.note);
  });

  test('jump links and category links work', async ({ page }) => {
    await page.goto('/size-guide/');
    await page.locator('.ct-jump').getByRole('link', { name: 'Belts' }).click();
    await expect(page).toHaveURL(/#belts$/);
    await expect(page.locator('#belts h2')).toBeInViewport();
    for (const slug of ['shirts', 't-shirts', 'polos', 'accessories']) {
      await expect(page.locator(`main a[href="/collections/${slug}/"]`).first()).toBeAttached();
    }
  });
});

test.describe('shipping and returns', () => {
  test('shows the checkout delivery options and a working FAQ', async ({ page }) => {
    const { SHIPPING_OPTIONS, FREE_SHIPPING_OVER } = await import('../site/assets/js/lib/pricing.js');
    await page.goto('/shipping-returns/');
    const options = page.locator('.ct-option');
    await expect(options).toHaveCount(SHIPPING_OPTIONS.length);
    for (const [i, o] of SHIPPING_OPTIONS.entries()) {
      await expect(options.nth(i)).toContainText(o.name);
      await expect(options.nth(i).locator('.ct-option-price')).toHaveText(`$${o.price}`);
    }
    await expect(page.locator('#delivery')).toContainText('Demo prices');
    await expect(page.locator('#delivery')).toContainText(`$${FREE_SHIPPING_OVER}`);
    await expect(page.locator('#returns')).toContainText('Demo policy');

    const first = page.locator('#faq details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.acc-body')).toBeVisible();
  });
});

test.describe('privacy', () => {
  test('names what is stored and links to the reset', async ({ page }) => {
    await page.goto('/privacy/');
    await expect(page.locator('.ct-updated')).toContainText('Last updated 14 October 2026');
    await expect(page.locator('.ct-updated time')).toHaveAttribute('datetime', '2026-10-14');
    for (const key of KEYS) await expect(page.locator('#stored')).toContainText(key);
    await page.locator('#clear').getByRole('link', { name: 'How this demo works' }).click();
    await expect(page).toHaveURL(/\/about\/#demo$/);
  });
});

test.describe('404 page', () => {
  test('every link on it works', async ({ page, request }) => {
    const res = await page.goto('/old/path/that-moved/');
    expect(res.status()).toBe(404);
    const hrefs = await page.locator('main a[href]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
    expect(hrefs.length).toBeGreaterThan(8);
    for (const href of hrefs) {
      expect(href.startsWith('/'), `${href} is absolute`).toBe(true);
      const r = await request.get(href);
      expect(r.status(), href).toBe(200);
    }
    await expect(page.locator('.ct-nf-grid .card')).toHaveCount(3);
  });

  test('category link, product card and search form navigate', async ({ page }) => {
    await page.goto('/old/path/that-moved/');
    await page.locator('.ct-nf-cats').getByRole('link', { name: /Shirts/ }).first().click();
    await expect(page).toHaveURL(/\/collections\/shirts\/$/);

    await page.goto('/old/path/that-moved/');
    const card = page.locator('.ct-nf-grid .card').first();
    const href = await card.locator('.card-name a').getAttribute('href');
    await card.locator('.card-name a').click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));

    await page.goto('/old/path/that-moved/');
    await page.locator('#ct-nf-q').fill('polo');
    await page.locator('#ct-nf-q').press('Enter');
    await expect(page).toHaveURL(/\/search\/\?q=polo$/);
  });
});
