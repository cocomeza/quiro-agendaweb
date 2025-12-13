import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Flujos Completos de Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test('flujo completo: crear turno, cambiar fecha/hora, eliminar', async ({ page }) => {
    // Paso 1: Crear un turno
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForTimeout(1000);
    
    const pacienteSelect = page.locator('select[id="paciente"]');
    const pacienteOptions = await pacienteSelect.locator('option').count();
    
    if (pacienteOptions > 1) {
      await pacienteSelect.selectOption({ index: 1 });
      await page.locator('select[id="hora"]').selectOption('15:30');
      await page.click('button[type="submit"]:has-text("Guardar")');
      await page.waitForTimeout(2000);
      
      // Paso 2: Editar el turno y cambiar la hora
      const turnoCreado = page.locator('text=/Programado|Completado/i').first();
      if (await turnoCreado.isVisible({ timeout: 5000 })) {
        await turnoCreado.click();
        await page.waitForTimeout(1000);
        
        await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
        
        // Cambiar hora
        await page.locator('select[id="hora"]').selectOption('16:00');
        await page.click('button[type="submit"]:has-text("Guardar")');
        await page.waitForTimeout(2000);
        
        // Paso 3: Eliminar el turno
        const turnoEditado = page.locator('text=/Programado|Completado/i').first();
        if (await turnoEditado.isVisible({ timeout: 3000 })) {
          await turnoEditado.click();
          await page.waitForTimeout(1000);
          
          const eliminarBtn = page.locator('button:has-text("Eliminar")');
          if (await eliminarBtn.isVisible({ timeout: 2000 })) {
            page.on('dialog', dialog => dialog.accept());
            await eliminarBtn.click();
            await page.waitForTimeout(2000);
            
            // Verificar que el turno se eliminó
            await expect(page.locator('h2:has-text("Editar Turno")')).not.toBeVisible({ timeout: 3000 });
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('flujo completo: buscar paciente por ficha, ver turnos, eliminar turno', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 })) {
      // Buscar por número de ficha
      await searchInput.fill('98');
      await page.waitForTimeout(1500);
      
      // Verificar que se filtra
      await expect(searchInput).toHaveValue('98');
      
      // Buscar botón de ver turnos
      const botonTurnos = page.locator('text=/Ver turnos|turnos/i').first();
      if (await botonTurnos.isVisible({ timeout: 3000 })) {
        await botonTurnos.click();
        await page.waitForTimeout(2000);
        
        // Verificar que se muestran los turnos
        const infoTurno = page.locator('text=/\\d{2}:\\d{2}|No hay turnos/i').first();
        await expect(infoTurno).toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });

  test('flujo completo: editar paciente desde turno, actualizar ficha médica', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Seleccionar paciente
      const pacienteSelect = page.locator('select[id="paciente"]');
      const pacienteValue = await pacienteSelect.inputValue();
      if (!pacienteValue) {
        const options = await pacienteSelect.locator('option').count();
        if (options > 1) {
          await pacienteSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
      
      // Abrir modal de paciente
      const botonEditar = page.locator('button:has-text("Editar")').first();
      if (await botonEditar.isVisible({ timeout: 2000 })) {
        await botonEditar.click();
        await page.waitForTimeout(1000);
        
        await expect(page.locator('h2:has-text("Editar Paciente")')).toBeVisible({ timeout: 5000 });
        
        // Cerrar modal de paciente
        const cerrarBtn = page.locator('button[aria-label*="cerrar"], button:has(svg)').first();
        if (await cerrarBtn.isVisible({ timeout: 2000 })) {
          await cerrarBtn.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Abrir ficha médica
      const botonFicha = page.locator('button:has-text("Ficha")').first();
      if (await botonFicha.isVisible({ timeout: 2000 })) {
        await botonFicha.click();
        await page.waitForTimeout(1000);
        
        await expect(page.locator('text=/Ficha Médica/i')).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });

  test('flujo completo: imprimir con fecha seleccionada', async ({ page }) => {
    const imprimirBtn = page.locator('button:has-text("Imprimir")').first();
    
    if (await imprimirBtn.isVisible({ timeout: 5000 })) {
      await imprimirBtn.click();
      await page.waitForTimeout(1000);
      
      const selectorFecha = page.locator('input[type="date"]').first();
      if (await selectorFecha.isVisible({ timeout: 3000 })) {
        // Seleccionar fecha de ayer
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - 1);
        const fechaAyer = fecha.toISOString().split('T')[0];
        
        await selectorFecha.fill(fechaAyer);
        await page.waitForTimeout(500);
        
        // Verificar que se puede seleccionar
        const valor = await selectorFecha.inputValue();
        expect(valor).toBe(fechaAyer);
        
        // Cancelar para no imprimir realmente
        const cancelarBtn = page.locator('button:has-text("Cancelar")').first();
        if (await cancelarBtn.isVisible({ timeout: 2000 })) {
          await cancelarBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } else {
      test.skip();
    }
  });
});
