import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    extraHTTPHeaders: { "x-kdf-e2e-catalogue": "1" },
  },
  webServer: {
    command: "npm run dev",
    env: { E2E_USE_DEVELOPMENT_CATALOGUE: "1" },
    url: "http://127.0.0.1:3000/de",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
