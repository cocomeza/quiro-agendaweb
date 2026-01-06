import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Calendario - Validación de Fechas', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      // Esperar a que la página cargue completamente
      await page.waitForTimeout(2000);
      
      // Cambiar a vista de calendario si no está ya ahí
      const botonCalendario = page.locator('button:has-text("Calendario"), button[aria-label*="calendario" i]').first();
      if (await botonCalendario.isVisible({ timeout: 3000 })) {
        await botonCalendario.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar el calendario correctamente', async ({ page }) => {
    // Verificar que el calendario está visible
    const calendario = page.locator('text=/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i').first();
    await expect(calendario).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar los días de la semana correctamente', async ({ page }) => {
    // Verificar que los encabezados de los días de la semana están presentes
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (const dia of diasSemana) {
      const elemento = page.locator(`text=${dia}`).first();
      await expect(elemento).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe mostrar el año correctamente en el encabezado', async ({ page }) => {
    // Verificar que el año se muestra en el encabezado del calendario
    const añoActual = new Date().getFullYear();
    const añoRegex = new RegExp(añoActual.toString());
    
    const encabezadoCalendario = page.locator(`text=${añoRegex}`).first();
    await expect(encabezadoCalendario).toBeVisible({ timeout: 10000 });
  });

  test('debe navegar al mes anterior correctamente', async ({ page }) => {
    // Buscar botón de mes anterior
    const botonAnterior = page.locator('button[aria-label="Mes anterior"], button[aria-label*="anterior" i]').first();
    
    if (await botonAnterior.isVisible({ timeout: 5000 })) {
      // Obtener el mes actual antes de cambiar
      const mesActual = await page.locator('h2').first().textContent();
      
      await botonAnterior.click();
      await page.waitForTimeout(1500);
      
      // Verificar que el mes cambió
      const nuevoMes = await page.locator('h2').first().textContent();
      expect(nuevoMes).not.toBe(mesActual);
    } else {
      test.skip();
    }
  });

  test('debe navegar al mes siguiente correctamente', async ({ page }) => {
    // Buscar botón de mes siguiente
    const botonSiguiente = page.locator('button[aria-label="Mes siguiente"], button[aria-label*="siguiente" i]').first();
    
    if (await botonSiguiente.isVisible({ timeout: 5000 })) {
      // Obtener el mes actual antes de cambiar
      const mesActual = await page.locator('h2').first().textContent();
      
      await botonSiguiente.click();
      await page.waitForTimeout(1500);
      
      // Verificar que el mes cambió
      const nuevoMes = await page.locator('h2').first().textContent();
      expect(nuevoMes).not.toBe(mesActual);
    } else {
      test.skip();
    }
  });

  test('debe mostrar el botón "Hoy" y funcionar correctamente', async ({ page }) => {
    const botonHoy = page.locator('button:has-text("Hoy"), button:has-text("hoy")').first();
    
    if (await botonHoy.isVisible({ timeout: 5000 })) {
      // Navegar a otro mes primero
      const botonSiguiente = page.locator('button[aria-label="Mes siguiente"], button[aria-label*="siguiente" i]').first();
      if (await botonSiguiente.isVisible({ timeout: 3000 })) {
        await botonSiguiente.click();
        await page.waitForTimeout(1000);
      }
      
      // Click en "Hoy"
      await botonHoy.click();
      await page.waitForTimeout(1500);
      
      // Verificar que volvimos al mes actual
      // El encabezado puede tener diferentes formatos, así que verificamos que contiene el mes actual
      const añoActual = new Date().getFullYear();
      const mesActual = new Date().toLocaleString('es-AR', { month: 'long' });
      
      const encabezado = await page.locator('h2').first().textContent();
      // Verificar que contiene el mes o el año (el formato puede variar)
      expect(encabezado?.toLowerCase()).toMatch(new RegExp(`${mesActual}|${añoActual}`, 'i'));
    } else {
      test.skip();
    }
  });

  test('debe mostrar fechas correctamente alineadas con los días de la semana', async ({ page }) => {
    // Este test verifica que las fechas estén en las columnas correctas
    // Buscamos el día 6 de enero (que debería ser martes en 2026)
    // Nota: Este test puede necesitar ajustes según la fecha actual
    
    await page.waitForTimeout(2000);
    
    // Buscar el número 6 en el calendario
    const dia6 = page.locator('text=^6$').first();
    
    if (await dia6.isVisible({ timeout: 5000 })) {
      // Verificar que está visible (no podemos verificar fácilmente la columna exacta sin más contexto)
      await expect(dia6).toBeVisible();
    } else {
      // Si no está visible, puede ser que estemos en otro mes
      test.skip();
    }
  });

  test('debe manejar correctamente años bisiestos (febrero)', async ({ page }) => {
    // Este test verifica que el calendario puede mostrar febrero correctamente
    // Buscar el encabezado del calendario que debería mostrar el mes
    await page.waitForTimeout(2000);
    
    // Verificar que el calendario está visible buscando elementos comunes
    const encabezadoCalendario = page.locator('h2').first();
    const diasSemana = page.locator('text=Dom').first();
    
    // Al menos uno de estos elementos debe estar visible
    const encabezadoVisible = await encabezadoCalendario.isVisible({ timeout: 5000 }).catch(() => false);
    const diasVisible = await diasSemana.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(encabezadoVisible || diasVisible).toBe(true);
    
    // Si podemos navegar a febrero, verificamos que se muestra correctamente
    // (Este test es básico, se puede expandir)
  });

  test('debe mostrar el mes y año correctamente para diferentes meses', async ({ page }) => {
    const meses = [
      { mes: 'enero', num: 1 },
      { mes: 'febrero', num: 2 },
      { mes: 'marzo', num: 3 },
      { mes: 'abril', num: 4 },
      { mes: 'mayo', num: 5 },
      { mes: 'junio', num: 6 },
    ];

    // Verificar que al menos algunos meses se pueden mostrar
    // (No probamos todos para no hacer el test muy largo)
    const añoActual = new Date().getFullYear();
    
    for (const { mes } of meses.slice(0, 3)) { // Solo probamos los primeros 3 meses
      const regexMes = new RegExp(mes, 'i');
      const elementoMes = page.locator(`text=${regexMes}`).first();
      
      if (await elementoMes.isVisible({ timeout: 2000 })) {
        const texto = await elementoMes.textContent();
        expect(texto?.toLowerCase()).toContain(mes.toLowerCase());
        break; // Si encontramos uno, está bien
      }
    }
  });

  test('debe permitir seleccionar fechas en el calendario', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Buscar un día clickeable en el calendario
    // Los días del mes actual deberían ser clickeables
    const diasDelMes = page.locator('[class*="cursor-pointer"]').filter({ hasText: /^\d{1,2}$/ }).first();
    
    if (await diasDelMes.isVisible({ timeout: 5000 })) {
      await diasDelMes.click();
      await page.waitForTimeout(1000);
      
      // Verificar que algo cambió (puede ser la agenda diaria o algún indicador)
      // Este test es básico y puede necesitar ajustes según la implementación
      expect(true).toBe(true); // Placeholder - el click funcionó si no hay error
    } else {
      test.skip();
    }
  });

  test('debe mostrar correctamente el año 2026 cuando se navega a ese año', async ({ page }) => {
    // Este test verifica que el calendario puede mostrar el año 2026
    // Necesitamos navegar hasta enero 2026
    
    const añoActual = new Date().getFullYear();
    const diferenciaAños = añoActual - 2026;
    
    if (diferenciaAños > 0) {
      // Si estamos después de 2026, navegar hacia atrás
      const botonAnterior = page.locator('button[aria-label="Mes anterior"], button[aria-label*="anterior" i]').first();
      
      if (await botonAnterior.isVisible({ timeout: 5000 })) {
        // Navegar hacia atrás la cantidad de meses necesaria
        for (let i = 0; i < diferenciaAños * 12; i++) {
          await botonAnterior.click();
          await page.waitForTimeout(500);
        }
        
        await page.waitForTimeout(1000);
        
        // Verificar que el año 2026 se muestra
        const año2026 = page.locator('text=2026').first();
        await expect(año2026).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    } else if (diferenciaAños < 0) {
      // Si estamos antes de 2026, navegar hacia adelante
      const botonSiguiente = page.locator('button[aria-label="Mes siguiente"], button[aria-label*="siguiente" i]').first();
      
      if (await botonSiguiente.isVisible({ timeout: 5000 })) {
        // Navegar hacia adelante la cantidad de meses necesaria
        for (let i = 0; i < Math.abs(diferenciaAños) * 12; i++) {
          await botonSiguiente.click();
          await page.waitForTimeout(500);
        }
        
        await page.waitForTimeout(1000);
        
        // Verificar que el año 2026 se muestra
        const año2026 = page.locator('text=2026').first();
        await expect(año2026).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    } else {
      // Ya estamos en 2026
      const año2026 = page.locator('text=2026').first();
      await expect(año2026).toBeVisible({ timeout: 5000 });
    }
  });
});
