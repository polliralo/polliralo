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
    page.on('requestfailed', (req) => {
      // Browsers routinely cancel media range requests; that is not a failure.
      const aborted = req.failure()?.errorText.includes('ERR_ABORTED');
      if (!(aborted && req.resourceType() === 'media')) problems.push(`failed: ${req.url()}`);
    });
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

  test('every image has alt text and loads', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: img.currentSrc,
        alt: img.getAttribute('alt'),
        loaded: img.complete && img.naturalWidth > 0,
      })),
    );
    expect(images.length).toBe(11);
    for (const image of images) {
      expect(image.alt?.trim().length, `alt text for ${image.src}`).toBeGreaterThan(10);
      expect(image.loaded, `image loaded: ${image.src}`).toBe(true);
    }
  });

  test('serves modern image formats', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    const sources = await page.locator('img').evaluateAll((imgs) => imgs.map((img) => img.currentSrc));
    for (const src of sources) expect(src, src).toMatch(/\.(avif|webp)$/);
  });

  test('picks image files big enough for how large they are shown', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const setups = mobile
      ? [{ width: 360, height: 740, dpr: 2 }, { width: 390, height: 844, dpr: 3 }]
      : [{ width: 1280, height: 800, dpr: 1 }, { width: 1440, height: 900, dpr: 2 }, { width: 1920, height: 1080, dpr: 1 }];
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
          return { file, natural: chosen, shown: Math.round(shown), largest };
        }), dpr);
      for (const f of found) {
        // Upscaling is only a sizes mistake when a larger file was available.
        if (f.natural < f.largest && f.shown > f.natural * 1.2) problems.push({ at: `${width}x${height}@${dpr}x`, ...f });
      }
      await context.close();
    }
    console.log(problems.map((p) => `${p.at} ${p.file} natural ${p.natural} shown ${p.shown} largest ${p.largest}`).join('\n'));
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

