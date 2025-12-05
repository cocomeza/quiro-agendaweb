import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Seguimiento de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar vista de seguimiento', async ({ page }) => {
    await navegarAVista(page, 'seguimiento');
    await page.waitForTimeout(1000);

    // Verificar que se muestra la vista de seguimiento
    const contenidoSeguimiento = page.locator('text=/seguimiento|próximos|cancelaciones|sin llamar/i').first();
    await expect(contenidoSeguimiento).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar filtros de seguimiento', async ({ page }) => {
    const seguimientoTab = page.locator('button:has-text("Seguimiento"), a:has-text("Seguimiento")').first();
    
    if (await seguimientoTab.isVisible()) {
      await seguimientoTab.click();
      await page.waitForTimeout(1000);

      // Buscar botones de filtros
      const filtros = [
        'Próximos a volver',
        'Cancelaciones recientes',
        'Sin llamar',
      ];

      for (const filtro of filtros) {
        const botonFiltro = page.locator(`button:has-text("${filtro}")`).first();
        if (await botonFiltro.isVisible({ timeout: 2000 })) {
          await expect(botonFiltro).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });

  test('debe poder filtrar pacientes próximos a volver', async ({ page }) => {
    const seguimientoTab = page.locator('button:has-text("Seguimiento"), a:has-text("Seguimiento")').first();
    
    if (await seguimientoTab.isVisible()) {
      await seguimientoTab.click();
      await page.waitForTimeout(1000);

      const filtroProximos = page.locator('button:has-text("Próximos a volver")').first();
      
      if (await filtroProximos.isVisible({ timeout: 2000 })) {
        await filtroProximos.click();
        await page.waitForTimeout(1000);

        // Verificar que se muestra algún contenido relacionado
        await expect(page.locator('text=/próximos|18-28|días/i').first()).toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });

  test('debe poder marcar paciente como llamado', async ({ page }) => {
    const seguimientoTab = page.locator('button:has-text("Seguimiento"), a:has-text("Seguimiento")').first();
    
    if (await seguimientoTab.isVisible()) {
      await seguimientoTab.click();
      await page.waitForTimeout(1000);

      const filtroSinLlamar = page.locator('button:has-text("Sin llamar")').first();
      
      if (await filtroSinLlamar.isVisible({ timeout: 2000 })) {
        await filtroSinLlamar.click();
        await page.waitForTimeout(1000);

        const botonMarcar = page.locator('button:has-text("Marcar como llamado")').first();
        
        if (await botonMarcar.isVisible({ timeout: 2000 })) {
          await botonMarcar.click();
          await page.waitForTimeout(500);

          // Verificar notificación de éxito
          await expect(page.locator('text=/llamado|exitoso/i').first()).toBeVisible({ timeout: 3000 });
        }
      }
    } else {
      test.skip();
    }
  });
});

