// Browser checks for the CoolCare homepage. Run with: npm test
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import config from '../site.config.mjs';
import { OUTPUT, render } from '../scripts/build.mjs';

const onlyDesktop = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'desktop only');
const onlyMobile = (testInfo) => test.skip(testInfo.project.name !== 'mobile', 'mobile only');

// Scroll the whole page so lazy photos load and soft reveals run.
async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.7));
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(80);
  }
}

// Every visible piece of copy a visitor or a search engine reads.
const allCopy = (page) =>
  page.evaluate(() => [
    document.body.innerText,
    document.title,
    ...[...document.querySelectorAll('meta[content], [alt], [aria-label]')].map(
      (el) => el.getAttribute('content') ?? el.getAttribute('alt') ?? el.getAttribute('aria-label'),
    ),
  ].join('\n'));

test.describe('build', () => {
  test('site/index.html matches the components, copy and config (run npm run build if not)', () => {
    expect(readFileSync(OUTPUT, 'utf8') === render(), 'site/index.html is out of date: run npm run build').toBe(true);
  });
});

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

  test('says what CoolCare does, which appliances, and how to get in touch, in the first screen', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero');
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText('AC & Refrigerator Service You Can Rely On');
    await expect(hero.locator('.eyebrow')).toHaveText('AC & Refrigerator Service');
    await expect(hero.locator('.hero__text')).toHaveText(
      'Professional AC servicing, repairs and installation, plus refrigerator diagnostics for homes and businesses.',
    );
    for (const name of ['Call for Service', 'WhatsApp Us']) {
      const button = hero.getByRole('link', { name, exact: true });
      await expect(button).toBeInViewport({ ratio: 1 });
    }
  });

  test('the call buttons stay on the first screen on small phones too', async ({ browser }, testInfo) => {
    onlyMobile(testInfo);
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 375, height: 667 }]) {
      const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto('/');
      const box = await page.locator('.hero').getByRole('link', { name: 'Call for Service' }).boundingBox();
      expect(box.y + box.height, `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(viewport.height);
      await context.close();
    }
  });

  test('every photo has alt text, loads and fades in', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(700);
    const images = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: img.currentSrc,
        alt: img.getAttribute('alt'),
        loaded: img.complete && img.naturalWidth > 0,
        visible: getComputedStyle(img).opacity === '1',
      })),
    );
    expect(images).toHaveLength(7);
    for (const image of images) {
      expect(image.alt?.trim().length, `alt text for ${image.src}`).toBeGreaterThan(20);
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

  test('wide screens get the wide hero crop, phones and tablets the closer 4:3 one', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    const cases = [
      { width: 360, height: 740, file: 'hero-mobile' },
      { width: 768, height: 1024, file: 'hero-mobile' },
      { width: 1023, height: 768, file: 'hero-mobile' },
      { width: 1024, height: 768, file: 'hero-desktop' },
      { width: 1440, height: 900, file: 'hero-desktop' },
    ];
    for (const { width, height, file } of cases) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto('/');
      const src = await page.locator('.hero img').evaluate((img) => img.currentSrc);
      expect(src, `${width}x${height}`).toContain(file);
      await page.close();
    }
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
          const file = img.currentSrc.split('/').pop();
          const source = [...img.parentElement.querySelectorAll('source')].find((s) => s.srcset.includes(file));
          // Real widths come from srcset (naturalWidth is scaled by the chosen density).
          const candidates = (source?.srcset ?? '')
            .split(',')
            .map((part) => part.trim().split(/\s+/))
            .map(([url, w]) => ({ url, w: Number((w ?? '').replace('w', '')) }))
            .filter((c) => c.w);
          const chosen = candidates.find((c) => c.url.endsWith(file))?.w ?? img.naturalWidth;
          const intrinsicHeight = chosen * (img.naturalHeight / img.naturalWidth);
          // object-fit: cover draws the photo at least as wide as this:
          const shown = Math.max(box.width, box.height * (chosen / intrinsicHeight)) * ratio;
          const largest = candidates.length ? Math.max(...candidates.map((c) => c.w)) : chosen;
          // A smaller file that would still have been sharp enough (2% rounding allowed).
          const smaller = candidates.filter((c) => c.w >= shown * 1.02 && c.w < chosen).map((c) => c.w);
          return { file, chosen, shown: Math.round(shown), largest, smaller: smaller.join(' ') };
        }), dpr);
      for (const f of found) {
        // Too small: enlarging is only a sizes mistake when a larger file was available.
        if (f.chosen < f.largest && f.shown > f.chosen * 1.2) problems.push({ at: `${width}x${height}@${dpr}x`, issue: 'too small', ...f });
        // Too big: a smaller file would have looked the same and loaded faster.
        if (f.smaller) problems.push({ at: `${width}x${height}@${dpr}x`, issue: 'too big', ...f });
      }
      await context.close();
    }
    expect(problems.map((p) => `${p.at} ${p.issue} ${p.file}: file ${p.chosen}px, shown ${p.shown}px`)).toEqual([]);
  });

  test('has search and sharing metadata, and says the details are placeholders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CoolCare/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', 'favicon.svg');
    if (config.isConcept) {
      await expect(page.locator('footer')).toContainText('placeholders');
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    }
  });

  test('loads the brand font', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('650 40px "Manrope"'))).toBe(true);
  });
});

test.describe('copy', () => {
  test('uses no long dashes and none of the stock filler words', async ({ page }) => {
    await page.goto('/');
    const text = await allCopy(page);
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/\b(leverage|seamless|empower|unlock|robust|actionable|data-driven|solutions?|elevate|delve|testament|landscape|world-class|cutting-edge|best-in-class)\b/i);
  });

  test('makes no invented claims: no ratings, numbers of years or customers, guarantees or availability', async ({ page }) => {
    await page.goto('/');
    const text = await allCopy(page);
    expect(text).not.toMatch(/\b\d+[ \t]*\+?[ \t]*(years?|customers?|clients?|jobs?|technicians?|reviews?)\b/i);
    expect(text).not.toMatch(/\b(24\/7|same[- ]day|guarantee[ds]?|warrant(y|ies)|certified|licensed|award|rated|reviews?|testimonials?|emergency|fastest|cheapest|lowest price|free)\b/i);
    expect(text).not.toMatch(/[★⭐%৳$€£]/);
  });

  test('every call and WhatsApp link uses the numbers in site.config.mjs', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href^="tel:"], a[href*="wa.me"]').evaluateAll((links) => links.map((a) => a.href));
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const href of hrefs) {
      if (href.startsWith('tel:')) expect(href).toBe(`tel:${config.phone}`);
      else expect(href).toMatch(new RegExp(`^https://wa\\.me/${config.whatsapp}\\?text=.+`));
    }
    await expect(page.locator('body')).toContainText(config.phoneDisplay);
    await expect(page.locator('body')).toContainText(config.serviceArea);
  });

  test('each service card opens WhatsApp with that service written into the message', async ({ page }) => {
    await page.goto('/');
    const expected = {
      'AC Cleaning': 'AC cleaning',
      'AC Repair & Diagnostics': 'my AC needs a repair',
      'AC Installation': 'an AC installed',
      'Refrigerator Repair': 'my refrigerator needs a repair',
    };
    const cards = page.locator('.service-card');
    await expect(cards).toHaveCount(4);
    for (const [name, words] of Object.entries(expected)) {
      const link = page.locator('.service-card__link', { hasText: name });
      const message = decodeURIComponent(new URL(await link.getAttribute('href')).searchParams.get('text'));
      expect(message).toContain(words);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('no part of the page claims a request was sent', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('form')).toHaveCount(0);
    const text = await allCopy(page);
    expect(text).not.toMatch(/\b(thank you|request (was )?(sent|received|submitted)|we('ll| will) (call|contact) you)\b/i);
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

  test('nothing pokes out of its column, from 320px to 1920px', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    const problems = [];
    for (const width of [320, 360, 390, 480, 640, 768, 900, 1024, 1180, 1280, 1440, 1920]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const found = await page.evaluate(() => {
        const out = [];
        for (const column of document.querySelectorAll('.container, .site-header__inner, .hero__content, .why__content')) {
          const edge = column.getBoundingClientRect();
          for (const el of column.querySelectorAll('a, p, span, h1, h2, h3, dt, dd, li')) {
            const box = el.getBoundingClientRect();
            if (box.width && (box.right > edge.right + 1 || box.left < edge.left - 1)) {
              out.push(`"${el.textContent.trim().slice(0, 30)}"`);
            }
          }
        }
        return [...new Set(out)];
      });
      problems.push(...found.map((f) => `${width}px: ${f}`));
      await page.close();
    }
    expect(problems).toEqual([]);
  });

  test('no words sit on top of a photo', async ({ browser }, testInfo) => {
    const sizes = testInfo.project.name === 'mobile'
      ? [[320, 640], [360, 740], [390, 844], [768, 1024]]
      : [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
    const problems = [];
    for (const [width, height] of sizes) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const found = await page.evaluate(() => {
        const photos = [...document.querySelectorAll('.media')].map((el) => ({ el, box: el.getBoundingClientRect() }));
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          // The hero's service-area card overlaps the photo's corner, but its words sit on its own white ground.
          if (!node.data.trim() || !parent || parent.closest('.site-header, .menu, .hero__badge') || !parent.offsetParent) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const line of range.getClientRects()) {
            for (const { el, box } of photos) {
              const w = Math.min(line.right, box.right) - Math.max(line.left, box.left);
              const h = Math.min(line.bottom, box.bottom) - Math.max(line.top, box.top);
              if (w > 1 && h > 1) out.push(`"${node.data.trim().slice(0, 30)}" on ${el.className}`);
            }
          }
        }
        return [...new Set(out)];
      });
      problems.push(...found.map((f) => `${width}x${height}: ${f}`));
      await page.close();
    }
    expect(problems).toEqual([]);
  });

  test('the headline keeps its three lines and never breaks a line inside', async ({ browser }, testInfo) => {
    const widths = testInfo.project.name === 'mobile' ? [320, 360, 390, 430, 768] : [1024, 1180, 1280, 1440, 1920, 2560];
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const lines = await page.locator('.hero__line').evaluateAll((spans) =>
        spans.map((span) => {
          const range = document.createRange();
          range.selectNodeContents(span);
          return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
        }),
      );
      expect(lines, `${width}px`).toEqual([1, 1, 1]);
      await page.close();
    }
  });

  test('service photos in a row share one height on wide screens', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    const heights = await page.locator('.service-card__media').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
    expect(heights[0]).toBe(heights[1]);
    expect(heights[2]).toBe(heights[3]);
    const widths = await page.locator('.service-card__media').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    // Wide and narrow cards alternate, so no two neighbours match.
    expect(widths[0]).toBeGreaterThan(widths[1] * 1.2);
    expect(widths[3]).toBeGreaterThan(widths[2] * 1.2);
  });

  test('touch targets are at least 44px tall on phones', async ({ page }, testInfo) => {
    onlyMobile(testInfo);
    await page.goto('/');
    // Links inside a sentence are exempt (WCAG 2.5.8), like the phone number in
    // the hero note. A service card's link covers the whole card (checked below).
    const small = await page.locator('a, button').evaluateAll((els) =>
      els
        .filter((el) => el.offsetParent !== null && !el.closest('p, dd') && !el.matches('.service-card__link'))
        .map((el) => ({ text: el.textContent.trim(), height: el.getBoundingClientRect().height }))
        .filter((item) => item.height < 44),
    );
    expect(small).toEqual([]);
  });

  test('text has enough contrast with what is behind it', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const failures = await page.evaluate(() => {
      const parse = (value) => {
        const [r, g, b, a = 1] = value.match(/[\d.]+/g).map(Number);
        return { r, g, b, a };
      };
      const channel = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const lum = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      const blend = (top, bottom) => ({
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
      });
      // The first solid background behind an element (no text sits on photos).
      const backgroundOf = (el) => {
        const layers = [];
        for (let node = el; node; node = node.parentElement) {
          const bg = parse(getComputedStyle(node).backgroundColor);
          if (bg.a > 0) layers.push(bg);
          if (bg.a === 1) break;
        }
        return layers.reverse().reduce((acc, layer) => blend(layer, acc), { r: 255, g: 255, b: 255, a: 1 });
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        if (!walker.currentNode.data.trim() || !el || !el.offsetParent || el.closest('.visually-hidden, .skip-link, dialog')) continue;
        const style = getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        const weight = Number(style.fontWeight);
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const ratio = (() => {
          const fg = blend(parse(style.color), backgroundOf(el));
          const [hi, lo] = [lum(fg), lum(backgroundOf(el))].sort((a, b) => b - a);
          return (hi + 0.05) / (lo + 0.05);
        })();
        if (ratio < (large ? 3 : 4.5)) out.push(`${ratio.toFixed(2)} "${walker.currentNode.data.trim().slice(0, 40)}"`);
      }
      return [...new Set(out)];
    });
    expect(failures).toEqual([]);
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

  test('header links land each section just below the header', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const [name, id] of [['Services', 'services'], ['Why CoolCare', 'why'], ['How It Works', 'how-it-works'], ['About', 'about']]) {
      await nav.getByRole('link', { name }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect
        .poll(() => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top)))
        .toBeLessThanOrEqual(110);
      const top = await page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
      const header = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
      expect(top).toBeGreaterThanOrEqual(header - 1);
    }
  });

  test('main navigation marks the section on screen', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const [id, name] of [['why', 'Why CoolCare'], ['about', 'About']]) {
      await page.evaluate((target) => document.getElementById(target).scrollIntoView({ behavior: 'instant' }), id);
      await expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'true');
      await expect(nav.locator('[aria-current]')).toHaveCount(1);
    }
  });

  test('the header shows a hairline once the page scrolls', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-header]');
    await expect(header).not.toHaveClass(/is-scrolled/);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-scrolled/);
    // Still in reach after scrolling: the header sticks, with the call button.
    await expect(header).toBeInViewport();
    await expect(header.getByRole('link', { name: /Call/ })).toBeVisible();
  });

  test('the whole service card is clickable', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('#service-ac-installation');
    await card.scrollIntoViewIfNeeded();
    const hit = await card.locator('.service-card__media').evaluate((media) => {
      const box = media.getBoundingClientRect();
      const el = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return el?.closest('a')?.className ?? null;
    });
    expect(hit).toBe('service-card__link');
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
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'How It Works' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect
      .poll(() => page.locator('#how-it-works').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(90);
  });

  test('the menu offers both ways to get in touch', async ({ page }, testInfo) => {
    onlyMobile(testInfo);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog.getByRole('link', { name: 'Call for Service' })).toHaveAttribute('href', `tel:${config.phone}`);
    await expect(dialog.getByRole('link', { name: 'WhatsApp Us' })).toHaveAttribute('href', /wa\.me/);
  });
});

