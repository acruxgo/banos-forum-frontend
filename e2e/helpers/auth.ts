import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]');
  
  await page.fill('input[type="email"]', 'admin@testing.com');
  await page.fill('input[type="password"]', 'Testing123!');
  
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(reportes|dashboard|productos)/);
}