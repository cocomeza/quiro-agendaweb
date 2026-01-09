import { Page, expect } from '@playwright/test';

/**
 * Helper para hacer login en los tests
 */
export async function login(page: Page) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL y TEST_USER_PASSWORD deben estar configuradas en .env.local');
  }

  // Ir a la página de login
  await page.goto('/login', { waitUntil: 'networkidle' });
  
  // Esperar a que el formulario esté completamente cargado
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await expect(emailInput).toBeEnabled({ timeout: 5000 });
  
  // Limpiar y llenar el campo de email
  await emailInput.clear();
  await emailInput.fill(email);
  
  // Llenar el campo de password
  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  await passwordInput.clear();
  await passwordInput.fill(password);
  
  // Esperar a que el botón esté habilitado y visible
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  
  // Hacer click y esperar la respuesta de la API
  const navigationPromise = page.waitForResponse(
    response => response.url().includes('/api/auth/login') && response.status() === 200,
    { timeout: 15000 }
  ).catch(() => null);
  
  await submitButton.click();
  
  // Esperar a que la respuesta de login se complete
  await navigationPromise;
  
  // Esperar a que la redirección ocurra
  await page.waitForURL('/', { timeout: 20000 });
  
  // Esperar a que el contenido principal esté visible (indicador de que el login fue exitoso)
  await expect(page.locator('text=/Agenda|Pacientes|Seguimiento/i').first()).toBeVisible({ timeout: 15000 });
  
  // Esperar a que la página esté completamente cargada
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // Pequeña pausa adicional para asegurar que todo está estable
  await page.waitForTimeout(1500);
}

/**
 * Helper para navegar a una vista específica
 */
export async function navegarAVista(page: Page, vista: 'agenda' | 'pacientes' | 'seguimiento') {
  const selectores = {
    agenda: 'button:has-text("Agenda")',
    pacientes: 'button:has-text("Pacientes")',
    seguimiento: 'button:has-text("Seguimiento")',
  };

  const selector = selectores[vista];
  const boton = page.locator(selector).first();
  
  await expect(boton).toBeVisible({ timeout: 5000 });
  await boton.click();
  
  // Esperar a que la vista cambie
  await page.waitForTimeout(500);
}

