import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  
  // Esperar a que cargue el formulario
  await page.waitForSelector('input[type="email"]');
  
  // Llenar credenciales (AJUSTA según tus datos de prueba)
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'admin123');
  
  // Click en login
  await page.click('button[type="submit"]');
  
  // Esperar a que redirija (a reportes o dashboard)
  await page.waitForURL(/\/(reportes|dashboard)/);
}

export async function loginAsSuperAdmin(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'superadmin@system.com');
  await page.fill('input[type="password"]', 'super123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/empresas/);
}

export async function loginAsCajero(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'cajero@test.com');
  await page.fill('input[type="password"]', 'cajero123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/caja/);
}