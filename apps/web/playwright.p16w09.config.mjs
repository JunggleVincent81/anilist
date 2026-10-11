import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.P16_W09_WEB_PORT);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('P16_W09_WEB_PORT must be an explicit local ephemeral port.');
}
const url = `http://127.0.0.1:${port}`;
const api = 'http://p16-w09-never-resolve.invalid';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'p16-w09-admin-catalog.spec.mjs',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  fullyParallel: false,
  reporter: [['list']],
  outputDir: process.env.P16_W09_TEST_RESULTS,
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    channel: 'chrome',
    serviceWorkers: 'block',
    headless: true,
    baseURL: url,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `node ./node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port ${port}`,
    url: `${url}/admin/catalog/editor`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_API_URL: api,
      NEXT_TELEMETRY_DISABLED: '1',
      DO_NOT_TRACK: '1',
    },
  },
});
