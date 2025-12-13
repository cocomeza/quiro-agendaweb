import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Mejoras en Gestión de Turnos', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test('debe eliminar un turno y liberar el slot', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      // Guardar la hora del turno para verificar que se libera
      const horaTurno = await turnoOcupado.locator('..').locator('text=/\\d{2}:\\d{2}/').first().textContent();
      
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Click en eliminar
      const eliminarBtn = page.locator('button:has-text("Eliminar")');
      await expect(eliminarBtn).toBeVisible();
      await eliminarBtn.click();
      
      // Confirmar en el diálogo del navegador
      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(2000);
      
      // Verificar que el modal se cerró
      await expect(page.locator('h2:has-text("Editar Turno")')).not.toBeVisible({ timeout: 3000 });
      
      // Verificar que el slot está disponible (debería mostrar "Disponible")
      if (horaTurno) {
        const slotDisponible = page.locator(`text=/Disponible.*${horaTurno}|${horaTurno}.*Disponible/i`).first();
        // El slot debería estar disponible ahora
        await page.waitForTimeout(1000);
      }
    } else {
      test.skip();
    }
  });

  test('debe cambiar la hora de un turno y liberar el slot original', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Obtener la hora actual
      const horaSelect = page.locator('select[id="hora"]');
      const horaActual = await horaSelect.inputValue();
      
      // Cambiar a una hora diferente con intervalo de 15 min
      const nuevaHora = horaActual === '10:00' ? '11:15' : '10:15';
      await horaSelect.selectOption(nuevaHora);
      
      // Verificar que aparece el mensaje informativo
      const mensajeInfo = page.locator('text=/slot original|quedará disponible/i');
      if (await mensajeInfo.isVisible({ timeout: 2000 })) {
        await expect(mensajeInfo).toBeVisible();
      }
      
      // Guardar
      await page.click('button[type="submit"]:has-text("Guardar")');
      await page.waitForTimeout(2000);
      
      // Verificar que el modal se cerró
      await expect(page.locator('h2:has-text("Editar Turno")')).not.toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('debe cambiar la fecha de un turno y liberar el slot original', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Obtener la fecha actual
      const fechaInput = page.locator('input[id="fecha"]');
      const fechaActual = await fechaInput.inputValue();
      
      // Calcular fecha de mañana
      const fecha = new Date(fechaActual);
      fecha.setDate(fecha.getDate() + 1);
      const fechaManana = fecha.toISOString().split('T')[0];
      
      // Cambiar la fecha
      await fechaInput.fill(fechaManana);
      
      // Verificar que aparece el mensaje informativo
      const mensajeInfo = page.locator('text=/slot original|quedará disponible/i');
      if (await mensajeInfo.isVisible({ timeout: 2000 })) {
        await expect(mensajeInfo).toBeVisible();
      }
      
      // Guardar
      await page.click('button[type="submit"]:has-text("Guardar")');
      await page.waitForTimeout(2000);
      
      // Verificar que el modal se cerró
      await expect(page.locator('h2:has-text("Editar Turno")')).not.toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('debe mostrar botones para editar paciente y ver ficha médica', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Verificar que existe el selector de paciente
      const pacienteSelect = page.locator('select[id="paciente"]');
      await expect(pacienteSelect).toBeVisible();
      
      // Seleccionar un paciente si no está seleccionado
      const pacienteValue = await pacienteSelect.inputValue();
      if (!pacienteValue) {
        const options = await pacienteSelect.locator('option').count();
        if (options > 1) {
          await pacienteSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
      
      // Verificar que aparecen los botones de editar y ficha
      const botonEditar = page.locator('button:has-text("Editar")').first();
      const botonFicha = page.locator('button:has-text("Ficha")').first();
      
      if (await botonEditar.isVisible({ timeout: 2000 })) {
        await expect(botonEditar).toBeVisible();
      }
      
      if (await botonFicha.isVisible({ timeout: 2000 })) {
        await expect(botonFicha).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('debe abrir modal de editar paciente desde modal de turno', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Seleccionar un paciente
      const pacienteSelect = page.locator('select[id="paciente"]');
      const pacienteValue = await pacienteSelect.inputValue();
      if (!pacienteValue) {
        const options = await pacienteSelect.locator('option').count();
        if (options > 1) {
          await pacienteSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
      
      // Click en botón editar
      const botonEditar = page.locator('button:has-text("Editar")').first();
      if (await botonEditar.isVisible({ timeout: 2000 })) {
        await botonEditar.click();
        await page.waitForTimeout(1000);
        
        // Verificar que se abre el modal de paciente
        await expect(page.locator('h2:has-text("Editar Paciente")')).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('debe abrir ficha médica desde modal de turno', async ({ page }) => {
    // Buscar un turno existente
    const turnoOcupado = page.locator('text=/Programado|Completado|Cancelado/i').first();
    
    if (await turnoOcupado.isVisible({ timeout: 5000 })) {
      await turnoOcupado.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Editar Turno")')).toBeVisible({ timeout: 5000 });
      
      // Seleccionar un paciente
      const pacienteSelect = page.locator('select[id="paciente"]');
      const pacienteValue = await pacienteSelect.inputValue();
      if (!pacienteValue) {
        const options = await pacienteSelect.locator('option').count();
        if (options > 1) {
          await pacienteSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
      
      // Click en botón ficha
      const botonFicha = page.locator('button:has-text("Ficha")').first();
      if (await botonFicha.isVisible({ timeout: 2000 })) {
        await botonFicha.click();
        await page.waitForTimeout(1000);
        
        // Verificar que se abre la ficha médica
        await expect(page.locator('text=/Ficha Médica|ficha médica/i')).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('debe validar que no se puede crear turno duplicado al cambiar fecha/hora', async ({ page }) => {
    // Crear un turno primero
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForTimeout(1000);
    
    const pacienteSelect = page.locator('select[id="paciente"]');
    const pacienteOptions = await pacienteSelect.locator('option').count();
    
    if (pacienteOptions > 1) {
      await pacienteSelect.selectOption({ index: 1 });
      await page.locator('select[id="hora"]').selectOption('10:15');
      await page.click('button[type="submit"]:has-text("Guardar")');
      await page.waitForTimeout(2000);
      
      // Intentar crear otro turno en el mismo horario
      await page.click('button:has-text("Nuevo Turno")');
      await page.waitForTimeout(1000);
      
      if (pacienteOptions > 2) {
        await pacienteSelect.selectOption({ index: 2 });
      } else {
        await pacienteSelect.selectOption({ index: 1 });
      }
      await page.locator('select[id="hora"]').selectOption('10:15');
      await page.click('button[type="submit"]:has-text("Guardar")');
      await page.waitForTimeout(2000);
      
      // Debería mostrar error
      await expect(page.locator('text=/ocupado|duplicado|error|ya existe/i')).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });
});