test.describe('robustness', () => {
  test('printing shows every section', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    const hidden = await page.locator('[data-reveal], .media__img').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
    await expect(page.locator('[data-header]')).toHaveCSS('position', 'static');
  });

  test('without JavaScript the navigation, words and photos all show', async ({ browser }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.site-nav')).toBeVisible();
    await expect(page.locator('[data-menu-open]')).toBeHidden();
    await expect(page.locator('#services')).toBeVisible();
    await expect(page.locator('.hero img')).toHaveCSS('opacity', '1');
    await expect(page.locator('.service-card img').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1');
    await context.close();
  });

  test('touch tablets get full-size header targets', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 1366, height: 1024 }]) {
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

  test('the header fits on one row at every width', async ({ browser }, testInfo) => {
    onlyDesktop(testInfo);
    for (const width of [320, 360, 390, 768, 1024, 1100, 1280, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.goto('/');
      const tops = await page.locator('.site-header__inner > *').evaluateAll((els) =>
        els.filter((el) => el.offsetParent !== null).map((el) => {
          const box = el.getBoundingClientRect();
          return Math.round(box.top + box.height / 2);
        }),
      );
      expect(new Set(tops).size, `${width}px: ${tops}`).toBe(1);
      const header = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().height);
      expect(header, `${width}px`).toBeLessThanOrEqual(80);
      await page.close();
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

  test('content eases in as it is reached, and everything has arrived by the end', async ({ page }) => {
    await page.goto('/');
    const lastStep = page.locator('.step').last();
    await expect(lastStep).toHaveCSS('opacity', '0');
    await scrollThrough(page);
    await page.waitForTimeout(1200);
    const hidden = await page.locator('[data-reveal]').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
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

  test('links that open WhatsApp say so in their name', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('a[href*="wa.me"]').evaluateAll((links) => links.map((a) => a.textContent.trim()));
    for (const name of names) expect(name).toMatch(/WhatsApp/);
  });

  test('keyboard focus is clearly visible, including on whole service cards', async ({ page }, testInfo) => {
    onlyDesktop(testInfo);
    await page.goto('/');
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // logo
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);

    await page.locator('.service-card__link').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const card = await page.locator('.service-card').first().evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(card.style).toBe('solid');
    expect(card.width).toBeGreaterThanOrEqual(2);
  });

  test('the list structure is announced', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.service-grid > li')).toHaveCount(4);
    await expect(page.locator('ol.steps > li')).toHaveCount(3);
    await expect(page.locator('.principles > li')).toHaveCount(4);
  });
});
