// Product page tests (desktop 1440x900 and Pixel 7). Each test gets a fresh
// browser context, so localStorage (bag, admin edits) starts empty.
import { test, expect } from '@playwright/test';

const OLIVE = '/products/olive-pique-polo/';
const isPhone = (page) => (page.viewportSize()?.width ?? 1440) <= 760;
const badge = (page) => page.locator('.site-header [data-bag-count]');
const addButton = (page) => page.locator('[data-pdp-form] [data-pdp-add]');
const sizeRadio = (page, name) => page.getByRole('radio', { name, exact: true });

async function ready(page, path) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/store-ready/);
}

/** Saves an edited copy of the catalogue the way the admin does, before the page loads. */
async function withEditedCatalog(page, request, edit) {
  const res = await request.get('/assets/data/store.json');
  const { version, catalog } = await res.json();
  const products = edit(structuredClone(catalog.products));
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'mono.catalog.v1',
    JSON.stringify({ version, products, savedAt: new Date().toISOString() }),
  ]);
}

test.describe('product page', () => {
  test('Add to bag without a size shows the error, focuses the sizes and adds nothing', async ({ page }) => {
    await ready(page, OLIVE);
    await addButton(page).click();
    const error = page.locator('#pdp-size-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Choose a size');
    await expect(page.locator('[data-pdp-options]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-pdp-options]')).toHaveAttribute('aria-describedby', 'pdp-size-error');
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('value'))).toBe('S');
    await expect(badge(page)).toHaveText('0');
    await expect(page.locator('#cart-drawer')).toBeHidden();
    // Picking a size clears the error.
    await sizeRadio(page, 'M').check();
    await expect(error).toBeHidden();
    await expect(page.locator('[data-pdp-options]')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('choose M then add: badge 1 and the drawer shows the line with Size: M', async ({ page }) => {
    await ready(page, OLIVE);
    await sizeRadio(page, 'M').check();
    await expect(page.locator('[data-pdp-chosen]')).toHaveText(': M');
    await expect(page).toHaveURL(/\?size=M$/);
    await expect(page.locator('[data-pdp-stock]')).toHaveText('In stock');
    await addButton(page).click();
    await expect(badge(page)).toHaveText('1');
    const drawer = page.locator('#cart-drawer');
    await expect(drawer).toBeVisible();
    const line = drawer.locator('[data-line][data-slug="olive-pique-polo"][data-variant="M"]');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-meta')).toContainText('Size: M');
    await expect(addButton(page)).toHaveClass(/is-added/);
    await expect(addButton(page)).toContainText('Added');
  });

  test('?size=L preselects L (case-insensitive); unknown or sold-out sizes are ignored', async ({ page }) => {
    await ready(page, `${OLIVE}?size=l`);
    await expect(sizeRadio(page, 'L')).toBeChecked();
    await expect(page.locator('[data-pdp-options] legend')).toHaveText('Size: L');
    await ready(page, `${OLIVE}?size=XS`);
    await expect(page.locator('input[name="size"]:checked')).toHaveCount(0);
    await ready(page, '/products/blue-stripe-shirt/?size=S');
    await expect(page.locator('input[name="size"]:checked')).toHaveCount(0);
  });

  test('blue-stripe-shirt S is disabled and announced as sold out', async ({ page }) => {
    await ready(page, '/products/blue-stripe-shirt/');
    const s = sizeRadio(page, 'S, sold out');
    await expect(s).toBeDisabled();
    await expect(page.locator('[data-pdp-stock]')).toHaveText('Sold out in S');
    await expect(sizeRadio(page, 'M')).toBeEnabled();
  });

  test('a thumbnail (desktop) or a dot (phone) changes the main image', async ({ page }) => {
    await ready(page, OLIVE);
    const media = page.locator('#pdp-media');
    await expect(media.locator('[data-slide="0"]')).toHaveClass(/is-active/);
    if (isPhone(page)) {
      await page.locator('[data-dot="1"]').click();
      await expect(page.locator('[data-dot="1"]')).toHaveAttribute('aria-current', 'true');
    } else {
      await page.locator('[data-thumb="1"]').click();
      await expect(page.locator('[data-thumb="1"]')).toHaveAttribute('aria-current', 'true');
      // Arrow keys move through the thumbnails too.
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-thumb="2"]')).toBeFocused();
      await expect(media.locator('[data-slide="2"]')).toHaveClass(/is-active/);
      await page.keyboard.press('ArrowUp');
    }
    await expect(media.locator('[data-slide="1"]')).toHaveClass(/is-active/);
    await expect(media.locator('[data-slide="1"] img')).toBeVisible();
    await expect(media.locator('[data-slide="1"] img')).toHaveAttribute('src', /cut-olive-pique-polo-back/);
    await expect(page.locator('[data-pdp-index]')).toHaveText('02');
  });

  test('the full-screen viewer opens, follows arrow keys and closes with Esc', async ({ page }) => {
    await ready(page, OLIVE);
    await page.locator('[data-pdp-zoom]').click();
    const viewer = page.locator('#pdp-viewer');
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('[data-viewer-index]')).toHaveText('01');
    await page.keyboard.press('ArrowRight');
    await expect(viewer.locator('[data-viewer-index]')).toHaveText('02');
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    // The gallery stays on the image last viewed.
    await expect(page.locator('#pdp-media [data-slide="1"]')).toHaveClass(/is-active/);
  });

  test('the olive polo swatch links to the navy polo', async ({ page }) => {
    await ready(page, OLIVE);
    const swatches = page.locator('.pdp-swatches');
    await expect(swatches.locator('[aria-current="true"]')).toContainText('Olive');
    const navy = swatches.getByRole('link', { name: 'Navy', exact: true });
    await expect(navy).toHaveAttribute('href', '/products/navy-pique-polo/');
    await navy.click();
    await expect(page).toHaveURL(/\/products\/navy-pique-polo\/$/);
    await expect(page.locator('h1')).toHaveText('Navy Piqué Polo');
  });

  test('the one-size watch has no size picker and adds directly', async ({ page }) => {
    await ready(page, '/products/black-dial-watch/');
    await expect(page.locator('[data-pdp-options]')).toHaveCount(0);
    await expect(page.locator('[data-open-guide]')).toHaveCount(0);
    await expect(page.locator('[data-pdp-stock]')).toHaveText('In stock');
    await addButton(page).click();
    await expect(badge(page)).toHaveText('1');
    await expect(page.locator('#cart-drawer [data-line][data-slug="black-dial-watch"]')).toBeVisible();
  });

  test('the quantity stepper stays between 1 and the stock (capped at 10)', async ({ page }) => {
    await ready(page, '/products/white-dial-watch/');
    const stepper = page.locator('[data-pdp-qty]');
    const minus = stepper.locator('[data-step="-1"]');
    const plus = stepper.locator('[data-step="1"]');
    const value = stepper.locator('output');
    await expect(value).toHaveText('1');
    await expect(minus).toBeDisabled();
    await plus.click();
    await plus.click();
    await expect(value).toHaveText('3');
    await expect(plus).toBeDisabled();
    await expect(page.locator('[data-pdp-stock]')).toHaveText('Only 3 left');
    await minus.click();
    await expect(value).toHaveText('2');
    await addButton(page).click();
    await expect(badge(page)).toHaveText('2');

    // Sized: the cap follows the chosen size, and never passes 10.
    await ready(page, '/products/charcoal-textured-tee/');
    await sizeRadio(page, 'M').check();
    for (let i = 0; i < 14 && !(await plus.isDisabled()); i += 1) await plus.click();
    await expect(value).toHaveText('10');
    await sizeRadio(page, 'XXL').check();
    await expect(value).toHaveText('3');
    await expect(page.locator('[data-pdp-stock]')).toHaveText('Only 3 left in XXL');
    await expect(plus).toBeDisabled();
  });

  test('the phone sticky bar appears once Add to bag scrolls away (never on desktop)', async ({ page }) => {
    await ready(page, OLIVE);
    const bar = page.locator('[data-pdp-sticky]');
    await expect(bar).toBeHidden();
    await page.evaluate(() => {
      const form = document.querySelector('[data-pdp-form]');
      window.scrollTo(0, form.getBoundingClientRect().bottom + window.scrollY + 160);
    });
    if (!isPhone(page)) {
      await expect(bar).toBeHidden();
      return;
    }
    await expect(bar).toBeVisible();
    await expect(bar).toHaveClass(/is-shown/);
    await expect(bar.locator('[data-sticky-size]')).toHaveText('Select size');
    // A jump straight back to the top hides it again.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeHidden();
    // From the bar with no size: back to the sizes, error shown, nothing added.
    await page.evaluate(() => {
      const form = document.querySelector('[data-pdp-form]');
      window.scrollTo(0, form.getBoundingClientRect().bottom + window.scrollY + 160);
    });
    await expect(bar).toBeVisible();
    await bar.locator('[data-sticky-add]').click();
    await expect(page.locator('#pdp-size-error')).toBeVisible();
    await expect(page.locator('[data-pdp-options]')).toBeInViewport();
    await expect(badge(page)).toHaveText('0');
  });

  test('the size guide dialog opens with the right table and closes with Esc', async ({ page }) => {
    await ready(page, OLIVE);
    await page.getByRole('button', { name: 'Size guide', exact: true }).click();
    const guide = page.locator('#pdp-guide');
    await expect(guide).toBeVisible();
    await expect(guide.getByRole('heading', { name: 'Size guide' })).toBeVisible();
    await expect(guide.locator('table')).toContainText('Chest (in)');
    await expect(guide.getByRole('link', { name: 'Full size guide' })).toHaveAttribute('href', '/size-guide/');
    await page.keyboard.press('Escape');
    await expect(guide).toBeHidden();
    await expect(page.getByRole('button', { name: 'Size guide', exact: true })).toBeFocused();

    await ready(page, '/products/black-dress-belt/');
    await page.getByRole('button', { name: 'Size guide', exact: true }).click();
    await expect(page.locator('#pdp-guide table')).toContainText('Trouser waist (in)');
  });

  test('breadcrumb JSON-LD names equal the visible trail', async ({ page }) => {
    await page.goto(OLIVE);
    const visible = (await page.locator('.crumbs li').allTextContents()).map((t) => t.trim());
    expect(visible).toEqual(['Home', 'Shop', 'Polos', 'Olive Piqué Polo']);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const crumbs = blocks.map((b) => JSON.parse(b)).find((j) => j['@type'] === 'BreadcrumbList');
    expect(crumbs).toBeTruthy();
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(visible);
  });

  test('no Product, ProductGroup or Offer JSON-LD in demo mode', async ({ page }) => {
    for (const slug of ['olive-pique-polo', 'ivory-oxford-shirt', 'black-dial-watch']) {
      await page.goto(`/products/${slug}/`);
      const text = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');
      expect(text).not.toMatch(/"@type":"(Product|ProductGroup|Offer)"/);
      expect(text).not.toContain('"offers"');
    }
  });

  test('/product/?slug=olive-pique-polo renders the product; an unknown slug shows not found', async ({ page }) => {
    await ready(page, '/product/?slug=olive-pique-polo');
    await expect(page.locator('h1')).toHaveText('Olive Piqué Polo');
    await expect(page.locator('#pdp-media [data-slide="0"] img')).toBeVisible();
    await expect(page).toHaveTitle("Olive Piqué Polo | Men's Polo Shirts | MONO");
    await sizeRadio(page, 'L').check();
    await addButton(page).click();
    await expect(badge(page)).toHaveText('1');

    await ready(page, '/product/?slug=not-a-product');
    await expect(page.locator('h1')).toHaveText('Product not found');
    await expect(page.getByRole('link', { name: 'Shop all' }).first()).toHaveAttribute('href', '/collections/');
  });

  test('an admin edit re-renders name, price and stock from the store', async ({ page, request }) => {
    await withEditedCatalog(page, request, (products) => {
      const p = products.find((x) => x.slug === 'olive-pique-polo');
      p.name = 'Olive Polo, Edited';
      p.price = 52;
      p.variants.find((v) => v.id === 'M').stock = 0;
      return products;
    });
    await ready(page, OLIVE);
    await expect(page.locator('h1')).toHaveText('Olive Polo, Edited');
    await expect(page.locator('[data-pdp-price]')).toHaveText('$52');
    await expect(sizeRadio(page, 'M, sold out')).toBeDisabled();
    await expect(page.locator('[data-pdp-stock]')).toHaveText('Sold out in M');
  });

  test('a deleted product shows a calm "no longer available" state with links onward', async ({ page, request }) => {
    await withEditedCatalog(page, request, (products) => products.filter((x) => x.slug !== 'olive-pique-polo'));
    await ready(page, OLIVE);
    await expect(page.locator('h1')).toHaveText('No longer available');
    await expect(page.getByRole('link', { name: 'Shop Polos' })).toHaveAttribute('href', '/collections/polos/');
    await expect(page.locator('[data-pdp]')).toHaveCount(0);
  });
});
