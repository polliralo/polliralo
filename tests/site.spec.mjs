// Browser checks for the Nivara Coast homepage. Run with: npm test
import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const onlyDesktop = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'desktop only');
const onlyMobile = (testInfo) => test.skip(testInfo.project.name !== 'mobile', 'mobile only');

// Scroll the whole page so lazy images load and scroll reveals run.
async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.7));
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(80);
  }
}

test.describe('page', () => {
  test('loads with no console errors and no failed requests', async ({ page }) => {
    const problems = [];
    page.on('console', (msg) => msg.type() === 'error' && problems.push(`console: ${msg.text()}`));
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('response', (res) => res.status() >= 400 && problems.push(`${res.status()} ${res.url()}`));
    page.on('requestfailed', (req) => problems.push(`failed: ${req.url()}`));
    await page.goto('/');
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });

  test('has one h1 and no skipped heading levels', async ({ page }) => {
    await page.goto('/');
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) =>
      els.map((el) => Number(el.tagName[1])),
    );
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1], `heading ${i} jumps a level`).toBeLessThanOrEqual(1);
    }
  });

  test('every photo has alt text and loads; decorative thumbnails are marked as such', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: img.currentSrc,
        alt: img.getAttribute('alt'),
        thumb: Boolean(img.closest('.villa-card__thumb')),
        loaded: img.complete && img.naturalWidth > 0,
        visible: getComputedStyle(img).opacity === '1',
      })),
    );
    expect(images.filter((i) => !i.thumb)).toHaveLength(11);
    expect(images.filter((i) => i.thumb)).toHaveLength(3);
    for (const image of images) {
      // Thumbnails sit inside links that already name the villa.
      if (image.thumb) expect(image.alt, `empty alt for ${image.src}`).toBe('');
      else expect(image.alt?.trim().length, `alt text for ${image.src}`).toBeGreaterThan(10);
      expect(image.loaded, `image loaded: ${image.src}`).toBe(true);
      expect(image.visible, `image faded in: ${image.src}`).toBe(true);
    }
  });

  test('serves modern image formats', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    const sources = await page.locator('img').evaluateAll((imgs) => imgs.map((img) => img.currentSrc));
    for (const src of sources) expect(src, src).toMatch(/\.(avif|webp)$/);
  });

  test('picks the image file that fits how large each photo is shown', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const setups = mobile
      ? [{ width: 360, height: 740, dpr: 2 }, { width: 390, height: 844, dpr: 3 }, { width: 412, height: 915, dpr: 2.625 }, { width: 768, height: 1024, dpr: 2 }]
      : [
        { width: 1024, height: 768, dpr: 1 }, { width: 1280, height: 800, dpr: 1 }, { width: 1366, height: 768, dpr: 1 },
        { width: 1440, height: 900, dpr: 2 }, { width: 1920, height: 1080, dpr: 1 }, { width: 2560, height: 1440, dpr: 1 },
      ];
    const problems = [];
    for (const { width, height, dpr } of setups) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await scrollThrough(page);
      await page.waitForLoadState('networkidle');
      const found = await page.locator('picture img').evaluateAll((imgs, ratio) =>
        imgs.map((img) => {
          const box = img.getBoundingClientRect();
          const aspect = img.naturalWidth / img.naturalHeight;
          // object-fit: cover draws the image at least as wide as this:
          const shown = Math.max(box.width, box.height * aspect) * ratio;
          const file = img.currentSrc.split('/').pop();
          const source = [...img.parentElement.querySelectorAll('source')].find((s) => s.srcset.includes(file));
          // naturalWidth is scaled by the chosen density, so read real widths from srcset.
          const candidates = (source?.srcset ?? '')
            .split(',')
            .map((part) => part.trim().split(/\s+/))
            .map(([url, w]) => ({ url, w: Number((w ?? '').replace('w', '')) }))
            .filter((c) => c.w);
          const chosen = candidates.find((c) => c.url.endsWith(file))?.w ?? img.naturalWidth;
          const largest = candidates.length ? Math.max(...candidates.map((c) => c.w)) : chosen;
          // A smaller file that would still have been sharp enough (2% rounding allowed).
          const smaller = candidates.filter((c) => c.w >= shown * 1.02 && c.w < chosen).map((c) => c.w);
          return { file, natural: chosen, shown: Math.round(shown), largest, smaller: smaller.join(' ') };
        }), dpr);
      for (const f of found) {
        // Too small: upscaling is only a sizes mistake when a larger file was available.
        if (f.natural < f.largest && f.shown > f.natural * 1.2) problems.push({ at: `${width}x${height}@${dpr}x`, issue: 'too small', ...f });
        // Too big: a smaller file would have looked the same and loaded faster.
        if (f.smaller) problems.push({ at: `${width}x${height}@${dpr}x`, issue: 'too big', ...f });
      }
      await context.close();
    }
    console.log(problems.map((p) => `${p.at} ${p.issue} ${p.file} natural ${p.natural} shown ${p.shown} largest ${p.largest}`).join('\n'));
    expect(problems).toEqual([]);
  });

  test('has search and sharing metadata and states that the brand is fictional', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nivara Coast/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', 'favicon.svg');
    await expect(page.locator('footer')).toContainText('fictional concept');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});

