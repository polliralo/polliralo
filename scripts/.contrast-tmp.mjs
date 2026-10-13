import { chromium } from '@playwright/test';
import sharp from 'sharp';
const b = await chromium.launch();
for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 412, height: 915 }, { width: 768, height: 1024 }]) {
const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/'); await page.waitForLoadState('networkidle');
const ch = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, bb) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bb);
const out = [];
for (const sel of ['.hero__eyebrow', '.hero__title', '.hero__lede']) {
  const box = await page.locator(sel).boundingBox();
  await page.locator(sel).evaluate((el) => (el.style.visibility = 'hidden'));
  const png = await page.screenshot({ clip: box });
  await page.locator(sel).evaluate((el) => (el.style.visibility = ''));
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const v = []; for (let i = 0; i < data.length; i += info.channels) v.push(lum(data[i], data[i + 1], data[i + 2]));
  v.sort((a, c) => a - c);
  const t = lum(251, 248, 242);
  out.push(`${sel.replace('.hero__','')}: p50 ${((t + 0.05) / (v[Math.floor(v.length*0.5)] + 0.05)).toFixed(2)} p99 ${((t + 0.05) / (v[Math.floor(v.length*0.99)] + 0.05)).toFixed(2)}`);
}
console.log(`${vp.width}x${vp.height}`, out.join(' | '));
await page.screenshot({ path: `.qa/hero-${vp.width}.png` });
await ctx.close();
}
await b.close();
