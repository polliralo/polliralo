// Captures full-page screenshots at common screen sizes for visual review.
// Start the preview server first (npm start), then:
//
//   node scripts/screenshots.mjs [baseUrl] [outDir]
//
// Screenshots use reduced motion so every section is captured in its final,
// fully revealed state.

import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4173/';
const outDir = process.argv[3] ?? '.qa/screens';

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 740, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-1920', width: 1920, height: 1080 },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(vp.mobile),
    hasTouch: Boolean(vp.mobile),
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // First screen as a visitor sees it.
  await page.screenshot({ path: `${outDir}/${vp.name}-first.png` });

  // Scroll through so lazy images load, then capture the whole page.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(vp.height * 0.8)) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${outDir}/${vp.name}-full.png`, fullPage: true });
  console.log(`${vp.name}: ${height}px tall`);
  await context.close();
}

await browser.close();
