// Screenshots and quick health checks for MONO pages, at desktop and phone size.
//
//   node shop/scripts/shots.mjs --paths /,/products/olive-pique-polo/ [--out dir] [--port 4190] [--full] [--wait 800]
//
// Starts its own preview server on --port (default 4190), so several people
// (or agents) can run it at once on different ports. Prints a JSON report per
// page: console errors, failed requests, broken images and sideways overflow.
// Screenshots go to --out (default shop/.qa/shots).

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const flag = (name) => process.argv.includes(`--${name}`);

const port = Number(arg('port', 4190));
const out = arg('out', join(SHOP, '.qa/shots'));
const paths = arg('paths', '/').split(',').map((p) => p.trim()).filter(Boolean);
const full = flag('full');
const wait = Number(arg('wait', 700));
const viewports = (arg('viewports', 'desktop,mobile')).split(',');
const VP = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, hasTouch: true },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};

mkdirSync(out, { recursive: true });

const server = spawn(process.execPath, [join(SHOP, 'scripts/serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 8000);
  server.stdout.on('data', (d) => { if (String(d).includes('preview')) { clearTimeout(t); resolve(); } });
  server.on('exit', (code) => reject(new Error(`server exited ${code}`)));
});

const browser = await chromium.launch();
const report = [];
try {
  for (const vpName of viewports) {
    const context = await browser.newContext({ ...VP[vpName], reducedMotion: flag('reduced') ? 'reduce' : 'no-preference' });
    for (const path of paths) {
      const page = await context.newPage();
      const errors = [];
      const failed = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('requestfailed', (r) => failed.push(r.url()));
      page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
      await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
      if (full) {
        // Scroll through so lazy images and reveals run, then return to the top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.7)) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        });
      }
      await page.waitForTimeout(wait);
      const health = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy').map((i) => i.getAttribute('src')),
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      }));
      const name = `${vpName}${path.replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '') || '-home'}.png`;
      await page.screenshot({ path: join(out, name), fullPage: full });
      report.push({ viewport: vpName, path, file: join(out, name), errors, failed: [...new Set(failed)], ...health });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(JSON.stringify(report, null, 2));
