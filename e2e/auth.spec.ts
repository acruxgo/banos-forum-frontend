import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  
  test('debe mostrar formulario de login', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que existe el formulario
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe rechazar credenciales inválidas', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error (ajusta según tu implementación)
    await expect(page.locator('text=/error|inválid|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe hacer login exitoso como admin', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verificar redirección exitosa
    await page.waitForURL(/\/(reportes|dashboard)/, { timeout: 10000 });
    
    // Verificar que está en la página correcta
    await expect(page.locator('text=/Administrador|Admin|Reportes/i')).toBeVisible();
  });

  test('debe hacer logout correctamente', async ({ page }) => {
    // Login primero
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(reportes|dashboard)/);
    
    // Logout
    await page.click('button:has-text("Salir")');
    
    // Verificar que volvió al login
    await page.waitForURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});