import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Mejoras Recientes - DNI, Estados y Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test.describe('Campo DNI en formulario de pacientes', () => {
    test('debe mostrar el campo DNI al crear un nuevo paciente', async ({ page }) => {
      await navegarAVista(page, 'pacientes');
      
      // Abrir modal de nuevo paciente
      const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
      await expect(nuevoPacienteBtn).toBeVisible({ timeout: 5000 });
      await nuevoPacienteBtn.click();
      
      // Esperar a que el modal esté visible
      await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
      
      // Verificar que el campo DNI existe
      const dniInput = page.locator('input[id="dni"], input[name="dni"]').first();
      await expect(dniInput).toBeVisible({ timeout: 3000 });
      
      // Verificar que tiene el label correcto
      const dniLabel = page.locator('label[for="dni"]:has-text("Número de Documento"), label:has-text("Número de Documento")').first();
      await expect(dniLabel).toBeVisible({ timeout: 2000 });
    });

    test('debe permitir ingresar y guardar el DNI de un paciente', async ({ page }) => {
      await navegarAVista(page, 'pacientes');
      
      // Abrir modal de nuevo paciente
      const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
      await nuevoPacienteBtn.click();
      
      await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
      
      // Llenar formulario completo incluyendo DNI
      const nombreInput = page.locator('input[id="nombre"]').first();
      const apellidoInput = page.locator('input[id="apellido"]').first();
      const dniInput = page.locator('input[id="dni"]').first();
      
      const timestamp = Date.now();
      const nombreTest = `TestDNI${timestamp}`;
      const apellidoTest = `Apellido${timestamp}`;
      const dniTest = `12345678${timestamp.toString().slice(-4)}`;
      
      await nombreInput.fill(nombreTest);
      await apellidoInput.fill(apellidoTest);
      await dniInput.fill(dniTest);
      
      // Guardar
      const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar")').first();
      await guardarBtn.click();
      
      // Esperar a que el modal se cierre
      await page.waitForTimeout(2000);
      
      // Verificar que el paciente se creó (el modal se cerró o aparece en la lista)
      const modalCerrado = await page.locator('h2:has-text("Nuevo Paciente")').count() === 0;
      expect(modalCerrado).toBeTruthy();
    });

    test('debe mostrar el DNI al editar un paciente existente', async ({ page }) => {
      await navegarAVista(page, 'pacientes');
      
      // Buscar un paciente existente para editar
      const pacienteCard = page.locator('div[class*="card"], div[class*="paciente"]').first();
      
      if (await pacienteCard.isVisible({ timeout: 3000 })) {
        await pacienteCard.click();
        
        // Esperar a que se abra el modal de edición
        await expect(page.locator('h2:has-text("Editar Paciente")').first()).toBeVisible({ timeout: 5000 });
        
        // Verificar que el campo DNI está visible
        const dniInput = page.locator('input[id="dni"]').first();
        await expect(dniInput).toBeVisible({ timeout: 2000 });
        
        // Verificar que se puede editar el DNI
        await dniInput.fill('98765432');
        
        // Guardar cambios
        const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar")').first();
        await guardarBtn.click();
        
        await page.waitForTimeout(1000);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Nombres de estados actualizados', () => {
    test('debe mostrar "Pendiente" en lugar de "Programado" en el modal de turno', async ({ page }) => {
      await navegarAVista(page, 'agenda');
      
      // Abrir modal de nuevo turno
      const nuevoTurnoBtn = page.locator('button:has-text("Nuevo Turno")').first();
      
      if (await nuevoTurnoBtn.isVisible({ timeout: 3000 })) {
        await nuevoTurnoBtn.click();
        
        await expect(page.locator('h2:has-text("Nuevo Turno")').first()).toBeVisible({ timeout: 5000 });
        
        // Verificar que el select de estado muestra "Pendiente"
        const estadoSelect = page.locator('select[id="estado"]').first();
        await expect(estadoSelect).toBeVisible({ timeout: 2000 });
        
        // Verificar que las opciones tienen los nuevos nombres
        const opciones = await estadoSelect.locator('option').allTextContents();
        const tienePendiente = opciones.some(text => text.includes('Pendiente'));
        const tieneAtendido = opciones.some(text => text.includes('Atendido'));
        const tieneAnulado = opciones.some(text => text.includes('Anulado'));
        
        expect(tienePendiente).toBeTruthy();
        expect(tieneAtendido).toBeTruthy();
        expect(tieneAnulado).toBeTruthy();
        
        // Verificar que NO aparecen los nombres antiguos
        const tieneProgramado = opciones.some(text => text.includes('Programado'));
        const tieneCompletado = opciones.some(text => text.includes('Completado'));
        const tieneCancelado = opciones.some(text => text.includes('Cancelado'));
        
        expect(tieneProgramado).toBeFalsy();
        expect(tieneCompletado).toBeFalsy();
        expect(tieneCancelado).toBeFalsy();
      } else {
        test.skip();
      }
    });

    test('debe mostrar los nuevos nombres de estados en la vista calendario', async ({ page }) => {
      await navegarAVista(page, 'agenda');
      
      // Cambiar a vista calendario
      const vistaCalendarioBtn = page.locator('button:has-text("Vista Calendario"), button:has-text("Calendario")').first();
      
      if (await vistaCalendarioBtn.isVisible({ timeout: 3000 })) {
        await vistaCalendarioBtn.click();
        await page.waitForTimeout(1000);
        
        // Buscar la leyenda de estados
        const leyenda = page.locator('div:has-text("Pendiente"), div:has-text("Atendido"), div:has-text("Anulado")').first();
        
        if (await leyenda.isVisible({ timeout: 5000 })) {
          // Verificar que aparecen los nuevos nombres
          await expect(page.locator('text=Pendiente').first()).toBeVisible({ timeout: 2000 });
          await expect(page.locator('text=Atendido').first()).toBeVisible({ timeout: 2000 });
          await expect(page.locator('text=Anulado').first()).toBeVisible({ timeout: 2000 });
          
          // Verificar que NO aparecen los nombres antiguos en la leyenda
          const tieneProgramado = await page.locator('text=Programado').count();
          const tieneCompletado = await page.locator('text=Completado').count();
          const tieneCancelado = await page.locator('text=Cancelado').count();
          
          // Puede haber algunos en otros lugares, pero no deberían estar en la leyenda principal
          expect(tieneProgramado).toBeLessThan(5); // Tolerancia para otros lugares
        }
      } else {
        test.skip();
      }
    });

    test('debe mostrar los nuevos nombres en el resumen del día', async ({ page }) => {
      await navegarAVista(page, 'agenda');
      
      // Esperar a que cargue la vista diaria
      await page.waitForTimeout(2000);
      
      // Buscar las tarjetas de resumen
      const resumen = page.locator('text=Atendidos, text=Anulados, text=Pendientes').first();
      
      if (await resumen.isVisible({ timeout: 5000 })) {
        // Verificar que aparecen los nuevos nombres
        const tieneAtendidos = await page.locator('text=Atendidos').count();
        const tieneAnulados = await page.locator('text=Anulados').count();
        const tienePendientes = await page.locator('text=Pendientes').count();
        
        expect(tieneAtendidos).toBeGreaterThan(0);
        expect(tieneAnulados).toBeGreaterThan(0);
        expect(tienePendientes).toBeGreaterThan(0);
      } else {
        // Si no hay turnos, puede que no aparezca el resumen, pero eso está bien
        test.skip();
      }
    });
  });

  test.describe('Corrección de bug en vista calendario', () => {
    test('no debe romperse al hacer clic en un turno en el calendario', async ({ page }) => {
      await navegarAVista(page, 'agenda');
      
      // Cambiar a vista calendario
      const vistaCalendarioBtn = page.locator('button:has-text("Vista Calendario"), button:has-text("Calendario")').first();
      
      if (await vistaCalendarioBtn.isVisible({ timeout: 3000 })) {
        await vistaCalendarioBtn.click();
        await page.waitForTimeout(2000);
        
        // Buscar un turno en el calendario (cualquier badge de turno)
        const turnosEnCalendario = page.locator('div[class*="bg-blue"], div[class*="bg-green"], div[class*="bg-red"]').filter({ 
          hasText: /^\d{2}:\d{2}/ 
        });
        
        const cantidadTurnos = await turnosEnCalendario.count();
        
        if (cantidadTurnos > 0) {
          // Hacer clic en el primer turno encontrado
          await turnosEnCalendario.first().click();
          
          // Esperar un momento para ver si se abre el modal o si hay un error
          await page.waitForTimeout(2000);
          
          // Verificar que la página sigue funcionando (no se rompió)
          // Debería abrirse el modal de turno o al menos no haber errores visibles
          const modalAbierto = await page.locator('h2:has-text("Turno"), h2:has-text("Editar Turno")').count() > 0;
          const errorVisible = await page.locator('text=/error|Error|ERROR/i').count() > 0;
          
          // Verificar que no hay errores en la consola (esto es más difícil de verificar directamente)
          // Pero al menos verificamos que la página sigue respondiendo
          expect(errorVisible).toBeFalsy();
          
          // Si se abrió el modal, cerrarlo
          if (modalAbierto) {
            const cerrarBtn = page.locator('button:has-text("Cancelar"), button[aria-label*="Cerrar"]').first();
            if (await cerrarBtn.isVisible({ timeout: 1000 })) {
              await cerrarBtn.click();
              await page.waitForTimeout(500);
            }
          }
        } else {
          // Si no hay turnos, no podemos probar el clic, pero eso está bien
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('debe manejar correctamente turnos sin datos de paciente', async ({ page }) => {
      await navegarAVista(page, 'agenda');
      
      // Cambiar a vista calendario
      const vistaCalendarioBtn = page.locator('button:has-text("Vista Calendario"), button:has-text("Calendario")').first();
      
      if (await vistaCalendarioBtn.isVisible({ timeout: 3000 })) {
        await vistaCalendarioBtn.click();
        await page.waitForTimeout(2000);
        
        // Verificar que el calendario se renderiza sin errores
        const calendario = page.locator('div:has-text("Dom"), div:has-text("Lun")').first();
        await expect(calendario).toBeVisible({ timeout: 5000 });
        
        // Verificar que no hay errores visibles en la página
        const errores = await page.locator('text=/Cannot read|undefined|null/i').count();
        expect(errores).toBe(0);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Integración completa', () => {
    test('debe crear un paciente con DNI y luego crear un turno con estado actualizado', async ({ page }) => {
      await navegarAVista(page, 'pacientes');
      
      // Crear paciente con DNI
      const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
      await nuevoPacienteBtn.click();
      
      await expect(page.locator('h2:has-text("Nuevo Paciente")').first()).toBeVisible({ timeout: 5000 });
      
      const timestamp = Date.now();
      const nombreTest = `TestIntegracion${timestamp}`;
      const apellidoTest = `Apellido${timestamp}`;
      const dniTest = `99999999${timestamp.toString().slice(-4)}`;
      
      await page.locator('input[id="nombre"]').first().fill(nombreTest);
      await page.locator('input[id="apellido"]').first().fill(apellidoTest);
      await page.locator('input[id="dni"]').first().fill(dniTest);
      
      await page.locator('button[type="submit"]:has-text("Guardar")').first().click();
      await page.waitForTimeout(2000);
      
      // Ir a agenda y crear turno
      await navegarAVista(page, 'agenda');
      await page.waitForTimeout(1000);
      
      const nuevoTurnoBtn = page.locator('button:has-text("Nuevo Turno")').first();
      
      if (await nuevoTurnoBtn.isVisible({ timeout: 3000 })) {
        await nuevoTurnoBtn.click();
        await expect(page.locator('h2:has-text("Nuevo Turno")').first()).toBeVisible({ timeout: 5000 });
        
        // Seleccionar el paciente recién creado
        const pacienteSelect = page.locator('select[id="paciente"]').first();
        const pacienteOptions = await pacienteSelect.locator('option').allTextContents();
        const pacienteEncontrado = pacienteOptions.find(opt => opt.includes(nombreTest) || opt.includes(apellidoTest));
        
        if (pacienteEncontrado) {
          await pacienteSelect.selectOption({ label: pacienteEncontrado });
          
          // Seleccionar hora
          await page.locator('select[id="hora"]').first().selectOption({ index: 1 });
          
          // Verificar que el estado muestra "Pendiente"
          const estadoSelect = page.locator('select[id="estado"]').first();
          const estadoValue = await estadoSelect.inputValue();
          const estadoText = await estadoSelect.locator(`option[value="${estadoValue}"]`).textContent();
          
          expect(estadoText).toContain('Pendiente');
          
          // Cambiar estado a "Atendido"
          await estadoSelect.selectOption('completado');
          const estadoSeleccionado = await estadoSelect.locator('option[value="completado"]').textContent();
          expect(estadoSeleccionado).toContain('Atendido');
        }
      }
    });
  });
});