test.describe('content and assets', () => {
  test('loads the brand fonts', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => ({
      display: document.fonts.check('500 40px "Cormorant Garamond"'),
      italic: document.fonts.check('italic 500 40px "Cormorant Garamond"'),
      text: document.fonts.check('400 16px "Manrope"'),
    }));
    expect(loaded).toEqual({ display: true, italic: true, text: true });
  });

  test('copy uses no long dashes', async ({ page }) => {
    await page.goto('/');
    const text = await page.evaluate(() => [
      document.body.innerText,
      document.title,
      ...[...document.querySelectorAll('meta[content], [alt]')].map((el) => el.getAttribute('content') ?? el.getAttribute('alt')),
    ].join('\n'));
    expect(text).not.toMatch(/[\u2013\u2014]/);
  });

  test('the hero is a still photograph, with no video on the page', async ({ page }) => {
    const videoRequests = [];
    page.on('request', (req) => /\.(mp4|webm|mov)$/.test(req.url()) && videoRequests.push(req.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('video')).toHaveCount(0);
    expect(videoRequests).toEqual([]);
  });

  test('a tall window at desktop width keeps the landscape hero', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    const page = await browser.newPage({ viewport: { width: 980, height: 1844 } });
    await page.goto('/');
    const hero = await page.locator('.hero').evaluate((el) => el.getBoundingClientRect());
    // Landscape shaped, so the wide photo is not stretched into a portrait crop.
    expect(hero.width / hero.height).toBeGreaterThan(1.3);
    const src = await page.locator('.hero__image').evaluate((img) => img.currentSrc);
    expect(src).not.toContain('hero-phone');
    await page.close();
  });

  test('portrait phones get the portrait hero photo, other screens the wide one', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    const cases = [
      { width: 360, height: 740, phone: true },
      { width: 390, height: 844, phone: true },
      { width: 412, height: 915, phone: true },
      { width: 768, height: 1024, phone: false }, // portrait tablet
      { width: 844, height: 390, phone: false }, // phone held sideways
      { width: 1440, height: 900, phone: false },
    ];
    for (const { width, height, phone } of cases) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto('/');
      const src = await page.locator('.hero__image').evaluate((img) => img.currentSrc);
      expect(src.includes('hero-phone'), `${width}x${height}: ${src}`).toBe(phone);
      await page.close();
    }
  });
});

test.describe('layout', () => {
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
    test(`no sideways scrolling at ${width}px`, async ({ browser }, testInfo) => {
      onlyDesktop(testInfo);
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto('/');
      await scrollThrough(page);
      const size = await page.evaluate(() => ({
        page: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
        viewport: document.documentElement.clientWidth,
      }));
      expect(size.page).toBeLessThanOrEqual(size.viewport);
      await page.close();
    });
  }

  test('touch targets are at least 44px tall on phones', async ({ page }, testInfo) => {
    onlyMobile(testInfo);
    await page.goto('/');
    const small = await page.locator('a, button').evaluateAll((els) =>
      els
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ text: el.textContent.trim(), height: el.getBoundingClientRect().height }))
        .filter((item) => item.height < 44),
    );
    expect(small).toEqual([]);
  });
});

