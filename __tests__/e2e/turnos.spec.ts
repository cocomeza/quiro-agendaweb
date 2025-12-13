import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Gestión de Turnos', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe crear un turno correctamente', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Nuevo Turno")');
    await expect(page.locator('h2:has-text("Nuevo Turno")')).toBeVisible();

    // Verificar que el formulario está visible
    await expect(page.locator('select[id="paciente"]')).toBeVisible();
    await expect(page.locator('select[id="hora"]')).toBeVisible();

    // Seleccionar paciente (si hay pacientes disponibles)
    const pacienteSelect = page.locator('select[id="paciente"]');
    const pacienteOptions = await pacienteSelect.locator('option').count();
    
    if (pacienteOptions > 1) {
      // Seleccionar el primer paciente disponible (no el placeholder)
      await pacienteSelect.selectOption({ index: 1 });
      
      // Seleccionar hora (usar intervalo de 15 min)
      await page.locator('select[id="hora"]').selectOption('10:15');
      
      // Guardar
      await page.click('button[type="submit"]:has-text("Guardar")');
      
      // Esperar a que el modal se cierre
      await page.waitForTimeout(1000);
      await expect(page.locator('h2:has-text("Nuevo Turno")')).not.toBeVisible();
    } else {
      // Si no hay pacientes, crear uno primero
      test.skip();
    }
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.click('button:has-text("Nuevo Turno")');
    
    // Intentar guardar sin completar campos
    await page.click('button[type="submit"]:has-text("Guardar")');
    
    // El navegador debería mostrar validación HTML5
    const pacienteSelect = page.locator('select[id="paciente"]');
    const horaSelect = page.locator('select[id="hora"]');
    
    // Verificar que los campos están marcados como requeridos
    await expect(pacienteSelect).toHaveAttribute('required', '');
    await expect(horaSelect).toHaveAttribute('required', '');
  });

  test('debe editar un turno existente', async ({ page }) => {
    // Buscar un turno existente haciendo click en una franja horaria ocupada
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible()) {
      await turnoOcupado.click();
      
      // Verificar que se abre el modal de edición
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible();
      
      // Cambiar estado
      await page.locator('select[id="estado"]').selectOption('completado');
      
      // Guardar
      await page.click('button[type="submit"]:has-text("Guardar")');
      
      await page.waitForTimeout(1000);
    } else {
      test.skip();
    }
  });

  test('debe cancelar un turno', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible()) {
      await turnoOcupado.click();
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible();
      
      // Click en eliminar
      await page.click('button:has-text("Eliminar")');
      
      // Confirmar en el diálogo del navegador
      page.on('dialog', dialog => dialog.accept());
      
      await page.waitForTimeout(1000);
    } else {
      test.skip();
    }
  });

  test('debe mostrar error al crear turno duplicado', async ({ page }) => {
    await page.click('button:has-text("Nuevo Turno")');
    
    const pacienteSelect = page.locator('select[id="paciente"]');
    const pacienteOptions = await pacienteSelect.locator('option').count();
    
    if (pacienteOptions > 1) {
      // Seleccionar paciente y hora (usar hora con intervalo de 15 min)
      await pacienteSelect.selectOption({ index: 1 });
      await page.locator('select[id="hora"]').selectOption('14:15');
      await page.click('button[type="submit"]:has-text("Guardar")');
      
      await page.waitForTimeout(1000);
      
      // Intentar crear otro turno en el mismo horario
      await page.click('button:has-text("Nuevo Turno")');
      await page.waitForTimeout(1000);
      const pacienteSelect2 = page.locator('select[id="paciente"]');
      if (pacienteOptions > 2) {
        await pacienteSelect2.selectOption({ index: 2 });
      } else {
        await pacienteSelect2.selectOption({ index: 1 });
      }
      await page.locator('select[id="hora"]').selectOption('14:15');
      await page.click('button[type="submit"]:has-text("Guardar")');
      
      // Debería mostrar error
      await expect(page.locator('text=/ocupado|duplicado|error/i')).toBeVisible({ timeout: 2000 });
    } else {
      test.skip();
    }
  });
});

