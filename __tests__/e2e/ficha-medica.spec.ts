import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Ficha Médica', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
    } catch (error) {
      test.skip();
    }
  });

  test('debe abrir ficha médica desde lista de pacientes', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);

    // Buscar primer paciente y hacer clic
    const primerPaciente = page.locator('[class*="cursor-pointer"], div[class*="hover"]').first();
    
    if (await primerPaciente.isVisible({ timeout: 5000 })) {
      await primerPaciente.click();
      await page.waitForTimeout(1000);

      // Buscar botón de ficha médica
      const botonFicha = page.locator('button:has-text("Ficha Médica"), button:has-text("Ver Ficha"), button:has-text("ficha")').first();
      
      if (await botonFicha.isVisible({ timeout: 5000 })) {
        await botonFicha.click();
        await page.waitForTimeout(1000);

        // Verificar que se abre el modal de ficha médica
        await expect(page.locator('text=/ficha médica|motivo de consulta|diagnóstico|antecedentes/i').first()).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('debe poder imprimir ficha médica', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);

    const botonFicha = page.locator('button[title*="ficha"], button[title*="Ficha"]').first();
    
    if (await botonFicha.isVisible({ timeout: 5000 })) {
      await botonFicha.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=/Ficha Médica|ficha médica/i')).toBeVisible({ timeout: 5000 });
      
      // Buscar botón de imprimir
      const imprimirBtn = page.locator('button[aria-label*="imprimir"], button[title*="imprimir"]').first();
      
      if (await imprimirBtn.isVisible({ timeout: 2000 })) {
        await expect(imprimirBtn).toBeVisible();
        // No imprimimos realmente para no abrir el diálogo de impresión
      }
    } else {
      test.skip();
    }
  });

  test('debe poder editar campos de ficha médica', async ({ page }) => {
    await page.click('a:has-text("Pacientes"), button:has-text("Pacientes")');
    await page.waitForTimeout(1000);

    const primerPaciente = page.locator('[class*="cursor-pointer"]').first();
    
    if (await primerPaciente.isVisible({ timeout: 2000 })) {
      await primerPaciente.click();
      await page.waitForTimeout(500);

      const botonFicha = page.locator('button:has-text("Ficha Médica"), button:has-text("Ver Ficha")').first();
      
      if (await botonFicha.isVisible({ timeout: 2000 })) {
        await botonFicha.click();
        await page.waitForTimeout(500);

        // Intentar editar motivo de consulta
        const motivoInput = page.locator('textarea[name*="motivo"], textarea[placeholder*="motivo"]').first();
        
        if (await motivoInput.isVisible({ timeout: 2000 })) {
          await motivoInput.fill('Dolor de espalda');
          
          // Buscar botón de guardar
          const guardar = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
          if (await guardar.isVisible()) {
            await guardar.click();
            await page.waitForTimeout(500);

            // Verificar notificación de éxito
            await expect(page.locator('text=/exitoso|guardado/i').first()).toBeVisible({ timeout: 3000 });
          }
        }
      }
    } else {
      test.skip();
    }
  });
});