test.describe('navigation', () => {
  test('every in-page link points to a real section', async ({ page }) => {
    await page.goto('/');
    const missing = await page.locator('a[href^="#"]').evaluateAll((links) =>
      links.map((a) => a.getAttribute('href').slice(1)).filter((id) => !document.getElementById(id)),
    );
    expect(missing).toEqual([]);
  });

  test('hero buttons lead to the villas and to the island', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero');
    await hero.getByRole('link', { name: 'Explore the Villas' }).click();
    await expect(page).toHaveURL(/#villas$/);
    await expect
      .poll(() => page.locator('#villas').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(80);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await hero.getByRole('link', { name: 'Discover the Island' }).click();
    await expect(page).toHaveURL(/#island$/);
    await expect
      .poll(() => page.locator('#island').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(80);
  });

  test('villa links land each villa just below the header', async ({ page }) => {
    await page.goto('/');
    for (const id of ['overwater-villa', 'overwater-pool-villa', 'beach-pool-villa']) {
      await page.locator(`.villa-card__link[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      // Wait for the smooth scroll to finish, then check it stopped below the header.
      await expect
        .poll(() => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top)))
        .toBeLessThanOrEqual(120);
      const top = await page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
      expect(top).toBeGreaterThanOrEqual(72);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
  });

  test('main navigation marks the section on screen', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    await page.locator('#dining').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('dining').scrollIntoView({ behavior: 'instant' }));
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Dining' })).toHaveAttribute('aria-current', 'true');
    await expect(nav.locator('[aria-current]')).toHaveCount(1);
  });

  test('header turns solid after the hero', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-header]');
    await expect(header).not.toHaveClass(/is-solid/);
    await page.evaluate(() => document.getElementById('intro').scrollIntoView({ behavior: 'instant' }));
    await expect(header).toHaveClass(/is-solid/);
  });

  test('the header button appears only once the hero button has scrolled away', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    const cta = page.locator('.header-cta');
    await expect(cta).toBeHidden();
    await page.evaluate(() => document.getElementById('intro').scrollIntoView({ behavior: 'instant' }));
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/#villas$/);
  });
});

test.describe('mobile menu', () => {
  test('opens, keeps focus inside, closes with Escape and returns focus', async ({ page }, testInfo) => {
    onlyMobile(testInfo);
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    await toggle.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('#menu')))).toBe(true);

    // Tabbing through the menu never reaches the page behind it. (After the
    // last item, browsers hand focus to their own controls, shown here as body.)
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const where = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return 'browser';
        return el.closest('#menu') ? 'menu' : el.outerHTML.slice(0, 60);
      });
      expect(['menu', 'browser']).toContain(where);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('a menu link closes the menu and scrolls to its section', async ({ page }, testInfo) => {
    onlyMobile(testInfo);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Dining' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    await expect(page).toHaveURL(/#dining$/);
    await expect
      .poll(() => page.locator('#dining').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(80);
  });
});

test.describe('robustness', () => {
  test('printing shows every section', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    const hidden = await page.locator('[data-reveal]').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
    await expect(page.locator('[data-header]')).toHaveCSS('position', 'absolute');
  });

  test('without JavaScript the navigation is visible and the header scrolls away', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-header]')).toHaveCSS('position', 'absolute');
    await expect(page.locator('.site-nav')).toBeVisible();
    await expect(page.locator('[data-menu-open]')).toBeHidden();
    await expect(page.locator('#villas')).toBeVisible();
    await expect(page.locator('.hero__image')).toHaveCSS('opacity', '1');
    await expect(page.locator('.villa__main img').first()).toHaveCSS('opacity', '1');
    await context.close();
  });

  test('touch tablets get full-size header targets', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    // Portrait and landscape tablets: the menu button on smaller ones, the
    // full navigation on larger ones.
    for (const viewport of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 1366, height: 1024 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      await page.goto('/');
      const targets = await page.locator('.site-header a, .site-header button').evaluateAll((els) =>
        els
          .filter((el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden')
          .map((el) => ({ text: el.textContent.trim(), height: Math.round(el.getBoundingClientRect().height) })),
      );
      expect(targets.length, `${viewport.width}px`).toBeGreaterThan(1);
      expect(targets.filter((t) => t.height < 44), `${viewport.width}px`).toEqual([]);
      await context.close();
    }
  });
});

test.describe('motion', () => {
  test('with reduced motion, all content shows at once', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hidden = await page.locator('[data-reveal]').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
    await context.close();
  });
});

test.describe('accessibility', () => {
  test('skip link is the first stop and moves focus to the content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('every link and button has a name', async ({ page }) => {
    await page.goto('/');
    const unnamed = await page.locator('a, button').evaluateAll((els) =>
      els
        .filter((el) => !(el.textContent.trim() || el.getAttribute('aria-label')))
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(unnamed).toEqual([]);
  });

  test('keyboard focus is clearly visible', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // brand
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });
});

// Text over photography: measure the background actually behind the words
// (with the shading applied), the way a visitor sees it.
async function textColour(page, selector) {
  const value = await page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
  return value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
}

async function backgroundContrast(page, selector, textRgb) {
  // The area the words actually cover: the union of their line boxes.
  const box = await page.locator(selector).first().evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  // Hide the words (and any child elements) with no transition, then sample.
  const style = await page.addStyleTag({
    content: `${selector}, ${selector} * { visibility: hidden !important; transition: none !important; }`,
  });
  const png = await page.screenshot({ clip: box });
  await style.evaluate((el) => el.remove());
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const values = [];
  for (let i = 0; i < data.length; i += info.channels) values.push(lum([data[i], data[i + 1], data[i + 2]]));
  values.sort((a, b) => a - b);
  // Ignore the most extreme 1% of pixels (single specks of glare or shadow).
  const text = lum(textRgb);
  // Light text is judged against the lightest background pixels, dark text
  // against the darkest.
  const background = text > 0.4 ? values[Math.floor(values.length * 0.99)] : values[Math.floor(values.length * 0.01)];
  const [hi, lo] = text > background ? [text, background] : [background, text];
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('legibility over photography', () => {
  // Full screens plus typical browser-window sizes (screen height minus toolbars).
  const HERO_SIZES = {
    // 980x1844 is a phone browser asking for the desktop site.
    desktop: [[980, 1844], [1024, 768], [1280, 650], [1280, 800], [1366, 657], [1440, 790], [1440, 900], [1536, 730], [1920, 970], [1920, 1080], [2560, 1440]],
    mobile: [[334, 720], [360, 740], [375, 667], [390, 844], [412, 915], [768, 1024]],
  };
  // Whichever of these is on screen at a given width is measured.
  const HEADER_TEXT = ['.site-header .brand__name', '.site-nav li:first-child a', '.site-nav li:last-child a', '.site-header .menu-button span'];
  test('hero words stay readable over the image', async ({ browser }, testInfo) => {
    // Large headline text needs 3:1, smaller text 4.5:1 (WCAG AA). The
    // headline is measured without its italic word, which is checked alone.
    const targets = {
      '.hero__title': 3,
      '.hero__title em': 3,
      '.hero__lede': 4.5,
      '.hero__eyebrow': 4.5,
      '.hero .text-link': 4.5,
    };
    for (const selector of HEADER_TEXT) targets[selector] = 4.5;
    const results = [];
    for (const [width, height] of HERO_SIZES[testInfo.project.name]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (const [selector, target] of Object.entries(targets)) {
        const shown = await page.locator(selector).first().evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.width > 2 && box.height > 2 && getComputedStyle(el).visibility !== 'hidden';
        }).catch(() => false);
        if (!shown) continue;
        const ratio = await backgroundContrast(page, selector, await textColour(page, selector));
        results.push({ at: `${width}x${height}`, selector, ratio: Number(ratio.toFixed(2)), target });
      }
      await context.close();
    }
    console.log(results.map((r) => `${r.at} ${r.selector} ${r.ratio}`).join('\n'));
    expect(results.filter((r) => r.ratio < r.target)).toEqual([]);
  });

  test('arrival words stay readable over the photo', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const sizes = mobile
      ? [[360, 740], [390, 844], [768, 1024]]
      : [[1024, 768], [1280, 650], [1280, 800], [1366, 657], [1440, 790], [1440, 900], [1536, 730], [1920, 970], [1920, 1080]];
    const checks = { '.arrival__title': 3, '.arrival__title em': 3, '.arrival__lede': 4.5, '.arrival .eyebrow': 4.5 };
    const results = [];
    for (const [width, height] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await scrollThrough(page);
      await page.evaluate(() => document.getElementById('arrival').scrollIntoView({ behavior: 'instant' }));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(150);
      for (const [selector, target] of Object.entries(checks)) {
        const ratio = await backgroundContrast(page, selector, await textColour(page, selector));
        results.push({ at: `${width}x${height}`, selector, ratio: Number(ratio.toFixed(2)), target });
      }
      await context.close();
    }
    console.log(results.map((r) => `${r.at} ${r.selector} ${r.ratio}`).join('\n'));
    expect(results.filter((r) => r.ratio < r.target)).toEqual([]);
  });
});

test.describe('island guide', () => {
  test('scrolling through the places moves the light across the photo', async ({ page }) => {
    await page.goto('/');
    const guide = page.locator('[data-island]');
    await expect(guide).toHaveClass(/is-enhanced/);
    await expect(guide).toHaveAttribute('data-active', '1');
    // Bring the fifth place up to the reading line.
    await page.locator('.place[data-point="5"]').evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - window.innerHeight * 0.45, behavior: 'instant' });
    });
    await expect(guide).toHaveAttribute('data-active', '5');
    await expect(page.locator('.place[data-point="5"]')).toHaveClass(/is-active/);
    // The photo stays in view while the list scrolls.
    const photoTop = await page.locator('.island__photo').evaluate((el) => el.getBoundingClientRect().top);
    expect(photoTop).toBeGreaterThanOrEqual(0);
    await expect(page.locator('.island__label')).toHaveText('The beach');
  });

  test('every place can be read while scrolling, even on short screens', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    // Phones held sideways, a short laptop window, an iPad in landscape and a phone.
    for (const viewport of [{ width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      await page.goto('/');
      const unread = await page.evaluate(async () => {
        // Readable means on screen and not covered by the header or the photo.
        const readable = (el) => {
          const box = el.getBoundingClientRect();
          if (box.top < 0 || box.bottom > window.innerHeight) return false;
          const hit = document.elementFromPoint(box.left + Math.min(24, box.width / 2), box.top + box.height / 2);
          return Boolean(hit && el.contains(hit));
        };
        const places = [...document.querySelectorAll('.place')];
        const seen = new Set();
        const guide = document.querySelector('[data-island]').getBoundingClientRect();
        const start = guide.top + window.scrollY - window.innerHeight;
        const end = guide.bottom + window.scrollY;
        for (let y = start; y <= end; y += 30) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((resolve) => requestAnimationFrame(() => resolve()));
          places.forEach((place, i) => {
            if (readable(place.querySelector('.place__name')) && readable(place.querySelector('.place__text'))) seen.add(i + 1);
          });
        }
        return places.map((_, i) => i + 1).filter((n) => !seen.has(n));
      });
      expect(unread, `${viewport.width}x${viewport.height}`).toEqual([]);
      await page.close();
    }
  });

  test('pointing at a place lights it straight away', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    await page.locator('#island').scrollIntoViewIfNeeded();
    await page.locator('.place[data-point="3"]').hover();
    await expect(page.locator('[data-island]')).toHaveAttribute('data-active', '3');
    const ring = await page.locator('.island__photo').evaluate((el) => ({
      x: el.style.getPropertyValue('--spot-x'),
      y: el.style.getPropertyValue('--spot-y'),
    }));
    expect(ring).toEqual({ x: '57%', y: '47.5%' });
  });

  test('without the guide script the places and photo still show', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.place')).toHaveCount(6);
    await expect(page.locator('.island__ring')).toBeHidden();
    await context.close();
  });
});
