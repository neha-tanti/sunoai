import { defineConfig, devices } from '@playwright/test';
import { TEAM_LEADER_STATE } from './e2e/support/team-leader';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /signed-in\//,
    },
    {
      name: 'sign in',
      testMatch: /sign-in\.setup\.ts/,
      teardown: 'sign out',
    },
    { name: 'sign out', testMatch: /sign-out\.teardown\.ts/ },
    {
      name: 'signed in',
      use: { ...devices['Desktop Chrome'], storageState: TEAM_LEADER_STATE },
      testMatch: /signed-in\/.*\.spec\.ts/,
      dependencies: ['sign in'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
