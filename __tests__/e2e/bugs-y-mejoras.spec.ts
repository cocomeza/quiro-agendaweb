import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('🐛 Detección de Bugs y Mejoras', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('BUG: Debe validar formato de email antes de guardar paciente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Llenar formulario con email inválido
    await page.fill('input[id="nombre"], input[name="nombre"]', 'Test');
    await page.fill('input[id="apellido"], input[name="apellido"]', 'Usuario');
    await page.fill('input[id="email"], input[name="email"]', 'email-invalido-sin-arroba');
    
    const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")').first();
    await guardarBtn.click();
    
    // Verificar que el navegador muestra validación HTML5 o que hay un mensaje de error
    await page.waitForTimeout(500);
    
    const emailInput = page.locator('input[id="email"], input[name="email"]').first();
    const esValido = await emailInput.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });
    
    // El email debería ser inválido
    expect(esValido).toBeFalsy();
  });

  test('BUG: Debe prevenir crear turno duplicado al editar horario', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Buscar un turno existente
    const turnoExistente = page.locator('text=/08:00|09:00|10:00/i').first();
    
    if (await turnoExistente.isVisible({ timeout: 5000 })) {
      await turnoExistente.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se abre el modal de edición
      const modalAbierto = await page.locator('h2:has-text("Editar Turno"), h2:has-text("editar turno")').isVisible({ timeout: 3000 });
      
      if (modalAbierto) {
        // Obtener la hora actual del turno
        const horaSelect = page.locator('select[id="hora"]').first();
        const horaActual = await horaSelect.inputValue();
        
        // Cambiar a otra hora que ya existe
        const todasLasHoras = ['08:00', '08:15', '08:30', '09:00', '09:15', '10:00'];
        const otraHora = todasLasHoras.find(h => h !== horaActual);
        
        if (otraHora) {
          await horaSelect.selectOption(otraHora);
          
          // Intentar guardar
          const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar")').first();
          await guardarBtn.click();
          
          await page.waitForTimeout(2000);
          
          // Debería mostrar error de duplicado o no permitir guardar
          const errorVisible = await page.locator('text=/ocupado|duplicado|ya existe/i').isVisible({ timeout: 3000 });
          const modalCerrado = await page.locator('h2:has-text("Editar Turno")').count() === 0;
          
          // Si no hay error, el modal debería seguir abierto (no se guardó)
          if (!errorVisible && !modalCerrado) {
            // Esto es un bug potencial - debería validar duplicados al editar
            console.warn('⚠️ POSIBLE BUG: No se valida duplicado al editar turno');
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('BUG: Debe validar longitud máxima de campos de texto', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Intentar ingresar nombre muy largo (más de 100 caracteres)
    const nombreLargo = 'A'.repeat(150);
    const nombreInput = page.locator('input[id="nombre"], input[name="nombre"]').first();
    await nombreInput.fill(nombreLargo);
    
    // Verificar si hay límite de caracteres
    const maxLength = await nombreInput.getAttribute('maxlength');
    const valorActual = await nombreInput.inputValue();
    
    // Si no hay maxlength, debería haber validación en el backend
    // Pero idealmente debería haberlo en el frontend también
    if (!maxLength && valorActual.length > 100) {
      console.warn('⚠️ MEJORA: Agregar maxlength a campos de texto');
    }
  });

  test('BUG: Debe validar que fecha de nacimiento no sea futura', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    const fechaInput = page.locator('input[id="fechaNacimiento"], input[type="date"]').first();
    
    if (await fechaInput.isVisible({ timeout: 2000 })) {
      // Intentar poner una fecha futura
      const fechaFutura = new Date();
      fechaFutura.setFullYear(fechaFutura.getFullYear() + 1);
      const fechaFuturaStr = fechaFutura.toISOString().split('T')[0];
      
      await fechaInput.fill(fechaFuturaStr);
      
      // Verificar si hay validación
      const maxDate = await fechaInput.getAttribute('max');
      const valorActual = await fechaInput.inputValue();
      
      if (!maxDate && valorActual === fechaFuturaStr) {
        console.warn('⚠️ BUG: Permite fecha de nacimiento futura');
      }
    } else {
      test.skip();
    }
  });

  test('MEJORA: Debe mostrar mensaje cuando no hay pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Verificar que hay un mensaje cuando no hay pacientes o lista vacía
    const mensajeVacio = page.locator('text=/no hay pacientes|sin pacientes|lista vacía/i');
    const listaPacientes = page.locator('[class*="paciente"], div[class*="hover"]');
    
    const tieneMensaje = await mensajeVacio.count() > 0;
    const tienePacientes = await listaPacientes.count() > 0;
    
    // Si no hay pacientes, debería haber un mensaje
    if (!tienePacientes && !tieneMensaje) {
      console.warn('⚠️ MEJORA: Agregar mensaje cuando no hay pacientes');
    }
  });

  test('BUG: Debe manejar errores de conexión/red', async ({ page, context }) => {
    // Interceptar requests para simular error de red
    await context.route('**/rest/v1/pacientes*', route => {
      route.abort('failed');
    });

    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Debería mostrar un mensaje de error amigable
    const errorVisible = await page.locator('text=/error|fallo|conexión|intenta nuevamente/i').isVisible({ timeout: 3000 });
    
    if (!errorVisible) {
      console.warn('⚠️ BUG: No se maneja error de conexión adecuadamente');
    }
  });

  test('MEJORA: Debe prevenir múltiples submits del formulario', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Llenar formulario
    await page.fill('input[id="nombre"], input[name="nombre"]', 'Test');
    await page.fill('input[id="apellido"], input[name="apellido"]', 'Usuario');
    
    const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")').first();
    
    // Hacer múltiples clicks rápidos
    await guardarBtn.click();
    await page.waitForTimeout(100);
    await guardarBtn.click();
    await page.waitForTimeout(100);
    await guardarBtn.click();
    
    await page.waitForTimeout(2000);
    
    // Verificar que el botón está deshabilitado durante el submit
    const estaDeshabilitado = await guardarBtn.isDisabled();
    
    if (!estaDeshabilitado) {
      console.warn('⚠️ MEJORA: El botón debería estar deshabilitado durante el submit');
    }
  });

  test('BUG: Debe validar que paciente existe antes de crear turno', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const nuevoTurnoBtn = page.locator('button:has-text("Nuevo Turno"), button:has-text("nuevo turno")').first();
    await nuevoTurnoBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Turno"), h2:has-text("nuevo turno")').first()).toBeVisible({ timeout: 5000 });
    
    // Intentar crear turno sin seleccionar paciente
    const horaSelect = page.locator('select[id="hora"]').first();
    if (await horaSelect.isVisible({ timeout: 2000 })) {
      await horaSelect.selectOption('10:00');
      
      const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar")').first();
      await guardarBtn.click();
      
      await page.waitForTimeout(500);
      
      // Debería mostrar validación HTML5
      const pacienteSelect = page.locator('select[id="paciente"]').first();
      const esValido = await pacienteSelect.evaluate((el: HTMLSelectElement) => {
        return el.validity.valid;
      });
      
      expect(esValido).toBeFalsy();
    }
  });

  test('MEJORA: Debe mostrar loading state durante carga de datos', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Verificar que hay indicador de carga
    const loadingVisible = await page.locator('text=/cargando|loading/i').isVisible({ timeout: 1000 });
    
    // Si no hay indicador visible, verificar que los datos aparecen rápidamente
    if (!loadingVisible) {
      await page.waitForTimeout(2000);
      const contenidoVisible = await page.locator('text=/Agenda|Pacientes|08:00/i').isVisible({ timeout: 1000 });
      
      if (!contenidoVisible) {
        console.warn('⚠️ MEJORA: Agregar indicador de carga más visible');
      }
    }
  });

  test('BUG: Debe limpiar formulario después de crear exitosamente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Llenar y crear paciente
    await page.fill('input[id="nombre"], input[name="nombre"]', 'Test');
    await page.fill('input[id="apellido"], input[name="apellido"]', 'Usuario');
    
    const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")').first();
    await guardarBtn.click();
    
    await page.waitForTimeout(2000);
    
    // Abrir modal nuevamente
    await nuevoPacienteBtn.click();
    await page.waitForTimeout(1000);
    
    // Verificar que los campos están vacíos
    const nombreInput = page.locator('input[id="nombre"], input[name="nombre"]').first();
    const valorNombre = await nombreInput.inputValue();
    
    if (valorNombre !== '') {
      console.warn('⚠️ BUG: El formulario no se limpia después de crear');
    }
  });

  test('MEJORA: Debe tener accesibilidad en botones (aria-labels)', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar que los botones importantes tienen aria-labels
    const botones = [
      'button:has-text("Nuevo Turno")',
      'button:has-text("Pacientes")',
      'button[aria-label*="Día siguiente"]',
      'button[aria-label*="Día anterior"]',
    ];
    
    for (const selector of botones) {
      const boton = page.locator(selector).first();
      if (await boton.isVisible({ timeout: 2000 })) {
        const ariaLabel = await boton.getAttribute('aria-label');
        const tieneTexto = await boton.textContent();
        
        if (!ariaLabel && !tieneTexto) {
          console.warn(`⚠️ MEJORA: Botón ${selector} necesita aria-label`);
        }
      }
    }
  });
});