test.describe('layout', () => {
  for (const width of [360, 390, 768, 1024, 1280, 1440, 1920]) {
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
      await page.locator(`.villa-index a[href="#${id}"]`).click();
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

test.describe('hero video', () => {
  test('starts after load, matches the screen shape and can be paused', async ({ page }, testInfo) => {
    await page.goto('/');
    const video = page.locator('[data-hero-video]');
    await expect(video).toHaveClass(/is-playing/, { timeout: 20_000 });
    const src = await video.evaluate((v) => v.currentSrc);
    expect(src).toContain(testInfo.project.name === 'mobile' ? 'hero-portrait' : 'hero-');
    expect(await video.evaluate((v) => v.muted)).toBe(true);

    await page.getByRole('button', { name: 'Pause background video' }).click();
    await expect(page.getByRole('button', { name: 'Play background video' })).toBeVisible();
    expect(await video.evaluate((v) => v.paused)).toBe(true);
    await page.getByRole('button', { name: 'Play background video' }).click();
    await expect.poll(() => video.evaluate((v) => v.paused)).toBe(false);
  });

  test('with reduced motion, no video is downloaded and all content shows', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const videoRequests = [];
    page.on('request', (req) => req.url().endsWith('.mp4') && videoRequests.push(req.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    expect(videoRequests).toEqual([]);
    await expect(page.locator('[data-video-toggle]')).toBeHidden();
    const hidden = await page.locator('[data-reveal]').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
    await context.close();
  });

  test('the page stays complete when the video cannot load', async ({ page }) => {
    await page.route('**/*.mp4', (route) => route.abort());
    await page.goto('/');
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-hero-video]')).not.toHaveClass(/is-playing/);
    await expect(page.locator('[data-video-toggle]')).toBeHidden();
    await expect(page.locator('.hero__poster')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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
    await page.keyboard.press('Tab'); // wordmark
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
async function backgroundContrast(page, selector, textRgb, mode) {
  // The area the words actually cover: the union of their line boxes.
  const box = await page.locator(selector).evaluate((el) => {
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
  const background = mode === 'light-text' ? values[Math.floor(values.length * 0.99)] : values[Math.floor(values.length * 0.01)];
  const text = lum(textRgb);
  const [hi, lo] = text > background ? [text, background] : [background, text];
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('legibility over photography', () => {
  const HERO_SIZES = {
    desktop: [[1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]],
    mobile: [[360, 740], [375, 667], [390, 844], [412, 915], [768, 1024]],
  };
  test('hero words stay readable over the image', async ({ browser }, testInfo) => {
    const ivory = [251, 248, 242];
    // Large headline text needs 3:1, smaller text 4.5:1 (WCAG AA).
    const targets = { '.hero__title': 3, '.hero__lede': 4.5, '.hero__eyebrow': 4.5 };
    const results = [];
    for (const [width, height] of HERO_SIZES[testInfo.project.name]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (const [selector, target] of Object.entries(targets)) {
        const ratio = await backgroundContrast(page, selector, ivory, 'light-text');
        results.push({ at: `${width}x${height}`, selector, ratio: Number(ratio.toFixed(2)), target });
      }
      await context.close();
    }
    console.log(results.map((r) => `${r.at} ${r.selector} ${r.ratio}`).join('\n'));
    expect(results.filter((r) => r.ratio < r.target)).toEqual([]);
  });

  test('hero words stay readable on every part of the moving video', async ({ browser }, testInfo) => {
    const sizes = testInfo.project.name === 'mobile' ? [[390, 844], [360, 740]] : [[1440, 900], [1920, 1080]];
    const ivory = [251, 248, 242];
    const targets = { '.hero__title': 3, '.hero__lede': 4.5, '.hero__eyebrow': 4.5 };
    const results = [];
    for (const [width, height] of sizes) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      await page.goto('/');
      const video = page.locator('[data-hero-video]');
      await expect(video).toHaveClass(/is-playing/, { timeout: 20_000 });
      await expect.poll(() => video.evaluate((v) => getComputedStyle(v).opacity)).toBe('1');
      await page.getByRole('button', { name: 'Pause background video' }).click();
      // Sample across the whole 16-second loop.
      for (const time of [0.5, 3, 5.5, 8, 10.5, 13, 15.5]) {
        await video.evaluate(
          (v, t) => new Promise((resolve) => {
            v.addEventListener('seeked', resolve, { once: true });
            v.currentTime = t;
          }),
          time,
        );
        for (const [selector, target] of Object.entries(targets)) {
          const ratio = await backgroundContrast(page, selector, ivory, 'light-text');
          results.push({ at: `${width}x${height} @${time}s`, selector, ratio: Number(ratio.toFixed(2)), target });
        }
      }
      await context.close();
    }
    const worst = Object.keys(targets).map((selector) =>
      results.filter((r) => r.selector === selector).sort((a, b) => a.ratio - b.ratio)[0],
    );
    console.log(worst.map((r) => `worst ${r.selector} ${r.ratio} at ${r.at}`).join('\n'));
    expect(results.filter((r) => r.ratio < r.target)).toEqual([]);
  });

  test('lagoon and arrival words stay readable over the sky', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const sizes = mobile ? [[360, 740], [390, 844], [768, 1024]] : [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
    // The lagoon words sit over the photo only on wide screens.
    const checks = mobile ? ['.arrival__lede', '.arrival__title'] : ['.lagoon__panel p:not(.eyebrow)', '.lagoon__panel h2', '.arrival__lede', '.arrival__title'];
    const ink = [16, 42, 51];
    const results = [];
    for (const [width, height] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await scrollThrough(page);
      for (const selector of checks) {
        await page.locator(selector).evaluate((el) => el.closest('section').scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(150);
        const ratio = await backgroundContrast(page, selector, ink, 'dark-text');
        const target = selector.includes('h2') || selector.includes('title') ? 3 : 4.5;
        results.push({ at: `${width}x${height}`, selector, ratio: Number(ratio.toFixed(2)), target });
      }
      await context.close();
    }
    console.log(results.map((r) => `${r.at} ${r.selector} ${r.ratio}`).join('\n'));
    expect(results.filter((r) => r.ratio < r.target)).toEqual([]);
  });
});

test.describe('island map', () => {
  test('pointing at a legend entry highlights its marker', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    await page.locator('#island').scrollIntoViewIfNeeded();
    await page.locator('.legend__item[data-point="3"]').hover();
    await expect(page.locator('.marker[data-point="3"]')).toHaveClass(/is-active/);
    await page.mouse.move(0, 0);
    await expect(page.locator('.marker[data-point="3"]')).not.toHaveClass(/is-active/);
  });
});
