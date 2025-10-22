import { test, expect } from '@playwright/test';

const { APP_URL, API_URL, CMS_URL } = process.env;

if (!APP_URL || !API_URL || !CMS_URL) {
  throw new Error('APP_URL, API_URL, and CMS_URL environment variables must be set for smoke tests.');
}

test('web loads', async ({ page }) => {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/./);
});

test('api healthz is ok', async ({ request }) => {
  const response = await request.get(`${API_URL}/healthz`);
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.ok).toBeTruthy();
});

test('cms admin reachable', async ({ request }) => {
  const response = await request.get(`${CMS_URL}/admin`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBeLessThan(500);
});
