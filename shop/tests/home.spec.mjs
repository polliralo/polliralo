// Home page checks (desktop 1440x900 and Pixel 7). Run from the repo root:
//   SHOP_TEST_PORT=4301 npx playwright test --config playwright.shop.config.mjs shop/tests/home.spec.mjs
import { expect, test } from '@playwright/test';

const isPhone = (testInfo) => testInfo.project.name === 'mobile';

// Fresh storage for every test (kept across reloads inside one test).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('home-spec')) {
        localStorage.clear();
        sessionStorage.setItem('home-spec', '1');
      }
    } catch { /* storage blocked */ }
  });
});

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-carousel][data-ready]')).toBeAttached();
  await page.waitForFunction(() => document.documentElement.classList.contains('store-ready'));
}

const counter = (page) => page.locator('.home-bar-count');
const activeSlide = (page) => page.locator('[data-slide].is-active');
const toggle = (page) => page.locator('[data-hero-toggle]');

test.describe('hero product slider', () => {
  test('has six slides with carousel semantics and inert inactive slides', async ({ page }) => {
    await openHome(page);
    const carousel = page.locator('[data-carousel]');
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    await expect(carousel).toHaveAttribute('aria-label', /.+/);
    const slides = page.locator('[data-slide]');
    await expect(slides).toHaveCount(6);
    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide');
    await expect(slides.first()).toHaveAttribute('aria-label', '1 of 6');
    await expect(slides.first()).toHaveAttribute('data-slug', 'olive-pique-polo');
    const inert = await slides.evaluateAll((els) => els.map((el) => el.inert));
    expect(inert).toEqual([false, true, true, true, true, true]);
    await expect(counter(page)).toHaveText('01 / 06');
    // The first cut-out is the LCP image: eager, high priority, never lazy.
    const lcp = slides.first().locator('.home-layer img');
    await expect(lcp).toHaveAttribute('fetchpriority', 'high');
    await expect(slides.nth(1).locator('.home-layer img')).toHaveAttribute('loading', /lazy|eager/);
  });

  test('next and previous change the slide and the counter', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('02 / 06');
    await expect(activeSlide(page)).toHaveAttribute('data-slug', 'ivory-oxford-shirt');
    await expect(activeSlide(page).locator('h2')).toBeVisible();
    await expect(page.locator('[data-hero-next-name]')).toHaveText('Charcoal Textured Tee');
    // Manual navigation stops autoplay.
    await expect(toggle(page)).toContainText('Play');
    await expect(page.locator('[data-hero-live]')).toHaveText('2 of 6: Ivory Oxford Shirt');
    await page.locator('[data-hero-prev]').click();
    await expect(counter(page)).toHaveText('01 / 06');
    await page.locator('[data-hero-prev]').click();
    await expect(counter(page)).toHaveText('06 / 06');
    await expect(activeSlide(page)).toHaveAttribute('data-slug', 'navy-pique-polo');
    const inert = await page.locator('[data-slide]').evaluateAll((els) => els.filter((el) => !el.inert).length);
    expect(inert).toBe(1);
  });

  test('arrow keys move between products', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText('02 / 06');
    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText('01 / 06');
  });

  test('a sideways swipe changes the product', async ({ page }) => {
    await openHome(page);
    const slides = page.locator('[data-slides]');
    const box = await slides.boundingBox();
    const y = box.y + box.height / 2;
    const init = { pointerType: 'touch', isPrimary: true, pointerId: 7, bubbles: true };
    await slides.dispatchEvent('pointerdown', { ...init, clientX: box.x + box.width * 0.7, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: box.x + box.width * 0.2, clientY: y + 4 });
    await expect(counter(page)).toHaveText('02 / 06');
    // A short drag (under 40px) does nothing.
    await slides.dispatchEvent('pointerdown', { ...init, clientX: 200, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: 180, clientY: y });
    await expect(counter(page)).toHaveText('02 / 06');
  });

  test('the pause button toggles autoplay', async ({ page }) => {
    await openHome(page);
    await expect(toggle(page)).toBeVisible();
    await expect(toggle(page)).toContainText('Pause');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'true');
    await toggle(page).click();
    await expect(toggle(page)).toContainText('Play');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'false');
    await toggle(page).click();
    await expect(toggle(page)).toContainText('Pause');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'true');
  });

  test('autoplay moves on after the interval', async ({ page }) => {
    test.slow();
    await openHome(page);
    await expect(counter(page)).toHaveText('02 / 06', { timeout: 12_000 });
    await expect(activeSlide(page)).toHaveAttribute('data-slug', 'ivory-oxford-shirt');
    // Autoplay moves are not announced (only manual ones are).
    await expect(page.locator('[data-hero-live]')).toHaveText('');
  });

  test('Add to bag without a size shows a message and adds nothing', async ({ page }, testInfo) => {
    // The phone hero has no size picker ("Shop now" instead), so use a wider viewport there.
    if (isPhone(testInfo)) await page.setViewportSize({ width: 1180, height: 900 });
    await openHome(page);
    const slide = activeSlide(page);
    await slide.locator('[data-hero-add]').click();
    await expect(slide.locator('[data-hero-msg]')).toHaveText('Choose a size first.');
    await expect(slide.locator('[data-hero-sizes]')).toHaveClass(/is-invalid/);
    expect(await page.evaluate(() => document.activeElement?.classList.contains('home-size-input'))).toBe(true);
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('0');
    await expect(page.locator('#cart-drawer')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mono.cart.v1') ?? '[]').length)).toBe(0);
  });

  test('Add to bag with a size adds it and opens the bag', async ({ page }, testInfo) => {
    if (isPhone(testInfo)) await page.setViewportSize({ width: 1180, height: 900 });
    await openHome(page);
    const slide = activeSlide(page);
    await slide.locator('label', { hasText: /^M$/ }).click();
    await expect(slide.locator('input[value="M"]')).toBeChecked();
    await slide.locator('[data-hero-add]').click();
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('1');
    await expect(page.locator('#cart-drawer')).toHaveAttribute('open', '');
    await expect(page.locator('#cart-drawer .line').first()).toContainText('Olive Piqué Polo');
    await expect(slide.locator('[data-hero-add]')).toContainText('Added');
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('mono.cart.v1')));
    expect(cart).toEqual([{ slug: 'olive-pique-polo', variant: 'M', qty: 1 }]);
  });

  test('sold-out sizes are disabled and announced', async ({ page }, testInfo) => {
    if (isPhone(testInfo)) await page.setViewportSize({ width: 1180, height: 900 });
    await openHome(page);
    const stripe = page.locator('[data-slide][data-slug="blue-stripe-shirt"]');
    await expect(stripe.locator('input[value="S"]')).toBeDisabled();
    await expect(stripe.locator('label.is-out')).toContainText('sold out');
  });

  test('angle thumbnails swap the main image', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'the phone hero has no thumbnails');
    await openHome(page);
    const slide = activeSlide(page);
    const back = slide.locator('[data-view="cut-olive-pique-polo-back"]');
    await back.click();
    await expect(back).toHaveAttribute('aria-pressed', 'true');
    await expect(slide.locator('.home-layer.is-current')).toHaveAttribute('data-key', 'cut-olive-pique-polo-back');
    await expect(slide.locator('.home-layer')).toHaveCount(1);
    await expect(slide.locator('.home-layer.is-current img')).toHaveAttribute('alt', /back view/);
  });

  test('the phone hero is compact and categories follow straight after', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'phone only');
    await openHome(page);
    const hero = await page.locator('[data-hero]').boundingBox();
    expect(hero.height).toBeGreaterThanOrEqual(290);
    expect(hero.height).toBeLessThanOrEqual(360);
    await expect(activeSlide(page).locator('.home-shop')).toBeVisible();
    await expect(activeSlide(page).locator('[data-hero-sizes]')).toBeHidden();
    await expect(activeSlide(page).locator('.home-thumbs')).toBeHidden();
    const cats = await page.locator('.home-cats').boundingBox();
    expect(cats.y).toBeLessThan(page.viewportSize().height);
    expect(cats.y - (hero.y + hero.height)).toBeLessThan(4);
  });
});

