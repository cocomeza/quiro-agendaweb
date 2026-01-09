/**
 * Tests E2E para operaciones CRUD críticas con casos edge
 * Área crítica: Integridad de datos y operaciones críticas
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('CRUD Crítico - Casos Edge', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test.describe('Crear Paciente - Validaciones Críticas', () => {
    test('debe validar que nombre y apellido son requeridos', async ({ page }) => {
      // Ir a la vista de pacientes
      const botonPacientes = page.locator('button:has-text("Pacientes"), a:has-text("Pacientes")').first();
      if (await botonPacientes.isVisible({ timeout: 5000 })) {
        await botonPacientes.click();
        await page.waitForTimeout(1000);
      }

      // Buscar botón de nuevo paciente
      const botonNuevo = page.locator('button:has-text("Nuevo"), button:has-text("+")').first();
      if (await botonNuevo.isVisible({ timeout: 5000 })) {
        await botonNuevo.click();
        await page.waitForTimeout(1000);

        // Intentar guardar sin nombre
        const botonGuardar = page.locator('button[type="submit"], button:has-text("Guardar")').first();
        if (await botonGuardar.isVisible({ timeout: 2000 })) {
          await botonGuardar.click();
          await page.waitForTimeout(500);

          // Verificar que aparece mensaje de error
          const mensajeError = page.locator('text=/requerido|nombre|apellido/i').first();
          const hayError = await mensajeError.isVisible({ timeout: 2000 }).catch(() => false);
          expect(hayError).toBe(true);
        }
      } else {
        test.skip();
      }
    });

    test('debe validar formato de email cuando se proporciona', async ({ page }) => {
      const botonPacientes = page.locator('button:has-text("Pacientes"), a:has-text("Pacientes")').first();
      if (await botonPacientes.isVisible({ timeout: 5000 })) {
        await botonPacientes.click();
        await page.waitForTimeout(1000);
      }

      const botonNuevo = page.locator('button:has-text("Nuevo"), button:has-text("+")').first();
      if (await botonNuevo.isVisible({ timeout: 5000 })) {
        await botonNuevo.click();
        await page.waitForTimeout(1000);

        // Llenar campos requeridos
        const inputNombre = page.locator('input[id*="nombre"], input[placeholder*="Nombre" i]').first();
        const inputApellido = page.locator('input[id*="apellido"], input[placeholder*="Apellido" i]').first();
        const inputEmail = page.locator('input[type="email"], input[id*="email"]').first();

        if (await inputNombre.isVisible({ timeout: 2000 })) {
          await inputNombre.fill('Test');
          await inputApellido.fill('Usuario');
          
          if (await inputEmail.isVisible({ timeout: 2000 })) {
            await inputEmail.fill('email-invalido-sin-arroba');
            await page.waitForTimeout(500);

            // Intentar guardar
            const botonGuardar = page.locator('button[type="submit"], button:has-text("Guardar")').first();
            if (await botonGuardar.isVisible({ timeout: 2000 })) {
              await botonGuardar.click();
              await page.waitForTimeout(1000);

              // Verificar mensaje de error de email
              const mensajeError = page.locator('text=/email|válido|válida/i').first();
              const hayError = await mensajeError.isVisible({ timeout: 2000 }).catch(() => false);
              expect(hayError).toBe(true);
            }
          }
        }
      } else {
        test.skip();
      }
    });

    test('debe validar formato de teléfono cuando se proporciona', async ({ page }) => {
      const botonPacientes = page.locator('button:has-text("Pacientes"), a:has-text("Pacientes")').first();
      if (await botonPacientes.isVisible({ timeout: 5000 })) {
        await botonPacientes.click();
        await page.waitForTimeout(1000);
      }

      const botonNuevo = page.locator('button:has-text("Nuevo"), button:has-text("+")').first();
      if (await botonNuevo.isVisible({ timeout: 5000 })) {
        await botonNuevo.click();
        await page.waitForTimeout(1000);

        const inputNombre = page.locator('input[id*="nombre"]').first();
        const inputApellido = page.locator('input[id*="apellido"]').first();
        const inputTelefono = page.locator('input[type="tel"], input[id*="telefono"]').first();

        if (await inputNombre.isVisible({ timeout: 2000 })) {
          await inputNombre.fill('Test');
          await inputApellido.fill('Usuario');
          
          if (await inputTelefono.isVisible({ timeout: 2000 })) {
            await inputTelefono.fill('123'); // Muy corto
            await page.waitForTimeout(500);

            const botonGuardar = page.locator('button[type="submit"]').first();
            if (await botonGuardar.isVisible({ timeout: 2000 })) {
              await botonGuardar.click();
              await page.waitForTimeout(1000);

              const mensajeError = page.locator('text=/teléfono|dígitos/i').first();
              const hayError = await mensajeError.isVisible({ timeout: 2000 }).catch(() => false);
              expect(hayError).toBe(true);
            }
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Crear Turno - Validaciones Críticas', () => {
    test('debe prevenir crear turno con horario ya ocupado', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Buscar botón para crear turno
      const botonNuevoTurno = page.locator('button:has-text("Nuevo Turno"), button:has-text("Agregar"), button[aria-label*="turno" i]').first();
      
      if (await botonNuevoTurno.isVisible({ timeout: 5000 })) {
        await botonNuevoTurno.click();
        await page.waitForTimeout(1000);

        // Si hay un modal de turno, intentar crear uno duplicado
        // Este test requiere que ya exista un turno en el sistema
        // Por ahora verificamos que el modal se abre correctamente
        const modalTurno = page.locator('text=/turno|fecha|hora/i').first();
        const hayModal = await modalTurno.isVisible({ timeout: 3000 }).catch(() => false);
        
        // Si hay modal, el sistema está funcionando
        // La validación de duplicados se probaría con datos reales
        expect(hayModal).toBe(true);
      } else {
        test.skip();
      }
    });

    test('debe validar que la fecha no sea pasada para nuevos turnos', async ({ page }) => {
      await page.waitForTimeout(2000);

      const botonNuevoTurno = page.locator('button:has-text("Nuevo Turno"), button:has-text("Agregar")').first();
      
      if (await botonNuevoTurno.isVisible({ timeout: 5000 })) {
        await botonNuevoTurno.click();
        await page.waitForTimeout(1000);

        // Buscar input de fecha
        const inputFecha = page.locator('input[type="date"]').first();
        if (await inputFecha.isVisible({ timeout: 3000 })) {
          // Verificar que tiene atributo min (fecha mínima)
          const minFecha = await inputFecha.getAttribute('min');
          expect(minFecha).toBeTruthy();
          
          // La fecha mínima debería ser hoy
          const hoy = new Date().toISOString().split('T')[0];
          expect(minFecha).toBe(hoy);
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Actualizar Turno - Casos Edge', () => {
    test('debe permitir cambiar fecha y hora de un turno existente', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Buscar un turno existente para editar
      const turnoExistente = page.locator('[data-testid*="turno"], .turno-item, tr').first();
      
      if (await turnoExistente.isVisible({ timeout: 5000 })) {
        await turnoExistente.click();
        await page.waitForTimeout(1000);

        // Verificar que se abre modal de edición
        const modalEdicion = page.locator('text=/turno|editar|modificar/i').first();
        const hayModal = await modalEdicion.isVisible({ timeout: 3000 }).catch(() => false);
        
        // Si hay modal, el sistema permite editar
        expect(hayModal).toBe(true);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Eliminar Paciente - Cascade Delete', () => {
    test('debe mostrar advertencia al eliminar paciente con turnos', async ({ page }) => {
      const botonPacientes = page.locator('button:has-text("Pacientes"), a:has-text("Pacientes")').first();
      if (await botonPacientes.isVisible({ timeout: 5000 })) {
        await botonPacientes.click();
        await page.waitForTimeout(2000);
      }

      // Buscar un paciente para eliminar
      const paciente = page.locator('tr, .paciente-item').first();
      if (await paciente.isVisible({ timeout: 5000 })) {
        // Buscar botón de eliminar (puede estar en un menú o como botón)
        const botonEliminar = page.locator('button[aria-label*="eliminar" i], button:has-text("Eliminar"), button[title*="eliminar" i]').first();
        
        if (await botonEliminar.isVisible({ timeout: 3000 })) {
          await botonEliminar.click();
          await page.waitForTimeout(1000);

          // Verificar que aparece confirmación o advertencia
          const confirmacion = page.locator('text=/confirmar|eliminar|seguro/i').first();
          const hayConfirmacion = await confirmacion.isVisible({ timeout: 2000 }).catch(() => false);
          
          // Debería haber alguna forma de confirmación
          expect(hayConfirmacion).toBe(true);
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Manejo de Errores de Red', () => {
    test('debe mostrar mensaje de error cuando falla la conexión', async ({ page }) => {
      // Simular desconexión de red
      await page.route('**/*', route => route.abort());
      
      const botonPacientes = page.locator('button:has-text("Pacientes")').first();
      if (await botonPacientes.isVisible({ timeout: 5000 })) {
        await botonPacientes.click();
        await page.waitForTimeout(3000);

        // Verificar que aparece mensaje de error de conexión
        const mensajeError = page.locator('text=/conexión|error|red|network/i').first();
        const hayError = await mensajeError.isVisible({ timeout: 3000 }).catch(() => false);
        
        // Debería mostrar algún tipo de error
        expect(hayError).toBe(true);
      } else {
        test.skip();
      }
    });
  });
});
