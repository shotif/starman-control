import { defineConfig } from '@playwright/test';

/**
 * Browser journeys run against the production build (`vite preview`), on a phone with touch, a
 * tablet with touch and a desktop with a mouse (D-04). Headless Chromium draws WebGL through
 * SwiftShader, as in Starman Reborn's config.
 */
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    launchOptions: { args: GL_ARGS },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'phone',
      testIgnore: /(screenshots|long|journey|speed)\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: 'tablet',
      testIgnore: /(screenshots|long|journey|speed)\.spec\.ts/,
      use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: 'desktop',
      testIgnore: /(screenshots|long|journey|speed)\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    },
    // The 100-turn games (M2_WORLDS.md §29.3) run after every other journey, alone, so their long
    // load never slows another's first frame.
    {
      name: 'long-phone',
      testMatch: /long\.spec\.ts/,
      dependencies: ['phone', 'tablet', 'desktop', 'screenshots'],
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: 'long-desktop',
      testMatch: /long\.spec\.ts/,
      dependencies: ['phone', 'tablet', 'desktop', 'screenshots'],
      use: { viewport: { width: 1440, height: 900 } },
    },
    // The long journey on a phone (M6_ONE.md §27.1), alone: `npm run journey`.
    {
      name: 'journey-phone',
      testMatch: /journey\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    // Load and speed with phone throttling (M6_ONE.md §27.2), alone: `npm run phone-speed`.
    {
      name: 'speed-phone',
      testMatch: /speed\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    {
      name: 'screenshots',
      testMatch: /screenshots\.spec\.ts/,
    },
  ],
});