test.describe('with reduced motion', () => {
  test('there is no autoplay', async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await expect(toggle(page)).toContainText('Play');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'false');
    await page.waitForTimeout(8_000);
    await expect(counter(page)).toHaveText('01 / 06');
    // Manual moves still work, without animation classes.
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('02 / 06');
    await expect(page.locator('[data-slide].is-entering, [data-slide].is-leaving')).toHaveCount(0);
  });
});

test.describe('page sections', () => {
  test('shop by category links to the six collections with labels under the photos', async ({ page }) => {
    await openHome(page);
    const links = page.locator('.home-cat-link');
    await expect(links).toHaveCount(6);
    await expect(links.first()).toHaveAttribute('href', '/collections/shirts/');
    const labelBelow = await links.first().evaluate((a) => {
      const img = a.querySelector('.home-cat-media').getBoundingClientRect();
      const label = a.querySelector('.home-cat-label').getBoundingClientRect();
      return label.top >= img.bottom;
    });
    expect(labelBelow).toBe(true);
  });

  test('new arrivals show product cards and a shop all link', async ({ page }) => {
    await openHome(page);
    const section = page.locator('.home-new');
    await expect(section.locator('.card')).toHaveCount(6);
    await expect(section.locator('a.link', { hasText: 'Shop all' })).toHaveAttribute('href', '/collections/');
  });

  test('the look switch changes the panel', async ({ page }) => {
    await openHome(page);
    const section = page.locator('[data-look-section]');
    await section.scrollIntoViewIfNeeded();
    const one = section.locator('.home-look-list[data-look="look-01"]');
    const two = section.locator('.home-look-list[data-look="look-02"]');
    await expect(one).toBeVisible();
    await expect(one).toContainText('Olive Piqué Polo');
    await expect(two).toBeHidden();
    await section.locator('label', { hasText: 'Look 02' }).click();
    await expect(two).toBeVisible();
    await expect(one).toBeHidden();
    await expect(two.locator('.home-item')).toHaveCount(4);
    await expect(two).toContainText('Ivory Oxford Shirt');
    await expect(section.locator('.home-look-text[data-look="look-02"] h3')).toHaveText('Look 02');
    await expect(section.locator('.home-look-figure[data-look="look-02"]')).toBeVisible();
  });

  test('look items: sized items show size chips first, one-size items add directly', async ({ page }) => {
    await openHome(page);
    const one = page.locator('.home-look-list[data-look="look-01"]');
    await one.scrollIntoViewIfNeeded();
    const polo = one.locator('.home-item[data-slug="olive-pique-polo"]');
    await polo.locator('[data-choose]').click();
    await expect(polo.locator('[data-choose]')).toHaveAttribute('aria-expanded', 'true');
    await expect(polo.locator('.home-item-sizes')).toBeVisible();
    await polo.locator('.chip', { hasText: 'L' }).first().click();
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('1');
    await expect(polo.locator('.home-item-sizes')).toBeHidden();
    await page.locator('#cart-drawer [data-close-dialog]').click();
    await expect(page.locator('#cart-drawer')).not.toHaveAttribute('open', '');
    await one.locator('.home-item[data-slug="black-rectangular-sunglasses"] [data-add-slug]').click();
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('2');
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('mono.cart.v1')));
    expect(cart).toEqual([
      { slug: 'olive-pique-polo', variant: 'L', qty: 1 },
      { slug: 'black-rectangular-sunglasses', variant: 'OS', qty: 1 },
    ]);
  });

  test('the watch spotlight adds the watch', async ({ page }) => {
    await openHome(page);
    const panel = page.locator('[data-watch-panel]');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator('.tag')).toHaveText('Demo price');
    await panel.locator('.home-watch-actions [data-add-slug="black-dial-watch"]').click();
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('1');
    await expect(panel.locator('a[href="/products/white-dial-watch/"]')).toBeAttached();
  });

  test('newsletter validates the email and says nothing is sent', async ({ page }) => {
    await openHome(page);
    const form = page.locator('.home-news-form');
    await form.scrollIntoViewIfNeeded();
    await expect(form).toContainText('nothing is sent or saved');
    const email = form.getByLabel('Email address');
    await email.fill('not-an-email');
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[data-form-message]')).toHaveText('Enter an email address like name@example.com.');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await email.fill('name@example.com');
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[data-form-message]')).toContainText('nothing was sent or saved');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('page basics', () => {
  test('one h1, the right title and only WebSite and Organization JSON-LD', async ({ page }) => {
    await openHome(page);
    await expect(page).toHaveTitle('MONO | Modern Menswear Essentials');
    await expect(page.locator('h1')).toHaveCount(1);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((el) => JSON.parse(el.textContent)['@type']));
    expect(types.sort()).toEqual(['Organization', 'WebSite']);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).not.toMatch(/\$/);
  });

  test('no sideways overflow, no console errors and no failed requests', async ({ page }) => {
    const problems = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(String(e)));
    page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
    await openHome(page);
    const step = await page.evaluate(() => Math.round(innerHeight * 0.7));
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += step) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
    expect(problems).toEqual([]);
  });

  test('admin edits in this browser reach the hero, new arrivals and panels', async ({ page }) => {
    await page.goto('/');
    const seed = await page.evaluate(() => fetch('/assets/data/store.json').then((r) => r.json()));
    const products = seed.catalog.products.map((p) => {
      if (p.slug === 'olive-pique-polo') return { ...p, price: 52 };
      if (p.slug === 'navy-pique-polo' || p.slug === 'black-rectangular-sunglasses') return { ...p, hidden: true };
      return p;
    });
    await page.evaluate(({ version, products: list }) => {
      localStorage.setItem('mono.catalog.v1', JSON.stringify({ version, products: list, savedAt: new Date().toISOString() }));
    }, { version: seed.version, products });
    await page.reload();
    await expect(page.locator('[data-slide]')).toHaveCount(5);
    await expect(counter(page)).toHaveText('01 / 05');
    await expect(activeSlide(page).locator('.home-price')).toContainText('$52');
    await expect(page.locator('.home-new .card')).toHaveCount(5);
    await expect(page.locator('.home-look-list[data-look="look-01"] .home-item')).toHaveCount(2);
    await expect(page.locator('.home-look-list[data-look="look-01"]')).toContainText('$52');
  });
});
