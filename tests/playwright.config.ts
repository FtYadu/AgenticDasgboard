import { defineConfig } from '@playwright/test';

const baseTimeout = 60_000;

export default defineConfig({
  timeout: baseTimeout,
  expect: {
    timeout: 15_000,
  },
  use: {
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'User-Agent': 'agentic-deployer-smoke-test',
    },
  },
});
