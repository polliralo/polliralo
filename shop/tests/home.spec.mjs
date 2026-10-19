// Home page checks (desktop 1440x900 and Pixel 7). Run from the repo root:
//   SHOP_TEST_PORT=4481 npx playwright test -c playwright.shop.config.mjs shop/tests/home.spec.mjs --workers=2
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Counts come from the shipped catalogue, so adding a product needs no test edits.
const SEED = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));
const newCount = (products) => products.filter((p) => p.newArrival && !p.hidden).length;

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
const keyOf = (src) => (src ?? '').split('/').pop().replace(/-\d+\.(jpg|webp|avif)$/, '');

test.describe('hero', () => {
  test('three message slides, the h1 on the brand slide, the counter reads 01 / 03', async ({ page }) => {
    await openHome(page);
    const carousel = page.locator('[data-carousel]');
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = page.locator('[data-slide]');
    await expect(slides).toHaveCount(3);
    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide');
    await expect(slides.first()).toHaveAttribute('aria-label', '1 of 3');
    await expect(slides.first().locator('h1')).toHaveText('Less noise. Better essentials.');
    await expect(slides.nth(1).locator('h2')).toHaveText('The everyday uniform.');
    await expect(slides.nth(2).locator('h2')).toHaveText('Made for daylight.');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(counter(page)).toHaveText('01 / 03');
    expect(await slides.evaluateAll((els) => els.map((el) => el.inert))).toEqual([false, true, true]);
    // The first picture is the LCP: eager and high priority.
    await expect(slides.first().locator('.home-art-front img')).toHaveAttribute('fetchpriority', 'high');
  });

  test('next and previous change the slide and the counter', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('02 / 03');
    await expect(activeSlide(page)).toHaveAttribute('data-slide-id', 'uniform');
    await expect(activeSlide(page).getByRole('link', { name: 'Shop T-shirts' })).toHaveAttribute('href', '/collections/t-shirts/');
    await expect(page.locator('[data-hero-live]')).toHaveText('2 of 3: The everyday uniform.');
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('03 / 03');
    await expect(activeSlide(page).getByRole('link', { name: 'Shop sunglasses' })).toHaveAttribute('href', '/collections/sunglasses/');
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('01 / 03');
    await page.locator('[data-hero-prev]').click();
    await expect(counter(page)).toHaveText('03 / 03');
    expect(await page.locator('[data-slide]').evaluateAll((els) => els.filter((el) => !el.inert).length)).toBe(1);
  });

  test('the call to action keeps the same box on every slide', async ({ page }) => {
    await openHome(page);
    const boxes = [];
    for (let i = 0; i < 3; i += 1) {
      const cta = activeSlide(page).locator('.home-cta');
      await expect(cta).toBeVisible();
      boxes.push(await cta.boundingBox());
      if (i < 2) {
        await page.locator('[data-hero-next]').click();
        await expect(counter(page)).toHaveText(`0${i + 2} / 03`);
      }
    }
    for (const box of boxes.slice(1)) {
      for (const k of ['x', 'y', 'width', 'height']) expect(Math.abs(box[k] - boxes[0][k]), k).toBeLessThan(1);
    }
  });

  test('words never sit on a photo: the message column and the photo panel do not overlap', async ({ page }) => {
    await openHome(page);
    for (let i = 0; i < 3; i += 1) {
      const panel = activeSlide(page).locator('.home-panel');
      if (await panel.evaluate((el) => el.classList.contains('is-photo'))) {
        const copy = await activeSlide(page).locator('.home-copy-col').boundingBox();
        const pic = await panel.boundingBox();
        expect(copy.x + copy.width).toBeLessThanOrEqual(pic.x + 1);
      }
      await page.locator('[data-hero-next]').click();
    }
  });

  test('arrow keys move between slides', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText('02 / 03');
    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText('01 / 03');
  });

  test('a sideways swipe changes the slide; a short drag does not', async ({ page }) => {
    await openHome(page);
    const slides = page.locator('[data-slides]');
    const box = await slides.boundingBox();
    const y = box.y + box.height / 2;
    const init = { pointerType: 'touch', isPrimary: true, pointerId: 7, bubbles: true };
    await slides.dispatchEvent('pointerdown', { ...init, clientX: box.x + box.width * 0.7, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: box.x + box.width * 0.2, clientY: y + 4 });
    await expect(counter(page)).toHaveText('02 / 03');
    await slides.dispatchEvent('pointerdown', { ...init, clientX: 200, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: 180, clientY: y });
    await expect(counter(page)).toHaveText('02 / 03');
  });

  test('desktop: autoplay moves on after 8 seconds and the pause button stops it', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'no autoplay on phones');
    test.slow();
    await openHome(page);
    const carousel = page.locator('[data-carousel]');
    await expect(carousel).toHaveAttribute('data-autoplay', 'on');
    await expect(toggle(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Pause slideshow');
    // Nothing moves before the interval is up.
    await page.waitForTimeout(5_000);
    await expect(counter(page)).toHaveText('01 / 03');
    await expect(counter(page)).toHaveText('02 / 03', { timeout: 6_000 });
    // Autoplay moves are not announced (only manual ones are).
    await expect(page.locator('[data-hero-live]')).toHaveText('');
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Play slideshow');
    await expect(carousel).toHaveAttribute('data-playing', 'false');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(9_000);
    await expect(counter(page)).toHaveText('02 / 03');
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Pause slideshow');
    await expect(carousel).toHaveAttribute('data-playing', 'true');
  });

  test('phone: no autoplay and no pause button', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'phone only');
    test.slow();
    await openHome(page);
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-autoplay', 'off');
    await expect(toggle(page)).toBeHidden();
    await expect(page.locator('[data-hero-prev]')).toBeVisible();
    await expect(page.locator('[data-hero-next]')).toBeVisible();
    await page.waitForTimeout(9_000);
    await expect(counter(page)).toHaveText('01 / 03');
  });

  test('reduced motion: no autoplay, and moves happen without animation', async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-autoplay', 'off');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'false');
    await page.waitForTimeout(9_000);
    await expect(counter(page)).toHaveText('01 / 03');
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText('02 / 03');
    await expect(page.locator('[data-slide].is-entering, [data-slide].is-leaving')).toHaveCount(0);
  });

  test('no size selector, thumbnails, prices or add buttons in the hero', async ({ page }) => {
    await openHome(page);
    const hero = page.locator('[data-hero]');
    await expect(hero.locator('input, select, fieldset')).toHaveCount(0);
    await expect(hero.locator('[data-view], .home-thumbs, .home-thumb')).toHaveCount(0);
    await expect(hero.locator('.price, .tag, [data-add-slug], [data-hero-add]')).toHaveCount(0);
    expect(await hero.textContent()).not.toMatch(/\$\d/);
  });

  test('the phone hero is 320 to 400px tall and the categories follow straight after', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'phone only');
    await openHome(page);
    const hero = await page.locator('[data-hero]').boundingBox();
    expect(hero.height).toBeGreaterThanOrEqual(320);
    expect(hero.height).toBeLessThanOrEqual(400);
    const cats = await page.locator('.home-cats').boundingBox();
    expect(Math.abs(cats.y - (hero.y + hero.height))).toBeLessThan(2);
    expect(cats.y).toBeLessThan(page.viewportSize().height);
  });

  test('the faint MONO word lives only on the brand slide', async ({ page }) => {
    await openHome(page);
    const ghosts = page.locator('.ghost-word');
    await expect(ghosts).toHaveCount(1);
    await expect(page.locator('[data-slide-id="brand"] .ghost-word')).toHaveCount(1);
    await expect(ghosts).toHaveAttribute('aria-hidden', 'true');
    // Behind the clothing, never over it.
    const z = await page.evaluate(() => {
      const g = document.querySelector('.ghost-word');
      const art = document.querySelector('[data-slide-id="brand"] .home-art');
      return [Number(getComputedStyle(g).zIndex), Number(getComputedStyle(art).zIndex)];
    });
    expect(z[0]).toBeLessThan(z[1]);
  });
});

