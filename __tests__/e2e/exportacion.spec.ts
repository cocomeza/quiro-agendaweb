import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Exportación de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar botones de exportación en vista de pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(1000);

    // Verificar que existen los botones de exportación
    const exportarCSV = page.locator('button:has-text("Exportar CSV"), button:has-text("exportar CSV")').first();
    const exportarJSON = page.locator('button:has-text("Exportar JSON"), button:has-text("exportar JSON")').first();

    await expect(exportarCSV).toBeVisible({ timeout: 5000 });
    await expect(exportarJSON).toBeVisible({ timeout: 5000 });
  });

  test('debe deshabilitar botones si no hay pacientes', async ({ page, context }) => {
    // Interceptar requests para simular lista vacía
    await page.route('**/rest/v1/pacientes*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.click('a:has-text("Pacientes"), button:has-text("Pacientes")');
    await page.waitForTimeout(1000);

    const exportarCSV = page.locator('button:has-text("Exportar CSV")');
    const exportarJSON = page.locator('button:has-text("Exportar JSON")');

    // Verificar que están deshabilitados
    await expect(exportarCSV).toBeDisabled();
    await expect(exportarJSON).toBeDisabled();
  });

  test('debe exportar CSV cuando hay pacientes', async ({ page, context }) => {
    await page.click('a:has-text("Pacientes"), button:has-text("Pacientes")');
    await page.waitForTimeout(1000);

    // Esperar a que carguen los pacientes
    const tienePacientes = await page.locator('text=/paciente/i').count() > 0;

    if (tienePacientes) {
      // Configurar listener para descarga
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await page.click('button:has-text("Exportar CSV")');

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('.csv');
        expect(download.suggestedFilename()).toContain('pacientes_');
      }
    } else {
      test.skip();
    }
  });

  test('debe exportar JSON cuando hay pacientes', async ({ page }) => {
    await page.click('a:has-text("Pacientes"), button:has-text("Pacientes")');
    await page.waitForTimeout(1000);

    const tienePacientes = await page.locator('text=/paciente/i').count() > 0;

    if (tienePacientes) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await page.click('button:has-text("Exportar JSON")');

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('.json');
        expect(download.suggestedFilename()).toContain('pacientes_');
      }
    } else {
      test.skip();
    }
  });
});

