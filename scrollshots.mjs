// node scrollshots.mjs <w> <h> <selector> <prefix> <offsets...>  (screens while scrolling through a section, motion on)
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/polliralo/package.json')('@playwright/test');
const [w, h, sel, prefix, ...offsets] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, isMobile: +w < 800, hasTouch: +w < 800 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); } });
await page.waitForLoadState('networkidle');
const top = await page.locator(sel).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
for (const [i, off] of offsets.entries()) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + Number(off));
  await page.waitForTimeout(1600);
  const active = await page.evaluate(() => document.querySelector('[data-island]')?.dataset.active);
  await page.screenshot({ path: `${prefix}-${i}.png` });
  console.log(i, off, 'active', active);
}
await browser.close();
