import { defineConfig, devices } from '@playwright/test';

// SHOP_TEST_PORT lets several test runs work side by side.
const PORT = Number(process.env.SHOP_TEST_PORT) || 4174;

export default defineConfig({
  testDir: 'shop/tests',
  fullyParallel: true,
  reporter: [['list']],
  outputDir: `test-results/shop-${PORT}`,
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: 'node shop/scripts/serve.mjs',
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
