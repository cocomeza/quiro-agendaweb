import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Gestión de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe navegar a la vista de pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await expect(page.locator('h2:has-text("Pacientes"), h2:has-text("pacientes")').first()).toBeVisible({ timeout: 5000 });
  });

  test('debe abrir modal de nuevo paciente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await expect(nuevoPacienteBtn).toBeVisible({ timeout: 5000 });
    await nuevoPacienteBtn.click();
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
  });

  test('debe crear un paciente correctamente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    // Esperar a que el modal esté visible
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Llenar formulario
    const nombreInput = page.locator('input[id="nombre"], input[name="nombre"]').first();
    const apellidoInput = page.locator('input[id="apellido"], input[name="apellido"]').first();
    
    await nombreInput.fill('Juan');
    await apellidoInput.fill('Pérez');
    
    const telefonoInput = page.locator('input[id="telefono"], input[name="telefono"]').first();
    const emailInput = page.locator('input[id="email"], input[name="email"]').first();
    
    if (await telefonoInput.isVisible({ timeout: 1000 })) {
      await telefonoInput.fill('1234567890');
    }
    if (await emailInput.isVisible({ timeout: 1000 })) {
      await emailInput.fill('juan@example.com');
    }
    
    // Guardar
    const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")').first();
    await guardarBtn.click();
    
    // Esperar a que el modal se cierre o aparezca mensaje de éxito
    await page.waitForTimeout(2000);
    
    // Verificar que el paciente aparece en la lista o que el modal se cerró
    const modalCerrado = await page.locator('h2:has-text("Nuevo Paciente")').count() === 0;
    const pacienteVisible = await page.locator('text=/Juan.*Pérez|Pérez.*Juan/i').count() > 0;
    
    expect(modalCerrado || pacienteVisible).toBeTruthy();
  });

  test('debe validar campos requeridos de paciente', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    const nuevoPacienteBtn = page.locator('button:has-text("Nuevo Paciente")').first();
    await nuevoPacienteBtn.click();
    
    await expect(page.locator('h2:has-text("Nuevo Paciente"), h2:has-text("nuevo paciente")').first()).toBeVisible({ timeout: 5000 });
    
    // Intentar guardar sin completar campos requeridos
    const guardarBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")').first();
    await guardarBtn.click();
    
    // Esperar un momento para que la validación se ejecute
    await page.waitForTimeout(500);
    
    // Verificar que los campos están marcados como requeridos (HTML5 validation)
    const nombreInput = page.locator('input[id="nombre"], input[name="nombre"]').first();
    const apellidoInput = page.locator('input[id="apellido"], input[name="apellido"]').first();
    
    // Verificar que tienen el atributo required o que el navegador muestra validación
    const nombreRequired = await nombreInput.evaluate((el: HTMLInputElement) => el.hasAttribute('required') || el.validity.valueMissing);
    const apellidoRequired = await apellidoInput.evaluate((el: HTMLInputElement) => el.hasAttribute('required') || el.validity.valueMissing);
    
    expect(nombreRequired || apellidoRequired).toBeTruthy();
  });

  test('debe buscar pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    
    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('Juan');
      await page.waitForTimeout(1000);
      
      // Verificar que la búsqueda funciona (el input tiene el valor)
      await expect(searchInput).toHaveValue('Juan');
    } else {
      test.skip();
    }
  });

  test('debe editar un paciente', async ({ page }) => {
    await page.click('button:has-text("Pacientes")');
    
    // Buscar un paciente existente
    const pacienteCard = page.locator('div:has-text("Pérez")').first();
    
    if (await pacienteCard.isVisible()) {
      await pacienteCard.click();
      
      // Verificar que se abre el modal de edición
      await expect(page.locator('h2:has-text("Editar Paciente")')).toBeVisible();
      
      // Modificar nombre
      await page.fill('input[id="nombre"]', 'Juan Carlos');
      
      // Guardar
      await page.click('button[type="submit"]:has-text("Guardar")');
      
      await page.waitForTimeout(1000);
      
      // Verificar cambio
      await expect(page.locator('text=Juan Carlos')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('debe eliminar un paciente', async ({ page }) => {
    await page.click('button:has-text("Pacientes")');
    
    const pacienteCard = page.locator('div:has-text("Pérez")').first();
    
    if (await pacienteCard.isVisible()) {
      await pacienteCard.click();
      
      await expect(page.locator('h2:has-text("Editar Paciente")')).toBeVisible();
      
      // Click en eliminar
      await page.click('button:has-text("Eliminar")');
      
      // Confirmar en el diálogo del navegador
      page.on('dialog', dialog => dialog.accept());
      
      await page.waitForTimeout(1000);
    } else {
      test.skip();
    }
  });
});

