import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Tipos de Servicio', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('text=Tipos de Servicio');
    await page.waitForURL('/tipos-servicio');
  });

  test('debe mostrar lista de tipos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Nombre")')).toBeVisible();
  });

  test('debe crear un nuevo tipo de servicio', async ({ page }) => {
    // Click en crear nuevo
    await page.click('button:has-text("Nuevo Tipo")');
    
    // Llenar formulario
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Baño"]', `Tipo Test ${timestamp}`);
    await page.fill('textarea', 'Descripción de prueba automatizada');
    await page.fill('input[placeholder*="🚽"]', '🧪');
    
    // Guardar
    await page.click('button:has-text("Crear")');
    
    // Verificar que aparece en la lista
    await expect(page.locator(`text=Tipo Test ${timestamp}`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🧪')).toBeVisible();
  });

  test('debe editar un tipo de servicio', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click en editar
    await firstRow.locator('button[title="Editar"]').click();
    
    // Cambiar descripción
    await page.fill('textarea', 'Descripción actualizada por test');
    
    // Guardar
    await page.click('button:has-text("Actualizar")');
    
    // Verificar éxito
    await expect(page.locator('text=/actualizado|éxito/i')).toBeVisible({ timeout: 5000 });
  });
});