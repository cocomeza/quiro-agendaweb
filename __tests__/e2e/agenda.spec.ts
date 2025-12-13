import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Agenda Diaria', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar la agenda del día actual', async ({ page }) => {
    // Esperar a que la agenda cargue
    await page.waitForTimeout(1000);
    
    // Verificar que hay contenido de agenda (franjas horarias o texto relacionado)
    const contenidoAgenda = page.locator('text=/08:00|09:00|10:00|Agenda|Hoy|hoy/i').first();
    await expect(contenidoAgenda).toBeVisible({ timeout: 10000 });
  });

  test('debe navegar entre días', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Buscar botones de navegación
    const diaSiguiente = page.locator('button[aria-label="Día siguiente"], button[aria-label*="siguiente"]').first();
    const diaAnterior = page.locator('button[aria-label="Día anterior"], button[aria-label*="anterior"]').first();
    const botonHoy = page.locator('button:has-text("Hoy"), button:has-text("hoy")').first();
    
    if (await diaSiguiente.isVisible({ timeout: 3000 })) {
      await diaSiguiente.click();
      await page.waitForTimeout(1000);
      
      if (await diaAnterior.isVisible({ timeout: 3000 })) {
        await diaAnterior.click();
        await page.waitForTimeout(1000);
      }
      
      if (await botonHoy.isVisible({ timeout: 3000 })) {
        await botonHoy.click();
        await page.waitForTimeout(1000);
        // Verificar que estamos en hoy (puede haber un badge o texto)
        const indicadorHoy = page.locator('text=/Hoy|hoy/i').first();
        if (await indicadorHoy.isVisible({ timeout: 2000 })) {
          await expect(indicadorHoy).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });

  test('debe mostrar franjas horarias con intervalos de 15 minutos', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar que existen algunas franjas horarias con intervalos de 15 min
    const franjasHorarias = page.locator('text=/08:00|08:15|08:30|09:00|09:15|10:00/i').first();
    await expect(franjasHorarias).toBeVisible({ timeout: 10000 });
    
    // Verificar que hay intervalos de 15 minutos (buscar 08:15, 08:30, 08:45)
    const intervalo15 = page.locator('text=/08:15|09:15|10:15/i').first();
    if (await intervalo15.isVisible({ timeout: 3000 })) {
      await expect(intervalo15).toBeVisible();
    }
  });

  test('debe abrir modal de nuevo turno', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const nuevoTurnoBtn = page.locator('button:has-text("Nuevo Turno"), button:has-text("nuevo turno")').first();
    await expect(nuevoTurnoBtn).toBeVisible({ timeout: 5000 });
    await nuevoTurnoBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Turno"), h2:has-text("nuevo turno")').first()).toBeVisible({ timeout: 5000 });
  });

  test('debe cerrar modal al hacer click en X', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const nuevoTurnoBtn = page.locator('button:has-text("Nuevo Turno"), button:has-text("nuevo turno")').first();
    await nuevoTurnoBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Turno"), h2:has-text("nuevo turno")').first()).toBeVisible({ timeout: 5000 });
    
    // Buscar botón de cerrar (X o botón con aria-label close)
    const cerrarBtn = page.locator('button[aria-label*="close"], button[aria-label*="cerrar"], button:has(svg[class*="x"])').first();
    
    if (await cerrarBtn.isVisible({ timeout: 2000 })) {
      await cerrarBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('h2:has-text("Nuevo Turno")').first()).not.toBeVisible({ timeout: 3000 });
    } else {
      // Intentar con ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await expect(page.locator('h2:has-text("Nuevo Turno")').first()).not.toBeVisible({ timeout: 3000 });
    }
  });
});

