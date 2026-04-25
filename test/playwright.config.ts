import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'unit/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      testIgnore: [
        '**/google-drive-loader.spec.ts', // API behavior identical across devices
        '**/visual-regression.spec.ts',   // Visual tests control their own viewport sizes
        '**/configurator-*.spec.ts',      // Configurator is a desktop-only tool
        '**/api-hooks.spec.ts',           // Mouse-event callbacks not applicable on mobile
        '**/layout.spec.ts',              // Layout tests check desktop-specific pixel positions
        '**/layout-cluster.spec.ts',
        '**/layout-grid.spec.ts',
        '**/layout-honeycomb.spec.ts',
        '**/layout-radial.spec.ts',
        '**/layout-spiral.spec.ts',
        '**/layout-wave.spec.ts',
      ],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
