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

// The hero's five messages, best first (HERO_SLIDES in assets/js/pages/home-view.js).
const SLIDES = [
  { id: 'brand', title: 'Less noise. Better essentials.', href: '/collections/?sort=new', script: ['Modern', 'classics'] },
  { id: 'polos', title: 'Weekends, with a collar.', link: 'Shop polos', href: '/collections/polos/', script: ['Off', 'duty'] },
  { id: 'daylight', title: 'Made for daylight.', link: 'Shop sunglasses', href: '/collections/sunglasses/', script: ['Golden', 'hour'] },
  { id: 'shirts', title: 'Oxfords and a fine stripe.', link: 'Shop shirts', href: '/collections/shirts/', script: ['Sharp', 'lines'] },
  { id: 'finish', title: 'Finish the outfit.', link: 'Shop accessories', href: '/collections/accessories/', script: ['Fine', 'details'] },
];
const N = SLIDES.length;
const pad2 = (n) => String(n).padStart(2, '0');
const count = (i) => `${pad2(i)} / ${pad2(N)}`;

test.describe('hero', () => {
  test('five message slides, the h1 on the brand slide, the counter reads 01 / 05', async ({ page }) => {
    await openHome(page);
    const carousel = page.locator('[data-carousel]');
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = page.locator('[data-slide]');
    await expect(slides).toHaveCount(N);
    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide');
    await expect(slides.first()).toHaveAttribute('aria-label', `1 of ${N}`);
    await expect(slides.first().locator('h1')).toHaveText(SLIDES[0].title);
    for (let i = 1; i < N; i += 1) await expect(slides.nth(i).locator('h2')).toHaveText(SLIDES[i].title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(counter(page)).toHaveText(count(1));
    expect(await slides.evaluateAll((els) => els.map((el) => el.inert))).toEqual(SLIDES.map((s, i) => i > 0));
    // The first picture is the LCP: eager and high priority.
    await expect(slides.first().locator('.home-character img')).toHaveAttribute('fetchpriority', 'high');
  });

  test('next and previous go through every slide and wrap around', async ({ page }) => {
    await openHome(page);
    for (let i = 1; i < N; i += 1) {
      await page.locator('[data-hero-next]').click();
      await expect(counter(page)).toHaveText(count(i + 1));
      await expect(activeSlide(page)).toHaveAttribute('data-slide-id', SLIDES[i].id);
      await expect(activeSlide(page).getByRole('link', { name: SLIDES[i].link })).toHaveAttribute('href', SLIDES[i].href);
      if (i === 1) await expect(page.locator('[data-hero-live]')).toHaveText(`2 of ${N}: ${SLIDES[1].title}`);
    }
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText(count(1));
    await expect(activeSlide(page).locator('.home-cta')).toHaveAttribute('href', SLIDES[0].href);
    await page.locator('[data-hero-prev]').click();
    await expect(counter(page)).toHaveText(count(N));
    expect(await page.locator('[data-slide]').evaluateAll((els) => els.filter((el) => !el.inert).length)).toBe(1);
  });

  test('the call to action keeps the same box on every slide', async ({ page }) => {
    await openHome(page);
    const boxes = [];
    for (let i = 0; i < N; i += 1) {
      const cta = activeSlide(page).locator('.home-cta');
      await expect(cta).toBeVisible();
      boxes.push(await cta.boundingBox());
      if (i < N - 1) {
        await page.locator('[data-hero-next]').click();
        await expect(counter(page)).toHaveText(count(i + 2));
      }
    }
    for (const box of boxes.slice(1)) {
      for (const k of ['x', 'y', 'width', 'height']) expect(Math.abs(box[k] - boxes[0][k]), k).toBeLessThan(1);
    }
  });

  test('words never sit on a picture: the message column and the picture panel do not overlap', async ({ page }) => {
    await openHome(page);
    for (let i = 0; i < N; i += 1) {
      const copy = await activeSlide(page).locator('.home-copy-col').boundingBox();
      const pic = await activeSlide(page).locator('.home-panel').boundingBox();
      // Beside it on wide screens, below it on phones.
      const apart = copy.x + copy.width <= pic.x + 1 || copy.y >= pic.y + pic.height - 1;
      expect(apart, SLIDES[i].id).toBe(true);
      await page.locator('[data-hero-next]').click();
      await expect(counter(page)).toHaveText(count(((i + 1) % N) + 1));
    }
  });

  test('every character stands at his own proportions from just below the top to the bottom edge, centred', async ({ page }) => {
    // Layout only: no animation while measuring.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    for (let i = 0; i < N; i += 1) {
      const m = await activeSlide(page).evaluate((el) => {
        if (el.querySelector('.home-panel.is-still')) return null;
        const img = el.querySelector('.home-character img');
        const p = el.querySelector('.home-panel').getBoundingClientRect();
        const b = img.getBoundingClientRect();
        return { ratio: b.width / b.height, top: b.top - p.top, bottom: b.bottom - p.bottom, left: b.left - p.left, right: p.right - b.right, ph: p.height };
      });
      if (m) {
        expect(Math.abs(m.ratio - 1122 / 1402), SLIDES[i].id).toBeLessThan(0.01);
        // A little air above the head (the cut-outs carry their own headroom
        // too), and the hero's bottom edge cuts the rest.
        expect(m.top / m.ph, SLIDES[i].id).toBeGreaterThan(0.04);
        expect(m.top / m.ph, SLIDES[i].id).toBeLessThan(0.09);
        expect(m.bottom, SLIDES[i].id).toBeGreaterThanOrEqual(-1);
        // Centred: the cut-outs' empty margins may overhang, the person never does.
        expect(Math.abs(m.left - m.right), SLIDES[i].id).toBeLessThan(2);
      }
      await page.locator('[data-hero-next]').click();
      await expect(counter(page)).toHaveText(count(((i + 1) % N) + 1));
    }
  });

  test('every slide has the same stage: no box, a big circle, two small ones and a brush phrase, all behind the picture', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    for (let i = 0; i < N; i += 1) {
      const slide = activeSlide(page);
      const script = slide.locator('.home-script');
      await expect(script).toHaveAttribute('aria-hidden', 'true');
      await expect(script).toHaveAttribute('data-a', SLIDES[i].script[0]);
      await expect(script).toHaveAttribute('data-b', SLIDES[i].script[1]);
      const m = await slide.evaluate((el) => {
        const panel = el.querySelector('.home-panel');
        const disc = el.querySelector('.home-disc');
        const art = el.querySelector('.home-art');
        const z = (node) => Number(getComputedStyle(node).zIndex);
        const p = panel.getBoundingClientRect();
        const d = disc.getBoundingClientRect();
        const cs = getComputedStyle(panel);
        return {
          hero: getComputedStyle(document.querySelector('[data-hero]')).backgroundColor,
          panel: cs.backgroundColor, radius: parseFloat(cs.borderTopLeftRadius),
          dots: ['::before', '::after'].map((pseudo) => getComputedStyle(panel, pseudo)).map((d2) => d2.content !== 'none' && parseFloat(d2.borderTopLeftRadius) > 0 && parseFloat(d2.width) > 0),
          round: Math.abs(d.width - d.height) < 1 && getComputedStyle(disc).borderTopLeftRadius === '50%',
          centred: Math.abs((d.left + d.width / 2) - (p.left + p.width / 2)) < 2,
          order: [z(disc), z(el.querySelector('.home-script')), z(art)],
          font: getComputedStyle(el.querySelector('.home-script')).fontFamily,
          text: panel.textContent.trim(),
        };
      });
      // A light cream stage with no box around it (on phones the words below sit on white).
      expect(m.panel, SLIDES[i].id).toBe('rgb(247, 241, 232)');
      expect(m.hero, SLIDES[i].id).toBe(isPhone(testInfo) ? 'rgb(255, 255, 255)' : 'rgb(247, 241, 232)');
      expect(m.radius, SLIDES[i].id).toBe(0);
      expect(m.round && m.centred, SLIDES[i].id).toBe(true);
      expect(m.dots, SLIDES[i].id).toEqual([true, true]);
      // Circle, then phrase, then picture: nothing is drawn over the picture.
      expect(m.order[0] < m.order[1] && m.order[1] < m.order[2], SLIDES[i].id).toBe(true);
      expect(m.font, SLIDES[i].id).toContain('Alex Brush');
      // The phrase is decoration (drawn from data attributes): no text in the stage, and no MONO wall word.
      expect(m.text, SLIDES[i].id).toBe('');
      await page.locator('[data-hero-next]').click();
      await expect(counter(page)).toHaveText(count(((i + 1) % N) + 1));
    }
    await expect(page.locator('.home-word, .ghost-word')).toHaveCount(0);
  });

  test('a slide change opens the new stage in a widening circle over the old one', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').click();
    const anim = await page.locator('[data-slide-id="polos"]').evaluate((el) => ({
      entering: el.classList.contains('is-entering'),
      names: getComputedStyle(el.querySelector('.home-panel')).animationName,
      script: getComputedStyle(el.querySelector('.home-script')).animationName,
    }));
    expect(anim.entering).toBe(true);
    expect(anim.names).toContain('home-open');
    expect(anim.script).toContain('home-write');
    // The old slide stays drawn beneath until it is covered, then goes.
    await expect(page.locator('[data-slide-id="brand"]')).toHaveClass(/is-leaving/);
    await expect(page.locator('[data-slide-id="brand"]')).not.toHaveClass(/is-leaving/, { timeout: 3000 });
    await expect(page.locator('[data-slide-id="polos"]')).not.toHaveClass(/is-entering/, { timeout: 3000 });
  });

  test('arrow keys move between slides', async ({ page }) => {
    await openHome(page);
    await page.locator('[data-hero-next]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText(count(2));
    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText(count(1));
  });

  test('a sideways swipe changes the slide; a short drag does not', async ({ page }) => {
    await openHome(page);
    const slides = page.locator('[data-slides]');
    const box = await slides.boundingBox();
    const y = box.y + box.height / 2;
    const init = { pointerType: 'touch', isPrimary: true, pointerId: 7, bubbles: true };
    await slides.dispatchEvent('pointerdown', { ...init, clientX: box.x + box.width * 0.7, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: box.x + box.width * 0.2, clientY: y + 4 });
    await expect(counter(page)).toHaveText(count(2));
    await slides.dispatchEvent('pointerdown', { ...init, clientX: 200, clientY: y });
    await slides.dispatchEvent('pointerup', { ...init, clientX: 180, clientY: y });
    await expect(counter(page)).toHaveText(count(2));
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
    await expect(counter(page)).toHaveText(count(1));
    await expect(counter(page)).toHaveText(count(2), { timeout: 6_000 });
    // Autoplay moves are not announced (only manual ones are).
    await expect(page.locator('[data-hero-live]')).toHaveText('');
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Play slideshow');
    await expect(carousel).toHaveAttribute('data-playing', 'false');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(9_000);
    await expect(counter(page)).toHaveText(count(2));
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
    await expect(counter(page)).toHaveText(count(1));
  });

  test('reduced motion: no autoplay, and moves happen without animation', async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-autoplay', 'off');
    await expect(page.locator('[data-carousel]')).toHaveAttribute('data-playing', 'false');
    await page.waitForTimeout(9_000);
    await expect(counter(page)).toHaveText(count(1));
    await page.locator('[data-hero-next]').click();
    await expect(counter(page)).toHaveText(count(2));
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

  test('the phone hero: the picture large on top, the words below, the categories right after', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'phone only');
    await openHome(page);
    const hero = await page.locator('[data-hero]').boundingBox();
    expect(hero.height).toBeGreaterThanOrEqual(540);
    expect(hero.height).toBeLessThanOrEqual(700);
    const pic = await activeSlide(page).locator('.home-panel').boundingBox();
    const copy = await activeSlide(page).locator('.home-copy-col').boundingBox();
    expect(pic.height).toBeGreaterThanOrEqual(340);
    expect(pic.y + pic.height).toBeLessThanOrEqual(copy.y + 1);
    const cats = await page.locator('.home-cats').boundingBox();
    expect(Math.abs(cats.y - (hero.y + hero.height))).toBeLessThan(2);
    expect(cats.y).toBeLessThan(page.viewportSize().height);
  });

  test('the brand slide: the owner\'s character, large, with his head inside the circle and between the two words', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    const slide = page.locator('[data-slide-id="brand"]');
    await expect(slide.locator('.home-character img')).toHaveAttribute('src', /cut-look-02-/);
    const m = await slide.evaluate((el) => {
      const panel = el.querySelector('.home-panel');
      const img = el.querySelector('.home-character img');
      const disc = el.querySelector('.home-disc').getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const b = img.getBoundingClientRect();
      // The person inside the 1122 x 1402 cut-out (measured from
      // media/cutouts/look-02.png): x 343 to 793, head at y 50 (its middle
      // at x 539), the aviators in his hand end near y 968.
      const person = {
        left: b.left + b.width * (343 / 1122), right: b.left + b.width * (793 / 1122),
        head: b.top + b.height * (50 / 1402), headX: b.left + b.width * (539 / 1122), glasses: b.top + b.height * (968 / 1402),
      };
      const r = disc.width / 2;
      const cx = disc.left + r;
      const cy = disc.top + r;
      // The gap between the phrase's two words, centred on the stage.
      const gap = parseFloat(getComputedStyle(el.querySelector('.home-script')).columnGap) || 0;
      const cols = getComputedStyle(el.querySelector('.home-script')).gridTemplateColumns.split(' ').map(parseFloat);
      return {
        share: (person.glasses - person.head) / p.height,
        inside: person.left >= p.left + 4 && person.right <= p.right - 4 && person.head >= p.top + 8 && person.glasses <= p.bottom - 4,
        headInCircle: Math.hypot(person.headX - cx, person.head + 0.05 * p.height - cy) < r,
        headNearGap: Math.abs(person.headX - (p.left + p.width / 2)) < cols[1] / 2 + gap,
      };
    });
    // Head to hand fills most of the stage, nothing is cut, and his head
    // sits inside the big circle, in the gap between "Modern" and "classics".
    expect(m.share).toBeGreaterThan(0.75);
    expect(m.inside).toBe(true);
    expect(m.headInCircle).toBe(true);
    expect(m.headNearGap).toBe(true);
  });

  test('the polos slide: one character cut from the owner\'s terrace photo, on the same stage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await page.locator('[data-hero-next]').click();
    await expect(activeSlide(page)).toHaveAttribute('data-slide-id', 'polos');
    await expect(activeSlide(page).locator('.home-character img')).toHaveCount(1);
    await expect(activeSlide(page).locator('.home-character img')).toHaveAttribute('src', /cut-cream-polo-walk-/);
    await expect(activeSlide(page).locator('.home-pair-item')).toHaveCount(0);
    await expect(activeSlide(page).locator('.home-panel')).toHaveClass(/is-full/);
  });

  test('the accessories slide: the belt and wallet still life rests on the circle, under its phrase', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await page.locator('[data-hero-prev]').click();
    await expect(activeSlide(page)).toHaveAttribute('data-slide-id', 'finish');
    const img = activeSlide(page).locator('.home-character img');
    await expect(img).toHaveAttribute('src', /cut-accessories-still-/);
    const m = await activeSlide(page).evaluate((el) => {
      const p = el.querySelector('.home-panel').getBoundingClientRect();
      const b = el.querySelector('.home-character img').getBoundingClientRect();
      const d = el.querySelector('.home-disc').getBoundingClientRect();
      return { inside: b.left >= p.left && b.right <= p.right && b.top >= p.top && b.bottom <= p.bottom, ratio: b.width / b.height, onDisc: Math.abs((b.left + b.width / 2) - (d.left + d.width / 2)) < 2 };
    });
    expect(m.inside).toBe(true);
    expect(m.onDisc).toBe(true);
    expect(Math.abs(m.ratio - 1340 / 1018)).toBeLessThan(0.01);
    // No T-shirt slide any more.
    await expect(page.locator('[data-hero] a[href="/collections/t-shirts/"]')).toHaveCount(0);
  });

  test('the call to action is a black pill', async ({ page }) => {
    await openHome(page);
    const cta = activeSlide(page).locator('.home-cta');
    const s = await cta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, radius: parseFloat(cs.borderTopLeftRadius), height: el.getBoundingClientRect().height };
    });
    expect(s.bg).toBe('rgb(17, 17, 16)');
    expect(s.color).toBe('rgb(255, 255, 255)');
    expect(s.radius).toBeGreaterThanOrEqual(s.height / 2);
    expect(s.height).toBeGreaterThanOrEqual(48);
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
    // The owner chose both look photos for the hero, so they also appear in
    // Shop the Look, where their pieces are bought. Nothing else repeats.
    const repeated = editorial.filter((k, i) => editorial.indexOf(k) !== i);
    expect(repeated.filter((k) => !k.startsWith('cut-look-'))).toEqual([]);
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

  test('admin edits in this browser reach new arrivals and panels; the hero keeps its pictures', async ({ page }) => {
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
    // The hero is editorial: its character and photos do not follow the catalogue.
    await expect(page.locator('[data-slide]')).toHaveCount(N);
    await expect(page.locator('[data-slide-id="brand"] .home-character img')).toHaveAttribute('src', /cut-look-02-/);
    await expect(page.locator('[data-hero] img[src*="navy-pique-polo"]')).toHaveCount(0);
    await expect(page.locator('.home-new .card')).toHaveCount(newCount(products));
    await expect(page.locator('.home-new .card[data-slug="tortoiseshell-round-sunglasses"]')).toHaveCount(0);
    await expect(page.locator('.home-new .card[data-slug="cream-knit-polo"] .card-price')).toHaveText('$54');
    await expect(page.locator('.home-look-list[data-look="look-01"] .home-item')).toHaveCount(2);
    await expect(page.locator('.home-look-list[data-look="look-01"]')).toContainText('$52');
  });
});
