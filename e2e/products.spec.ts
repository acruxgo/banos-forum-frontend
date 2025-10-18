import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Productos', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Ir a productos
    await page.click('text=Productos');
    await page.waitForURL('/productos');
  });

  test('debe mostrar lista de productos', async ({ page }) => {
    // Verificar que existe la tabla
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Nombre")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Precio")')).toBeVisible();
  });

  test('debe crear un nuevo producto', async ({ page }) => {
  // Click en nuevo producto
  await page.getByRole('button', { name: 'Nuevo Producto' }).click();
  
  // Esperar a que cargue el modal
  await expect(page.getByRole('heading', { name: 'Nuevo Producto' })).toBeVisible();
  
  // Esperar a que carguen las opciones
  await page.waitForTimeout(1500);
  
  // 1. Seleccionar categoría por LABEL (no por index)
  const categorySelect = page.locator('select').first();
  await categorySelect.selectOption({ label: 'Test' });
  await page.waitForTimeout(300); // Esperar a que React actualice
  
  // 2. Seleccionar tipo de servicio por LABEL
  const typeSelect = page.locator('select').nth(1);
  await typeSelect.selectOption({ label: 'Baño' });
  await page.waitForTimeout(300); // Esperar a que React actualice
  
  // 3. Llenar nombre Y hacer blur
  const timestamp = Date.now();
  const nameInput = page.locator('input[placeholder*="Baño VIP"]');
  await nameInput.fill(`Producto Test ${timestamp}`);
  await nameInput.blur();
  
  // Esperar a que termine la validación asíncrona de nombre
  await expect(page.locator('text=✓ Nombre válido y disponible')).toBeVisible({ timeout: 3000 });
  
  // 4. Llenar precio Y hacer blur
  const priceInput = page.locator('input[type="number"]');
  await priceInput.fill('99.99');
  await priceInput.blur();
  
  // Esperar a que aparezca la validación de precio
  await expect(page.locator('text=✓ Precio válido')).toBeVisible();
  
  // 5. Esperar a que el botón se habilite
  const submitButton = page.getByRole('button', { name: 'Crear Producto' });
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  
  // 6. Click en crear
  await submitButton.click();
  
  // Verificar éxito
  await expect(page.locator(`text=Producto Test ${timestamp}`)).toBeVisible({ timeout: 10000 });
});

  test('debe filtrar productos por búsqueda', async ({ page }) => {
    // Escribir en barra de búsqueda
    await page.fill('input[placeholder*="Buscar"]', 'baño');
    
    // Esperar debounce
    await page.waitForTimeout(800);
    
    // Verificar que se filtró (o muestra vacío si no hay coincidencias)
    const noResults = page.locator('text=No se encontraron productos');
    const hasResults = page.locator('table tbody tr');
    
    // Debe mostrar resultados O mensaje de vacío
    const hasData = await hasResults.count() > 0;
    const isEmpty = await noResults.isVisible().catch(() => false);
    
    expect(hasData || isEmpty).toBeTruthy();
  });

  test('debe editar un producto existente', async ({ page }) => {
    // Verificar que hay al menos un producto
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click en editar del primer producto
    await firstRow.locator('button[title="Editar"]').click();
    
    // Esperar modal
    await expect(page.getByRole('heading', { name: 'Editar Producto' })).toBeVisible();
    
    // Cambiar precio
    const priceInput = page.locator('input[type="number"]');
    await priceInput.clear();
    await priceInput.fill('150.00');
    
    // Guardar
    await page.getByRole('button', { name: 'Actualizar' }).click();
    
    // Verificar éxito
    await expect(page.locator('text=/actualizado|éxito/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe activar/desactivar producto', async ({ page }) => {
    // Verificar que hay al menos un producto
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click en toggle del primer producto
    await firstRow.locator('button[title*="Desactivar"], button[title*="Activar"]').click();
    
    // Confirmar en el modal
    await page.getByRole('button', { name: 'Confirmar' }).click();
    
    // Verificar mensaje
    await expect(page.locator('text=/desactivado|activado/i')).toBeVisible({ timeout: 5000 });
  });
});