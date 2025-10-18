import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  
  test('debe mostrar formulario de login', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe hacer login exitoso como admin', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'admin@testing.com');
    await page.fill('input[type="password"]', 'Testing123!');
    await page.click('button[type="submit"]');
    
    // Verificar redirección exitosa
    await page.waitForURL(/\/(reportes|dashboard|productos)/, { timeout: 10000 });
    
    // Verificar que está logueado
    await expect(page.locator('text=/Admin Test|Administrador/i')).toBeVisible();
  });
});