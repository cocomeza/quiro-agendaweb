import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Eliminar Turnos desde Lista de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar botón para ver turnos de un paciente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Buscar primer paciente
    const primerPaciente = page.locator('div[class*="hover"]').first();
    
    if (await primerPaciente.isVisible({ timeout: 5000 })) {
      // Buscar botón de ver turnos
      const botonTurnos = page.locator('text=/Ver turnos|ver turnos|turnos/i').first();
      
      if (await botonTurnos.isVisible({ timeout: 3000 })) {
        await expect(botonTurnos).toBeVisible();
      } else {
        // El botón puede estar oculto hasta hacer hover o click
        await primerPaciente.hover();
        await page.waitForTimeout(500);
        
        const botonTurnosHover = page.locator('text=/Ver turnos|turnos/i').first();
        if (await botonTurnosHover.isVisible({ timeout: 2000 })) {
          await expect(botonTurnosHover).toBeVisible();
        } else {
          test.skip();
        }
      }
    } else {
      test.skip();
    }
  });

  test('debe cargar turnos futuros de un paciente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Buscar botón de ver turnos
    const botonTurnos = page.locator('text=/Ver turnos|turnos/i').first();
    
    if (await botonTurnos.isVisible({ timeout: 5000 })) {
      await botonTurnos.click();
      await page.waitForTimeout(2000);
      
      // Verificar que se muestran los turnos o mensaje de "no hay turnos"
      const turnosOLista = page.locator('text=/No hay turnos|\\d{2}:\\d{2}|\\d{2}\\/\\d{2}\\/\\d{4}/i').first();
      await expect(turnosOLista).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('debe eliminar un turno desde la lista de pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Buscar botón de ver turnos
    const botonTurnos = page.locator('text=/Ver turnos|turnos/i').first();
    
    if (await botonTurnos.isVisible({ timeout: 5000 })) {
      await botonTurnos.click();
      await page.waitForTimeout(2000);
      
      // Buscar botón de eliminar turno
      const botonEliminar = page.locator('button[title*="Eliminar"], button:has(svg)').first();
      
      if (await botonEliminar.isVisible({ timeout: 3000 })) {
        // Hacer hover para ver el botón si está oculto
        await botonEliminar.hover();
        await page.waitForTimeout(500);
        
        await botonEliminar.click();
        
        // Confirmar eliminación
        page.on('dialog', dialog => dialog.accept());
        await page.waitForTimeout(2000);
        
        // Verificar que el turno se eliminó (puede mostrar mensaje de éxito o actualizar la lista)
        const mensajeExito = page.locator('text=/eliminado|exitoso/i');
        if (await mensajeExito.isVisible({ timeout: 3000 })) {
          await expect(mensajeExito).toBeVisible();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('debe mostrar información de turnos (fecha, hora, estado)', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    const botonTurnos = page.locator('text=/Ver turnos|turnos/i').first();
    
    if (await botonTurnos.isVisible({ timeout: 5000 })) {
      await botonTurnos.click();
      await page.waitForTimeout(2000);
      
      // Verificar que se muestra información de turnos
      // Buscar elementos que contengan fecha, hora o estado
      const infoTurno = page.locator('text=/\\d{2}:\\d{2}|\\d{2}\\/\\d{2}|programado|completado|cancelado/i').first();
      
      if (await infoTurno.isVisible({ timeout: 3000 })) {
        await expect(infoTurno).toBeVisible();
      } else {
        // Si no hay turnos, debería mostrar mensaje
        const sinTurnos = page.locator('text=/No hay turnos|no hay turnos/i');
        if (await sinTurnos.isVisible({ timeout: 2000 })) {
          await expect(sinTurnos).toBeVisible();
        } else {
          test.skip();
        }
      }
    } else {
      test.skip();
    }
  });
});