test.describe('page sections', () => {
  test('shop by category: six collections, labels under the photos', async ({ page }) => {
    await openHome(page);
    const links = page.locator('.home-cat-link');
    await expect(links).toHaveCount(6);
    await expect(links.first()).toHaveAttribute('href', '/collections/shirts/');
    const below = await links.evaluateAll((as) => as.every((a) => a.querySelector('.home-cat-label').getBoundingClientRect().top >= a.querySelector('.home-cat-media').getBoundingClientRect().bottom));
    expect(below).toBe(true);
  });

  test('new arrivals: product cards in a sideways snap rail', async ({ page }) => {
    await openHome(page);
    const rail = page.locator('[data-new-list]');
    await expect(rail.locator('.card')).toHaveCount(newCount(SEED.products));
    await expect(page.locator('.home-new a.link', { hasText: 'Shop all' })).toHaveAttribute('href', '/collections/?sort=new');
    const layout = await rail.evaluate((el) => ({ flow: getComputedStyle(el).gridAutoFlow, snap: getComputedStyle(el).scrollSnapType, scrolls: el.scrollWidth > el.clientWidth }));
    expect(layout.flow).toContain('column');
    expect(layout.snap).toContain('x');
    expect(layout.scrolls).toBe(true);
  });

  test('the look switch changes the panel', async ({ page }) => {
    await openHome(page);
    const section = page.locator('[data-look-section]');
    await section.scrollIntoViewIfNeeded();
    // The collections pages link here (/#home-look-title): keep the id on the heading.
    await expect(section.locator('h2#home-look-title')).toHaveText('Shop the look');
    const one = section.locator('.home-look-list[data-look="look-01"]');
    const two = section.locator('.home-look-list[data-look="look-02"]');
    await expect(one).toBeVisible();
    await expect(two).toBeHidden();
    await section.locator('label', { hasText: 'Look 02' }).click();
    await expect(two).toBeVisible();
    await expect(one).toBeHidden();
    await expect(two.locator('.home-item')).toHaveCount(4);
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
    await polo.locator('.chip', { hasText: /^Add size L$/ }).click();
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

  test('the watch feature adds the white-dial watch and links to the black dial', async ({ page }) => {
    await openHome(page);
    const panel = page.locator('[data-watch-panel]');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator('.tag')).toHaveText('Demo price');
    await panel.locator('.home-watch-actions [data-add-slug="white-dial-watch"]').click();
    await expect(page.locator('.site-header [data-bag-count]')).toHaveText('1');
    await expect(page.locator('#cart-drawer .line').first()).toContainText('White Dial Watch');
    await expect(panel.locator('a[href="/products/black-dial-watch/"]')).toBeAttached();
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
  });
});

test.describe('page basics', () => {
  test('one h1, the title and only WebSite and Organization JSON-LD', async ({ page }) => {
    await openHome(page);
    await expect(page).toHaveTitle('MONO | Modern Menswear Essentials');
    await expect(page.locator('h1')).toHaveCount(1);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((el) => JSON.parse(el.textContent)['@type']));
    expect(types.sort()).toEqual(['Organization', 'WebSite']);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeLessThanOrEqual(155);
  });

  test('no editorial photo appears twice on the page', async ({ page }) => {
    await openHome(page);
    const srcs = await page.locator('main img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    const editorial = srcs.map(keyOf).filter((k) => /^(life|wide|cut-look)-/.test(k));
    expect(editorial.length).toBeGreaterThan(5);
    const repeated = editorial.filter((k, i) => editorial.indexOf(k) !== i);
    expect(repeated).toEqual([]);
  });

  test('reveals only on editorial images, never on headings, cards or buttons', async ({ page }) => {
    await openHome(page);
    const reveals = await page.locator('main [data-reveal]').evaluateAll((els) => els.map((el) => ({
      hasImg: Boolean(el.querySelector('img')),
      bad: Boolean(el.matches('h1, h2, h3, .card, button, .btn, a') || el.querySelector('h1, h2, h3, .card, button, .btn')),
    })));
    expect(reveals.length).toBeGreaterThan(0);
    expect(reveals.every((r) => r.hasImg && !r.bad)).toBe(true);
  });

  test('no sideways overflow at 320px, no console errors, no failed requests', async ({ page }) => {
    const problems = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(String(e)));
    page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
    await page.setViewportSize({ width: 320, height: 640 });
    await openHome(page);
    const step = await page.evaluate(() => Math.round(innerHeight * 0.7));
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += step) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(40);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
    expect(problems).toEqual([]);
  });

  test('admin edits in this browser reach the hero art, new arrivals and panels', async ({ page }) => {
    await page.goto('/');
    const seed = await page.evaluate(() => fetch('/assets/data/store.json').then((r) => r.json()));
    const hide = ['navy-pique-polo', 'black-rectangular-sunglasses', 'tortoiseshell-round-sunglasses'];
    const products = seed.catalog.products.map((p) => {
      if (p.slug === 'olive-pique-polo') return { ...p, price: 52 };
      if (p.slug === 'cream-knit-polo') return { ...p, price: 54 };
      if (hide.includes(p.slug)) return { ...p, hidden: true };
      return p;
    });
    await page.evaluate(({ version, products: list }) => {
      localStorage.setItem('mono.catalog.v1', JSON.stringify({ version, products: list, savedAt: new Date().toISOString() }));
    }, { version: seed.version, products });
    await page.reload();
    // The brand slide no longer shows the hidden navy polo.
    await expect(page.locator('[data-art]')).toHaveAttribute('data-art-slug', 'blue-stripe-shirt');
    await expect(page.locator('[data-hero] img[src*="navy-pique-polo"]')).toHaveCount(0);
    await expect(page.locator('[data-slide]')).toHaveCount(3);
    await expect(page.locator('.home-new .card')).toHaveCount(newCount(products));
    await expect(page.locator('.home-new .card[data-slug="tortoiseshell-round-sunglasses"]')).toHaveCount(0);
    await expect(page.locator('.home-new .card[data-slug="cream-knit-polo"] .card-price')).toHaveText('$54');
    await expect(page.locator('.home-look-list[data-look="look-01"] .home-item')).toHaveCount(2);
    await expect(page.locator('.home-look-list[data-look="look-01"]')).toContainText('$52');
  });
});
